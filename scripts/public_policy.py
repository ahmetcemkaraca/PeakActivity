"""Offline, Git-aware checks for the reviewed public source bootstrap."""
import argparse
import fnmatch
import hashlib
import json
import re
import subprocess
from pathlib import Path, PurePosixPath
from urllib.parse import unquote, urlsplit


PolicyConfig = dict
Report = dict
STATUSES = {"Available", "Beta", "Experimental", "Planned", "Unsupported"}
CONFIG_FIELDS = {
    "schema_version", "base_commit", "base_tree", "allowed_changes", "restricted_paths",
    "public_surfaces", "content_rules", "secret_patterns", "capabilities", "experience", "claim_terms",
    "required_statements", "brand_surfaces", "workflow",
}
MARKDOWN_STRUCTURE_RULES = {
    "markdown-h1-count", "markdown-heading-skip", "markdown-unresolved-reference",
    "markdown-trailing-whitespace", "markdown-final-newline",
}
FATAL_RULES = {"invalid-base", "scan-error"}


def git(root, *args):
    return subprocess.run(["git", "-C", str(root), *args], capture_output=True, check=True).stdout


def safe_path(value):
    return (isinstance(value, str) and bool(value) and "\\" not in value
            and not any(ord(char) < 32 for char in value)
            and not re.match(r"^[A-Za-z]:", value)
            and not PurePosixPath(value).is_absolute()
            and all(part not in {"", ".", ".."} for part in value.split("/")))


def strict_json(raw):
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise ValueError("duplicate JSON key")
            result[key] = value
        return result

    def invalid_constant(_):
        raise ValueError("invalid JSON number")

    return json.loads(raw, object_pairs_hook=pairs, parse_constant=invalid_constant)


def validate_config(config):
    if not isinstance(config, dict) or set(config) != CONFIG_FIELDS or config["schema_version"] != 1:
        raise ValueError("invalid policy configuration")
    for field in ("base_commit", "base_tree"):
        if not isinstance(config[field], str) or not re.fullmatch(r"[a-f0-9]{40}", config[field]):
            raise ValueError("invalid base pin")
    for field in ("allowed_changes", "restricted_paths", "public_surfaces", "secret_patterns"):
        if not isinstance(config[field], list) or not all(isinstance(item, str) and item for item in config[field]):
            raise ValueError("invalid policy list")
    for field in ("allowed_changes", "restricted_paths"):
        if not all(safe_path(item) and not any(char in item for char in "*?[") for item in config[field]):
            raise ValueError("policy paths must be exact relative paths")
    for field in ("capabilities", "experience", "workflow"):
        if config[field] is not None and not safe_path(config[field]):
            raise ValueError("invalid policy path")
    for field in ("content_rules", "claim_terms"):
        if not isinstance(config[field], dict):
            raise ValueError("invalid policy mapping")
        for key, values in config[field].items():
            if not re.fullmatch(r"[a-z][a-z0-9-]*", key) or not isinstance(values, list):
                raise ValueError("invalid policy rule")
            if not all(isinstance(value, str) and value for value in values):
                raise ValueError("invalid policy pattern")
    if not isinstance(config["required_statements"], dict):
        raise ValueError("invalid required statements")
    for path, patterns in config["required_statements"].items():
        if not safe_path(path) or any(char in path for char in "*?["):
            raise ValueError("required statement paths must be exact relative paths")
        if not isinstance(patterns, list) or not all(isinstance(item, str) and item for item in patterns):
            raise ValueError("invalid required statement patterns")
        for pattern in patterns:
            re.compile(pattern, re.IGNORECASE)
    if not isinstance(config["brand_surfaces"], list) or not all(
        safe_path(path) and path.endswith(".json") and not any(char in path for char in "*?[")
        for path in config["brand_surfaces"]
    ):
        raise ValueError("brand surface paths must be exact JSON paths")
    for pattern in config["secret_patterns"] + [p for values in config["content_rules"].values() for p in values]:
        re.compile(pattern, re.IGNORECASE)


