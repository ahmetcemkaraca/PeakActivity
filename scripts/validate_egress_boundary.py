"""Check that only the approved egress proxy can contact non-loopback origins."""

import argparse
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit


NETWORK_DEPENDENCIES = {"reqwest", "ureq", "hyper", "isahc", "surf", "httpx", "requests"}
RUST_TRANSPORT_PATTERNS = (
    re.compile(r"\breqwest::(?:blocking::)?(?:Client::(?:new|builder)|get|post|put|delete)\s*\("),
    re.compile(r"\bureq::(?:AgentBuilder|(?:get|post|put|delete))\b"),
    re.compile(r"\bTcpStream::connect(?:_timeout)?\s*\("),
)
PYTHON_TRANSPORT_PATTERNS = (
    re.compile(r"\b(?:requests|req)\.(?:Session|get|post|put|delete)\s*\("),
    re.compile(r"\burllib\.request\.urlopen\s*\("),
    re.compile(r"\bhttpx\.(?:Client|AsyncClient|get|post|put|delete)\s*\("),
)
WEB_TRANSPORT_PATTERNS = (
    re.compile(r"\baxios\.(?:create|get|post|put|delete)\s*\("),
    re.compile(r"\bfetch\s*\(|\bXMLHttpRequest\b|\bnew\s+(?:WebSocket|EventSource)\b"),
)
REQWEST_IMPORT = re.compile(r"\buse\s+reqwest::(?:blocking::)?Client\b")
CLIENT_CONSTRUCTOR = re.compile(r"\bClient::(?:new|builder)\s*\(")
URL_LITERAL = re.compile(r"[\"'](?P<url>https?://[^\"']+)[\"']")
SKIP_PARTS = {
    ".git", ".venv", "venv", "node_modules", "target", "dist", "build", ".pytest_cache",
    "__pycache__", "tests", "test", "__tests__", "examples", "media",
}
SAMPLE_URL_FILE = "fakedata.js"


def _source_files(root):
    if not root.is_dir():
        return []
    allowed = {".rs", ".py", ".js", ".ts", ".vue"}
    return [
        path for path in root.rglob("*")
        if path.is_file() and path.suffix in allowed and not (set(path.parts) & SKIP_PARTS)
    ]


def _has_network_transport(text):
    return bool(
        any(pattern.search(text) for pattern in RUST_TRANSPORT_PATTERNS)
        or (REQWEST_IMPORT.search(text) and CLIENT_CONSTRUCTOR.search(text))
    )


def _strip_test_module(text):
    return re.sub(r"(?m)^#\[cfg\(test\)\]\s*mod\s+[A-Za-z0-9_]+\s*\{[\s\S]*\Z", "", text)


def _has_web_or_python_transport(path, text):
    patterns = PYTHON_TRANSPORT_PATTERNS if path.suffix == ".py" else WEB_TRANSPORT_PATTERNS
    return any(pattern.search(text) for pattern in patterns)


def _manifest_network_dependencies(manifest):
    package = re.search(r'(?m)^\s*name\s*=\s*["\']([^"\']+)', manifest.read_text(encoding="utf-8"))
    name = package.group(1) if package else "<workspace>"
    dependencies = []
    for line in manifest.read_text(encoding="utf-8").splitlines():
        line = line.split("#", 1)[0]
        match = re.match(r"\s*([A-Za-z0-9_-]+)\s*=", line)
        if match and match.group(1).lower().replace("-", "") in {item.replace("-", "") for item in NETWORK_DEPENDENCIES}:
            dependencies.append(match.group(1).lower().replace("_", "-"))
    return name, dependencies


def _allowed_loopback_sources(server_root, desktop_root, webui_root, client_root):
    return {
        (server_root / "aw-egress" / "src" / "proxy.rs").resolve(): "egress",
        (server_root / "aw-client-rust" / "src" / "lib.rs").resolve(): "rust-loopback",
        (desktop_root / "src-tauri" / "src" / "ai_credentials.rs").resolve(): "desktop-loopback",
        (webui_root / "src" / "util" / "awclient.ts").resolve(): "webui-loopback",
        (client_root / "aw_client" / "client.py").resolve(): "python-loopback",
    }


