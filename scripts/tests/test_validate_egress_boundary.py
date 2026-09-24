import json
import tempfile
import unittest
from pathlib import Path

from scripts.validate_egress_boundary import validate_egress_boundary


class EgressBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.server = self.root / "aw-server-rust"
        self.desktop = self.root / "aw-tauri"
        self.webui = self.desktop / "aw-webui"
        self.client = self.root / "aw-client"
        self._write("aw-server-rust/Cargo.toml", '[workspace]\nmembers = ["aw-egress", "aw-client-rust", "aw-sync", "aw-server"]\n')
        self._write("aw-server-rust/aw-egress/Cargo.toml", '[package]\nname = "aw-egress"\n[dependencies]\nreqwest = "0.12"\n')
        self._write("aw-server-rust/aw-egress/src/proxy.rs", """
use reqwest::blocking::Client;
Client::builder().https_only(true).no_proxy().redirect(Policy::none()).resolve_to_addrs(host, &addresses);
fn resolve_public_addresses() {}
""")
        self._write("aw-server-rust/aw-client-rust/Cargo.toml", '[package]\nname = "aw-client-rust"\n[dependencies]\nreqwest = "0.12"\n')
        self._write("aw-server-rust/aw-client-rust/src/lib.rs", """
fn is_loopback_host(host: &str) -> bool { host == "localhost" }
if !is_loopback_host(host) { return Err(()); }
let baseurl = Url::parse(host)?;
baseurl.host_str().is_some_and(is_loopback_host);
Client::builder().no_proxy();
""")
        self._write("aw-server-rust/aw-sync/Cargo.toml", '[package]\nname = "aw-sync"\n[dependencies]\naw-client-rust = { path = "../aw-client-rust" }\n')
        self._write("aw-server-rust/aw-sync/src/main.rs", "AwClient::new(\"127.0.0.1\", 5666, \"aw-sync\");\n")
        self._write("aw-server-rust/aw-server/Cargo.toml", '[package]\nname = "aw-server"\n[dependencies]\nrocket = "0.5"\n')
        self._write("aw-tauri/Cargo.toml", '[package]\nname = "aw-tauri"\n')
        self._write("aw-tauri/src-tauri/Cargo.toml", '[package]\nname = "peakactivity-desktop"\n')
        self._write("aw-tauri/src-tauri/src/manager.rs", """
#[cfg(unix)] let excluded = ["aw-sync", "aw-notify"];
#[cfg(windows)] let excluded = ["aw-sync", "aw-notify"];
""")
        self._write("aw-tauri/aw-webui/package.json", json.dumps({"name": "aw-webui", "dependencies": {"axios": "1.0.0"}}))
        self._write("aw-tauri/aw-webui/src/util/awclient.ts", """
export function isLoopbackApiUrl(value) { return value === "http://127.0.0.1:5666"; }
if (aw_server_url && !isLoopbackApiUrl(aw_server_url)) throw new Error();
new AWClient("aw-webui", { baseURL });
""")
        self._write("aw-client/aw_client/client.py", """
if str(server_host).lower() not in {"127.0.0.1", "localhost", "::1"}: raise ValueError()
self._session = requests.Session()
self._session.trust_env = False
self._session.get(url)
""")
        self._write("scripts/package/stage_helpers.py", 'PROHIBITED = r"aw-sync|aw-notify"\n')

    def tearDown(self):
        self.temp.cleanup()

    def _write(self, relative, contents):
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(contents, encoding="utf-8")
        return path

    def scan(self):
        return validate_egress_boundary(
            self.root,
            server_root=self.server,
            desktop_root=self.desktop,
            webui_root=self.webui,
            client_root=self.client,
        )

    def test_all_network_clients_are_confined_or_loopback_checked(self):
        self.assertEqual(self.scan(), [])

    def test_rejects_direct_transport_outside_egress_and_loopback_client(self):
        self._write("aw-server-rust/aw-server/src/egress_bypass.rs", "reqwest::Client::new();\n")
        errors = self.scan()
        self.assertTrue(any("aw-server/src/egress_bypass.rs" in error for error in errors))

    def test_allows_only_the_native_scoped_loopback_ai_bridge(self):
        self._write("aw-tauri/src-tauri/Cargo.toml", '[package]\nname = "peakactivity-desktop"\n[dependencies]\nreqwest = "0.12"\n')
        self._write("aw-tauri/src-tauri/src/ai_credentials.rs", '''
use reqwest::blocking::Client;
Client::builder().no_proxy().redirect(Policy::none());
let url = format!("http://127.0.0.1:{port}/api/0/ai/send");
let preview = format!("native-preview/{native_preview_id}");
client.post(preview).json(&serde_json::json!({ "approval_id": &request.approval_id }));
local_session::ai_send_session();
"X-PeakActivity-AI-Credential";
sanitized_payload;
MessageDialogButtons::OkCancel;
blocking_show();
Scope::AiSend;
''')
        self._write("aw-tauri/src-tauri/src/local_session.rs", "Scope::AiSend\n")
        self.assertEqual(self.scan(), [])

    def test_rejects_approval_ids_in_native_preview_urls(self):
        self._write("aw-tauri/src-tauri/Cargo.toml", '[package]\nname = "peakactivity-desktop"\n[dependencies]\nreqwest = "0.12"\n')
        self._write("aw-tauri/src-tauri/src/ai_credentials.rs", '''
use reqwest::blocking::Client;
Client::builder().no_proxy().redirect(Policy::none());
let preview = format!("native-preview/{native_preview_id}?approval_id={}", request.approval_id);
local_session::ai_send_session();
"X-PeakActivity-AI-Credential";
sanitized_payload;
MessageDialogButtons::OkCancel;
blocking_show();
Scope::AiSend;
''')
        self._write("aw-tauri/src-tauri/src/local_session.rs", "Scope::AiSend\n")
        self.assertTrue(any("native-preview approval IDs must stay out of URLs" in error for error in self.scan()))

    def test_rejects_remote_webui_origin_override(self):
        self._write("aw-tauri/aw-webui/src/util/awclient.ts", 'new AWClient("ui", { baseURL: AW_SERVER_URL });\n')
        errors = self.scan()
        self.assertTrue(any("loopback" in error.lower() for error in errors))

    def test_rejects_external_url_literals_outside_the_destination_proxy(self):
        self._write("aw-server-rust/aw-server/src/client.rs", 'let endpoint = "https://upload.attacker.io/data";\n')
        errors = self.scan()
        self.assertTrue(any("external URL" in error for error in errors))

    def test_rejects_legacy_network_dependency_and_packaging_bypass(self):
        self._write("aw-server-rust/aw-sync/Cargo.toml", '[package]\nname = "aw-sync"\n[dependencies]\nreqwest = "0.12"\n')
        self._write("aw-tauri/src-tauri/src/manager.rs", '#[cfg(unix)] let excluded = ["aw-notify"];\n#[cfg(windows)] let excluded = ["aw-notify"];\n')
        self._write("scripts/package/stage_helpers.py", 'PROHIBITED = r"aw-notify"\n')
        errors = self.scan()
        self.assertTrue(any("aw-sync" in error and "reqwest" in error for error in errors))
        self.assertTrue(any("aw-sync" in error and "packaging" in error.lower() for error in errors))


if __name__ == "__main__":
    unittest.main()