def without_fences(text):
    # ponytail: supports fenced Markdown, not every Markdown extension; add a parser if public syntax expands.
    result, fence, width = [], None, 0
    for line in text.splitlines(keepends=True):
        marker = re.match(r"^ {0,3}(`{3,}|~{3,})(.*)$", line)
        if marker and fence is None:
            fence, width = marker[1][0], len(marker[1])
            result.append("\n")
        elif marker and marker[1][0] == fence and len(marker[1]) >= width and not marker[2].strip():
            fence = None
            result.append("\n")
        else:
            result.append("\n" if fence else line)
    return "".join(result)


def markdown_label(value):
    return " ".join(value.split()).casefold()


def check_markdown_structure(relative, text, add):
    lines = without_fences(text).splitlines()
    headings = []
    atx = re.compile(r"^ {0,3}(#{1,6})(?:[ \t]+|$)")
    setext = re.compile(r"^ {0,3}(=+|-+)[ \t]*$")

    for index, line in enumerate(lines):
        match = atx.match(line)
        if match:
            headings.append((len(match[1]), index + 1))
            continue
        underline = setext.match(line)
        if not underline or index == 0:
            continue
        previous = lines[index - 1]
        if previous.strip() and not atx.match(previous) and not re.fullmatch(r" {0,3}(?:=+|-+)[ \t]*", previous):
            headings.append((1 if underline[1].startswith("=") else 2, index))

    h1_lines = [line for level, line in headings if level == 1]
    if len(h1_lines) != 1:
        add("markdown-h1-count", relative, h1_lines[1] if len(h1_lines) > 1 else 1)
    previous_level = 0
    for level, line in headings:
        if previous_level and level > previous_level + 1:
            add("markdown-heading-skip", relative, line)
        previous_level = level

    structure_text = without_fences(text)
    references = {
        markdown_label(label)
        for label in re.findall(r"^ {0,3}\[([^\]]+)\]:", structure_text, re.MULTILINE)
    }
    for match in re.finditer(r"(?<!!)\[([^\]\n]+)\]\[([^\]\n]*)\]", structure_text):
        label = markdown_label(match[2] or match[1])
        if label not in references:
            add("markdown-unresolved-reference", relative, structure_text.count("\n", 0, match.start()) + 1)

    for index, line in enumerate(text.splitlines(), 1):
        if line.endswith((" ", "\t")):
            add("markdown-trailing-whitespace", relative, index)
    if not text.endswith("\n"):
        add("markdown-final-newline", relative, max(1, text.count("\n") + 1))


def check_links(root, relative, text, add):
    text = without_fences(text)
    definitions = {key.casefold(): target for key, target in re.findall(
        r"^ {0,3}\[([^\]]+)\]:\s*<?([^\s>]+)>?", text, re.MULTILINE)}
    targets = [(match.start(), match[1]) for match in re.finditer(
        r"\[[^\]\n]*\]\(\s*<?([^\s)>]+)>?(?:\s+[\"'][^\n]*[\"'])?\s*\)", text)]
    targets.extend((match.start(), match[1]) for match in re.finditer(
        r"^ {0,3}\[[^\]]+\]:\s*<?([^\s>]+)>?", text, re.MULTILINE))
    for match in re.finditer(r"\[([^\]\n]+)\]\[([^\]\n]*)\]", text):
        target = definitions.get((match[2] or match[1]).casefold())
        if target is None:
            add("broken-local-link", relative, text.count("\n", 0, match.start()) + 1)
        else:
            targets.append((match.start(), target))
    for position, target in targets:
        parsed = urlsplit(target)
        if parsed.scheme in {"http", "https", "mailto"} or target.startswith("#"):
            continue
        destination = (root / relative).parent / unquote(parsed.path)
        if parsed.scheme or parsed.netloc or not destination.resolve().is_relative_to(root) or not destination.exists():
            add("broken-local-link", relative, text.count("\n", 0, position) + 1)


def load_capabilities(root, config, paths, add):
    relative = config["capabilities"]
    if relative is None:
        return {}
    try:
        path = root / relative
        if path.is_symlink() or not path.resolve().is_relative_to(root):
            raise ValueError("unsafe registry")
        registry = strict_json(path.read_bytes())
        try:
            from scripts.validate_experience import validate_capability_manifest
        except ModuleNotFoundError:
            from validate_experience import validate_capability_manifest
        records, errors = validate_capability_manifest(
            registry, root, paths, config["base_commit"], config["base_tree"], config["content_rules"]
        )
        if errors:
            raise ValueError("invalid capability registry")
        if not set(config["claim_terms"]) <= records.keys():
            raise ValueError("unknown claim capability")
        return records
    except (OSError, ValueError, TypeError, KeyError):
        add("invalid-capability-registry", relative)
        return {}