def validate_egress_boundary(
    root,
    *,
    server_root=None,
    desktop_root=None,
    webui_root=None,
    client_root=None,
    helper_roots=None,
):
    root = Path(root).resolve()
    server_root = Path(server_root or root / "aw-server-rust").resolve()
    desktop_root = Path(desktop_root or root / "aw-tauri").resolve()
    webui_root = Path(webui_root or desktop_root / "aw-webui").resolve()
    client_root = Path(client_root or root / "aw-client").resolve()
    if helper_roots is None:
        helper_roots = [
            root / name for name in ("aw-watcher-window", "aw-watcher-afk", "awatcher")
            if (root / name).is_dir()
        ]
    helper_roots = [Path(path).resolve() for path in helper_roots]
    errors = []

    for label, path in (("Rust server source", server_root), ("Tauri desktop source", desktop_root),
                        ("WebUI source", webui_root), ("Python client source", client_root)):
        if not path.is_dir():
            errors.append(f"missing {label}: {path}")
    if errors:
        return errors

    egress_source = server_root / "aw-egress" / "src" / "proxy.rs"
    rust_client = server_root / "aw-client-rust" / "src" / "lib.rs"
    web_client = webui_root / "src" / "util" / "awclient.ts"
    python_client = client_root / "aw_client" / "client.py"
    manager = desktop_root / "src-tauri" / "src" / "manager.rs"
    helper_policy = root / "scripts" / "package" / "stage_helpers.py"

    for path in (egress_source, rust_client, web_client, python_client, manager, helper_policy):
        if not path.is_file():
            errors.append(f"missing network-boundary evidence file: {path}")
    if errors:
        return errors

    egress_text = egress_source.read_text(encoding="utf-8")
    for marker in (".https_only(true)", ".no_proxy()", "Policy::none()", "resolve_to_addrs", "resolve_public_addresses"):
        if marker not in egress_text:
            errors.append(f"aw-egress transport is missing required guard: {marker}")

    rust_client_text = rust_client.read_text(encoding="utf-8")
    for marker in ("fn is_loopback_host", "if !is_loopback_host(host)", "baseurl.host_str().is_some_and(is_loopback_host)", ".no_proxy()"):
        if marker not in rust_client_text:
            errors.append(f"aw-client-rust is not verified loopback-only: missing {marker}")

    web_client_text = web_client.read_text(encoding="utf-8")
    if "function isLoopbackApiUrl" not in web_client_text or "!isLoopbackApiUrl(aw_server_url)" not in web_client_text:
        errors.append("WebUI AW_SERVER_URL override is not checked against the loopback allowlist")

    python_client_text = python_client.read_text(encoding="utf-8")
    if 'str(server_host).lower() not in {"127.0.0.1", "localhost", "::1"}' not in python_client_text:
        errors.append("Python aw-client does not reject non-loopback API hosts")
    if "self._session.trust_env = False" not in python_client_text:
        errors.append("Python aw-client still honors environment proxies")

    manager_text = manager.read_text(encoding="utf-8")
    excluded_arrays = re.findall(r"let\s+excluded\s*=\s*\[(.*?)\];", manager_text, re.S)
    if len(excluded_arrays) < 2 or any('"aw-sync"' not in block or '"aw-notify"' not in block for block in excluded_arrays[:2]):
        errors.append("Tauri helper discovery must exclude aw-sync and aw-notify on every supported desktop OS")
    helper_text = helper_policy.read_text(encoding="utf-8")
    if "aw-sync" not in helper_text or "aw-notify" not in helper_text:
        errors.append("native helper packaging must prohibit aw-sync and aw-notify")

    manifests = list(server_root.rglob("Cargo.toml")) + list((desktop_root / "src-tauri").rglob("Cargo.toml"))
    allowed_crates = {
        "aw-egress": {"reqwest"},
        "aw-client-rust": {"reqwest"},
        "peakactivity-desktop": {"reqwest"},
    }
    for manifest in manifests:
        if set(manifest.parts) & SKIP_PARTS:
            continue
        name, dependencies = _manifest_network_dependencies(manifest)
        unexpected = set(dependencies) - allowed_crates.get(name, set())
        for dependency in sorted(unexpected):
            errors.append(f"{manifest.relative_to(root) if manifest.is_relative_to(root) else manifest}: direct network dependency {dependency} is not permitted")
        if name == "peakactivity-desktop" and "reqwest" in dependencies:
            bridge = desktop_root / "src-tauri" / "src" / "ai_credentials.rs"
            if not bridge.is_file():
                errors.append("desktop reqwest is allowed only for the native AI loopback bridge")
            else:
                bridge_text = bridge.read_text(encoding="utf-8")
                for marker in (
                    "local_session::ai_send_session()",
                    'http://127.0.0.1:{port}/api/0/ai/send',
                    'native-preview/{native_preview_id}',
                    '"approval_id": &request.approval_id',
                    'X-PeakActivity-AI-Credential',
                    ".no_proxy()",
                    "Policy::none()",
                    "sanitized_payload",
                    "MessageDialogButtons::OkCancel",
                    "blocking_show()",
                ):
                    if marker not in bridge_text:
                        errors.append(f"native AI loopback bridge is missing required guard: {marker}")
                if "?approval_id=" in bridge_text:
                    errors.append("native-preview approval IDs must stay out of URLs")
                if bridge_text.count("Client::builder()") != 1:
                    errors.append("native AI bridge must have one bounded loopback HTTP client")
                session_source = desktop_root / "src-tauri" / "src" / "local_session.rs"
                if not session_source.is_file() or "Scope::AiSend" not in session_source.read_text(encoding="utf-8"):
                    errors.append("native AI bridge must use the single-route AiSend session scope")

    web_package = webui_root / "package.json"
    if not web_package.is_file():
        errors.append(f"missing WebUI package manifest: {web_package}")
    else:
        package = json.loads(web_package.read_text(encoding="utf-8"))
        deps = package.get("dependencies", {})
        direct_http = set(deps) & {"axios", "node-fetch", "undici", "got", "superagent", "ky"}
        if direct_http - {"axios"}:
            errors.append(f"WebUI has unclassified HTTP dependencies: {', '.join(sorted(direct_http - {'axios'}))}")
        if "axios" in direct_http and "isLoopbackApiUrl" not in web_client_text:
            errors.append("WebUI Axios client is not routed through the loopback origin guard")

    sources = [(server_root, "server"), (desktop_root / "src-tauri" / "src", "desktop"),
               (webui_root / "src", "webui"), (client_root / "aw_client", "python-client")]
    sources.extend((path, "helper") for path in helper_roots)
    allowlisted = _allowed_loopback_sources(server_root, desktop_root, webui_root, client_root)
    for source_root, _label in sources:
        for path in _source_files(source_root):
            resolved = path.resolve()
            text = path.read_text(encoding="utf-8", errors="replace")
            role = allowlisted.get(resolved)
            code = _strip_test_module(text) if path.suffix == ".rs" else text
            has_transport = _has_network_transport(code) if path.suffix == ".rs" else _has_web_or_python_transport(path, code)
            if has_transport and role not in {"egress", "rust-loopback", "desktop-loopback", "webui-loopback", "python-loopback"}:
                errors.append(f"direct network transport outside the approved boundary: {path}")
            if role == "egress" and not egress_text:
                errors.append(f"invalid empty egress transport source: {path}")
            for line_number, line in enumerate(code.splitlines(), 1):
                stripped = line.lstrip()
                if stripped.startswith(("//", "#", "/*", "*", "<!--")) or path.name == SAMPLE_URL_FILE:
                    continue
                for match in URL_LITERAL.finditer(line):
                    value = match.group("url")
                    if "{" in value or "${" in value:
                        continue
                    try:
                        hostname = urlsplit(value).hostname
                    except ValueError:
                        hostname = None
                    if not hostname or hostname in {"127.0.0.1", "localhost", "::1"}:
                        continue
                    normalized_host = hostname.rstrip(".").lower()
                    if (normalized_host.endswith((".example", ".test", ".invalid", ".example.com", ".example.net", ".example.org"))
                            or normalized_host in {"example.com", "example.net", "example.org"}):
                        continue
                    if role == "egress":
                        errors.append(f"hard-coded external URL inside egress transport; use the signed destination registry: {path}:{line_number}")
                    else:
                        errors.append(f"raw external URL outside the destination registry: {path}:{line_number}")
    return sorted(set(errors))


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--server-root", type=Path)
    parser.add_argument("--desktop-root", type=Path)
    parser.add_argument("--webui-root", type=Path)
    parser.add_argument("--client-root", type=Path)
    parser.add_argument("--helper-root", type=Path, action="append")
    args = parser.parse_args(argv)
    errors = validate_egress_boundary(
        args.root,
        server_root=args.server_root,
        desktop_root=args.desktop_root,
        webui_root=args.webui_root,
        client_root=args.client_root,
        helper_roots=args.helper_root,
    )
    if errors:
        for error in errors:
            print(f"egress boundary: {error}", file=sys.stderr)
        return 1
    print(json.dumps({"passed": True, "policy": "one external transport in aw-egress; other clients loopback-only"}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