def load_experience(root, config, add):
    relative = config["experience"]
    if relative is None:
        return
    try:
        path = root / relative
        if path.is_symlink() or not path.resolve().is_relative_to(root):
            raise ValueError("unsafe registry")
        document = strict_json(path.read_bytes())
        try:
            from scripts.validate_experience import validate_experience_document
        except ModuleNotFoundError:
            from validate_experience import validate_experience_document
        if validate_experience_document(document):
            add("invalid-experience-contract", relative)
    except (OSError, ValueError, TypeError, KeyError):
        add("invalid-experience-contract", relative)


def check_claims(relative, text, config, records, add):
    text = without_fences(text)
    text = re.sub(r"(`+).*?\1", "", text, flags=re.S)
    for paragraph in re.split(r"\n\s*\n", text):
        annotations = re.findall(r"<!--\s*capability:([\w-]+):(\w+)\s*-->", paragraph)
        claim = re.sub(r"<!--.*?-->", "", paragraph, flags=re.S).strip()
        ids = [identity for identity, _ in annotations]
        if len(ids) != len(set(ids)):
            add("duplicate-capability-annotation", relative)
        for identity, status in annotations:
            if identity not in records or status not in STATUSES:
                add("unknown-capability", relative)
            elif records[identity]["status"] != status:
                add("capability-status-mismatch", relative)
            if not claim:
                add("empty-capability-claim", relative)
            elif status != "Available" and (
                status.casefold() not in claim.casefold()
                or re.search(r"\b(is|are|now)\s+(available|supported|enabled|shipped)\b", claim, re.I)
            ):
                add("unqualified-capability-claim", relative)
        for identity, terms in config["claim_terms"].items():
            if any(term.casefold() in claim.casefold() for term in terms) and identity not in ids:
                add("unannotated-capability-claim", relative)


def check_bootstrap_workflow(relative, text, add):
    # ponytail: check common GitHub Actions YAML shapes; use a YAML parser if this contract grows to aliases/flow mappings.
    body = "\n".join(line.split("#", 1)[0] for line in text.splitlines())
    if (re.search(r"(?im)^\s*['\"]?(?:release|schedule)['\"]?\s*:", body)
            or re.search(r"(?im)^\s*['\"]?on['\"]?\s*:\s*(?:\[[^\]]*\b(?:release|schedule)\b[^\]]*\]|\b(?:release|schedule)\b)", body)):
        add("bootstrap-publication-trigger", relative)

    lines = body.splitlines()
    for index, line in enumerate(lines):
        permission = re.match(r"^(\s*)['\"]?permissions['\"]?\s*:\s*(.*?)\s*$", line)
        if not permission:
            continue
        indentation, inline = len(permission[1]), permission[2]
        if re.search(r"\bwrite(?:-all)?\b", inline):
            add("bootstrap-write-permission", relative)
            break
        for child in lines[index + 1:]:
            if not child.strip():
                continue
            if len(child) - len(child.lstrip()) <= indentation:
                break
            if re.match(r"^\s*['\"]?[\w-]+['\"]?\s*:\s*write(?:-all)?\b", child):
                add("bootstrap-write-permission", relative)
                break

    if re.search(
        r"(?im)\b(?:npm|pnpm|yarn|cargo|poetry|gradle)\s+publish\b"
        r"|\bmvn\s+deploy\b|\bdocker\s+push\b|\btwine\s+upload\b|\bgem\s+push\b"
        r"|\bgh\s+release\s+(?:create|upload)\b"
        r"|uses:\s*(?:pypa/gh-action-pypi-publish|docker/build-push-action|softprops/action-gh-release|ncipollo/release-action|marvinpinto/action-automatic-releases)@",
        body,
    ):
        add("bootstrap-publication-command", relative)
    if re.search(
        r"(?im)\bgh\s+pr\s+merge\b|^\s*auto-merge\s*:\s*true\b"
        r"|uses:\s*peter-evans/enable-pull-request-automerge@",
        body,
    ):
        add("bootstrap-auto-merge", relative)


def scan_tree(root: Path, config: PolicyConfig, rule_group=None) -> Report:
    root = root.resolve()
    validate_config(config)
    if rule_group not in {None, "markdown-structure"}:
        raise ValueError("unknown policy rule group")
    violations, scanned = [], []

    def add(rule, path="", line=0):
        # Diagnostics are rule labels only: never echo a matched value or Git stderr.
        violations.append({"rule": rule, "path": path, "line": line, "message": rule.replace("-", " ")})

    def report():
        unique = {(item["rule"], item["path"], item["line"], item["message"]): item for item in violations}
        selected = [unique[key] for key in sorted(unique)]
        if rule_group == "markdown-structure":
            selected = [item for item in selected if item["rule"] in MARKDOWN_STRUCTURE_RULES | FATAL_RULES]
        return {
            "passed": not selected,
            "violations": selected,
            "scanned_paths": sorted(scanned),
            "config_sha256": hashlib.sha256(json.dumps(config, sort_keys=True, separators=(",", ":")).encode()).hexdigest(),
        }

    try:
        base = config["base_commit"]
        if git(root, "rev-parse", f"{base}^{{tree}}").decode().strip() != config["base_tree"]:
            raise ValueError("base tree mismatch")
        git(root, "merge-base", "--is-ancestor", base, "HEAD")
        if git(root, "rev-list", "--merges", f"{base}..HEAD").strip():
            add("nonlinear-history")
        # Inspect each new commit as well as the current tree: deleting a private
        # file later does not remove it from published history.
        for commit in git(root, "rev-list", f"{base}..HEAD").decode().splitlines():
            names = git(root, "diff-tree", "--no-commit-id", "--name-only", "--no-renames", "-r", "-z", commit)
            for name in names.split(b"\0"):
                if not name:
                    continue
                relative = name.decode()
                if not safe_path(relative):
                    add("unsafe-history-path")
                    continue
                if relative not in config["allowed_changes"]:
                    add("history-path-not-allowlisted", relative)
                if any(relative == prefix or relative.startswith(prefix + "/") for prefix in config["restricted_paths"]):
                    add("restricted-history-path", relative)
                try:
                    if git(root, "cat-file", "-t", f"{commit}:{relative}").strip() != b"blob":
                        continue
                    raw = git(root, "show", f"{commit}:{relative}")
                except subprocess.CalledProcessError:
                    continue  # Deleted in this commit; the introducing commit is also scanned.
                text = raw.decode("utf-8", errors="replace")
                for pattern in config["secret_patterns"]:
                    if re.search(pattern, text, re.I):
                        add("historical-secret-pattern", relative)
                if any(fnmatch.fnmatchcase(relative, pattern) for pattern in config["public_surfaces"]):
                    for rule, patterns in config["content_rules"].items():
                        if any(re.search(pattern, text, re.I) for pattern in patterns):
                            add("historical-" + rule, relative)
        base_entries = {}
        for entry in git(root, "ls-tree", "-rz", base).split(b"\0"):
            if entry:
                meta, name = entry.split(b"\t", 1)
                base_entries[name.decode()] = meta.split()[0].decode()
        entries = {}
        for entry in git(root, "ls-files", "--stage", "-z").split(b"\0"):
            if entry:
                meta, name = entry.split(b"\t", 1)
                mode, _, stage = meta.decode().split()
                entries[name.decode()] = mode
                if stage != "0":
                    add("unmerged-path", name.decode())
        untracked = {item.decode() for item in git(root, "ls-files", "--others", "--exclude-standard", "-z").split(b"\0") if item}
        changed = {item.decode() for item in git(root, "diff", "--name-only", "--no-renames", "-z", base, "--").split(b"\0") if item} | untracked
        paths = set(entries) | untracked
        modules = {path for path, mode in (base_entries | entries).items() if mode == "160000"}
        # ponytail: read only configured brand metadata inside opaque gitlinks; never recurse through component sources.
        for relative in config["brand_surfaces"]:
            if any(relative.startswith(module + "/") for module in modules if module not in changed):
                continue
            path = root / relative
            if not path.exists():
                continue
            if path.is_symlink() or not path.resolve().is_relative_to(root) or not path.is_file():
                add("invalid-brand-surface", relative)
                continue
            try:
                document = strict_json(path.read_bytes())
            except (OSError, ValueError):
                add("invalid-brand-surface", relative)
                continue
            if not isinstance(document, dict):
                add("invalid-brand-surface", relative)
                continue
            if isinstance(document.get("productName"), str) and re.search(
                r"\bActivityWatch\b", document["productName"], re.I,
            ):
                add("legacy-product-name", relative)
            if isinstance(document.get("identifier"), str) and re.match(
                r"net\.activitywatch(?:\.|$)", document["identifier"], re.I,
            ):
                add("legacy-product-identifier", relative)
        for relative in sorted(changed):
            if relative not in config["allowed_changes"]:
                add("path-not-allowlisted", relative)
        for prefix in config["restricted_paths"]:
            # Exact existence checks include ignored content without descending into caches or gitlinks.
            if (root / prefix).exists() or (root / prefix).is_symlink() or any(p == prefix or p.startswith(prefix + "/") for p in paths):
                add("restricted-path", prefix)
        records = load_capabilities(root, config, paths, add)
        load_experience(root, config, add)
        for relative in sorted(paths):
            if not safe_path(relative):
                add("unsafe-path")
                continue
            if any(relative == module or relative.startswith(module + "/") for module in modules):
                continue
            path = root / relative
            if not path.resolve().is_relative_to(root):
                add("external-symlink", relative)
                continue
            if path.is_symlink():
                if not path.exists():
                    add("broken-symlink", relative)
                continue
            if not path.exists():
                continue  # Allowed deletion; links to it are still checked.
            public = any(fnmatch.fnmatchcase(relative, pattern) for pattern in config["public_surfaces"])
            if relative not in changed and not public:
                continue
            if not path.is_file():
                add("invalid-file-type", relative)
                continue
            raw = path.read_bytes()
            if b"\0" in raw:
                if public:
                    add("invalid-public-text", relative)
                continue
            try:
                text = raw.decode("utf-8")
            except UnicodeDecodeError:
                add("invalid-public-text", relative)
                continue
            scanned.append(relative)
            for pattern in config["secret_patterns"]:
                for match in re.finditer(pattern, text, re.I):
                    add("secret-pattern", relative, text.count("\n", 0, match.start()) + 1)
            if public:
                for rule, patterns in config["content_rules"].items():
                    for pattern in patterns:
                        for match in re.finditer(pattern, text, re.I):
                            add(rule, relative, text.count("\n", 0, match.start()) + 1)
                for pattern in config["required_statements"].get(relative, []):
                    if not re.search(pattern, text, re.I | re.M):
                        add("missing-required-statement", relative)
                if relative.endswith(".md"):
                    if rule_group == "markdown-structure":
                        check_markdown_structure(relative, text, add)
                    check_links(root, relative, text, add)
                    if config["capabilities"]:
                        check_claims(relative, text, config, records, add)
        workflow = config["workflow"]
        if workflow:
            for relative in paths:
                if relative.startswith(".github/workflows/") and relative.endswith((".yml", ".yaml")) and relative != workflow and (root / relative).exists():
                    add("unreviewed-bootstrap-workflow", relative)
            path = root / workflow
            if not path.is_file() or path.is_symlink():
                add("missing-policy-workflow", workflow)
            else:
                text = path.read_text()
                check_bootstrap_workflow(workflow, text, add)
                if re.search(r"pull_request_target|contents:\s*write|branches:\s*\[master\]", text):
                    add("unsafe-workflow", workflow)
                if any(not re.fullmatch(r"[a-f0-9]{40}", revision) for revision in re.findall(r"uses:\s*[\w./-]+@([^\s#]+)", text)):
                    add("unpinned-action", workflow)
    except (OSError, ValueError, subprocess.CalledProcessError):
        add("invalid-base" if not scanned else "scan-error")
    return report()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--config", type=Path)
    parser.add_argument("--format", choices=["json"], default="json")
    parser.add_argument("--rules", choices=["markdown-structure"])
    args = parser.parse_args()
    try:
        path = args.config or args.root / "scripts/public_policy_config.json"
        result = scan_tree(args.root, strict_json(path.read_bytes()), rule_group=args.rules)
    except (OSError, ValueError, TypeError, re.error):
        print(json.dumps({"passed": False, "violations": [{"rule": "invalid-config", "path": "", "line": 0, "message": "invalid config"}], "scanned_paths": [], "config_sha256": None}))
        return 2
    print(json.dumps(result, indent=2))
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
