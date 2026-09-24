import json
import tempfile
import unittest
from pathlib import Path

from scripts.validate_experience import generate_client_contract, validate_experience, validate_ui_copy


TERMS = [
    ("activity", "Activity"), ("timeline", "Timeline"), ("category", "Category"),
    ("project", "Project"), ("rule", "Rule"), ("privacy-zone", "Privacy Zone"),
    ("privacy-firewall", "Privacy Firewall"), ("vault", "Vault"),
    ("sync-vault", "Sync Vault"), ("device", "Device"), ("insight", "Insight"),
    ("report", "Report"), ("approved-timesheet", "Approved Timesheet"),
    ("ai-mode", "AI Mode"), ("peak-ai", "Peak AI"),
    ("custom-endpoint", "Custom Endpoint"), ("receipt", "Receipt"), ("plugin", "Plugin"),
    ("category-weight", "Category weight"), ("category-weighting", "Category weighting"),
]
STATES = {
    "recording": ["Recording", "Paused", "Scheduled pause", "Permission required", "Source unavailable", "Vault locked"],
    "sync": ["Not configured", "Pairing", "Syncing", "Up to date", "Offline", "Conflict requires review", "Key recovery required", "Device revoked"],
    "ai": ["Off", "Peak AI ready", "Custom Endpoint ready", "Connection test failed", "Approval required", "Request in progress", "Usage limit reached", "Disabled by policy"],
    "subscription": ["Free", "Trial", "Active", "Payment action required", "Grace period", "Canceled", "Local Pro license"],
    "integration_plugin": ["Not connected", "Permission review", "Connected", "Action required", "Paused", "Revoked"],
}
ACTIONS = [
    "Create Local Vault", "Import existing data", "Explore without recording", "Open Today",
    "Enable selected sources", "Continue with these sources", "Continue with fewer sources",
    "Start recording", "Pause recording", "Pause temporarily", "Pause for 15 minutes",
    "Pause for 1 hour", "Pause until tomorrow", "Enter Private Mode", "Resume recording", "Start manual timer",
    "Stop manual timer", "Add manual entry", "Split event", "Merge adjacent activities",
    "Download PeakActivity", "Review source",
    "Get help", "Review organization policy", "Review aggregate reports", "Appeal a policy decision",
    "Add privacy rule",
    "Exclude this activity", "Delete activity", "Edit category", "Assign project",
    "Create rule from selection", "Preview data", "Approve and send", "Cancel request",
    "Enable Peak AI", "Configure Custom Endpoint", "Turn AI off", "Test connection",
    "Save endpoint", "Remove endpoint", "Set up sync", "Pair device", "Revoke device",
    "Create recovery kit", "Export data", "Delete data", "Lock vault", "Unlock vault",
    "Review permissions", "Grant permission", "Open system settings", "Upgrade plan",
    "Manage subscription", "Download invoice", "Cancel subscription", "Install plugin",
    "Update plugin", "Revoke access", "Uninstall",
]


def valid_documents():
    capabilities = {
        "schema_version": 2,
        "base_commit": "a" * 40,
        "base_tree": "b" * 40,
        "capabilities": [{
            "id": "local-capture", "product": "desktop", "platforms": ["linux"],
            "plan": "Community", "status": "Available", "permissions": [],
            "offline": True, "data_egress": "none", "summary": "Local capture",
            "basis": "Locally stored capture.", "evidence_paths": ["README.md"],
        }],
    }
    experience = {
        "schema_version": 1, "contract_version": 2, "language": "en",
        "terms": [{"id": identity, "label": label, "definition": label} for identity, label in TERMS],
        "states": STATES, "actions": ACTIONS,
        "ai_modes": [
            {"id": "off", "label": "Off"},
            {"id": "peak-ai", "label": "Peak AI"},
            {"id": "custom-endpoint", "label": "Custom Endpoint"},
        ],
        "forbidden_terms": ["Edge AI", "Local AI", "Hybrid AI", "BYOK", "Client AI", "Cloud Fallback", "Monitoring Mode", "Productivity Score", "Employee Rank"],
        "flows": ["permission", "egress", "ai", "sync", "purchase", "destructive-action", "policy-update"],
    }
    return capabilities, experience


def valid_package_catalog():
    return {
        "schema_version": 1,
        "prices_published": False,
        "always_available_feature_ids": ["local-capture"],
        "packages": [{
            "id": "community",
            "label": "Community",
            "status": "Available",
            "purchase_model": "free",
            "feature_ids": [],
            "device_limit": None,
            "grace_period_seconds": None,
        }],
    }


class ExperienceContractTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.write_documents()

    def tearDown(self):
        self.temporary.cleanup()

    def write_documents(self):
        capabilities, experience = valid_documents()
        (self.root / "docs").mkdir(exist_ok=True)
        (self.root / "README.md").write_text("PeakActivity\n", encoding="utf-8")
        (self.root / "docs/capabilities.json").write_text(json.dumps(capabilities), encoding="utf-8")
        (self.root / "docs/experience.json").write_text(json.dumps(experience), encoding="utf-8")
        (self.root / "docs/package-catalog.json").write_text(json.dumps(valid_package_catalog()), encoding="utf-8")

    def documents(self):
        return tuple(json.loads((self.root / path).read_text(encoding="utf-8")) for path in (
            "docs/capabilities.json", "docs/experience.json"
        ))

    def save(self, capabilities, experience):
        (self.root / "docs/capabilities.json").write_text(json.dumps(capabilities), encoding="utf-8")
        (self.root / "docs/experience.json").write_text(json.dumps(experience), encoding="utf-8")

    def save_packages(self, catalog):
        (self.root / "docs/package-catalog.json").write_text(json.dumps(catalog), encoding="utf-8")

    def test_accepts_complete_versioned_contract(self):
        self.assertEqual(validate_experience(self.root), [])

    def test_rejects_duplicate_capability_and_unknown_status(self):
        capabilities, experience = self.documents()
        capabilities["capabilities"].append(capabilities["capabilities"][0].copy())
        capabilities["capabilities"][0]["status"] = "Soon"
        self.save(capabilities, experience)
        errors = validate_experience(self.root)
        self.assertIn("capabilities[0].status: invalid", errors)
        self.assertIn("capabilities[1].id: duplicate", errors)

    def test_rejects_missing_egress_disclosure_and_invalid_ai_modes(self):
        capabilities, experience = self.documents()
        del capabilities["capabilities"][0]["data_egress"]
        experience["ai_modes"].append({"id": "local-model", "label": "Local model"})
        self.save(capabilities, experience)
        errors = validate_experience(self.root)
        self.assertIn("capabilities[0]: invalid fields", errors)
        self.assertIn("ai_modes: invalid set", errors)

    def test_rejects_banned_user_facing_term(self):
        capabilities, experience = self.documents()
        experience["terms"][0]["label"] = "Local AI"
        self.save(capabilities, experience)
        self.assertIn("terms[0].label: forbidden", validate_experience(self.root))

    def test_rejects_malformed_json_types_without_crashing(self):
        capabilities, experience = self.documents()
        capabilities["capabilities"][0]["status"] = []
        capabilities["capabilities"][0]["platforms"] = [{}]
        experience["terms"][0]["id"] = []
        self.save(capabilities, experience)
        errors = validate_experience(self.root)
        self.assertIn("capabilities[0].status: invalid", errors)
        self.assertIn("capabilities[0].platforms: invalid", errors)
        self.assertIn("terms[0].id: invalid or duplicate", errors)

    def test_rejects_package_features_missing_from_the_capability_registry(self):
        catalog = valid_package_catalog()
        catalog["packages"][0]["feature_ids"] = ["unknown-feature"]
        self.save_packages(catalog)
        self.assertIn(
            "packages[0].feature_ids[0]: unknown capability",
            validate_experience(self.root),
        )

    def test_rejects_published_price_fields_until_pricing_is_decided(self):
        catalog = valid_package_catalog()
        catalog["packages"][0]["price_cents"] = 499
        self.save_packages(catalog)
        self.assertIn("packages[0]: invalid fields", validate_experience(self.root))

    def test_accepts_a_planned_pro_feature_in_the_package_catalog(self):
        capabilities, experience = self.documents()
        capabilities["capabilities"].append({
            "id": "advanced-reports", "product": "desktop", "platforms": ["linux"],
            "plan": "Pro", "status": "Planned", "permissions": [],
            "offline": True, "data_egress": "none", "summary": "Advanced local reports",
            "basis": "Planned deterministic reporting.", "evidence_paths": ["README.md"],
        })
        self.save(capabilities, experience)
        catalog = valid_package_catalog()
        catalog["packages"].append({
            "id": "pro", "label": "Pro", "status": "Planned",
            "purchase_model": "subscription", "feature_ids": ["advanced-reports"],
            "device_limit": None, "grace_period_seconds": None,
        })
        self.save_packages(catalog)
        self.assertEqual(validate_experience(self.root), [])

    def test_does_not_allow_paid_entitlement_to_gate_an_always_available_feature(self):
        capabilities, experience = self.documents()
        self.save(capabilities, experience)
        catalog = valid_package_catalog()
        catalog["packages"].append({
            "id": "plus", "label": "Plus", "status": "Planned",
            "purchase_model": "subscription", "feature_ids": ["local-capture"],
            "device_limit": None, "grace_period_seconds": None,
        })
        self.save_packages(catalog)
        self.assertIn(
            "packages[1].feature_ids[0]: always-available capability cannot be paid",
            validate_experience(self.root),
        )

    def test_available_paid_package_requires_an_activation_and_grace_policy(self):
        catalog = valid_package_catalog()
        catalog["packages"].append({
            "id": "plus", "label": "Plus", "status": "Available",
            "purchase_model": "subscription", "feature_ids": [],
            "device_limit": None, "grace_period_seconds": None,
        })
        self.save_packages(catalog)
        self.assertIn("packages[1]: activation policy required", validate_experience(self.root))

    def test_client_contract_generation_is_deterministic(self):
        first, second = self.root / "first.json", self.root / "second.json"
        generate_client_contract(self.root, first)
        generate_client_contract(self.root, second)
        self.assertEqual(first.read_bytes(), second.read_bytes())
        generated = json.loads(first.read_text(encoding="utf-8"))
        self.assertEqual(generated["ai_modes"][0]["label"], "Off")
        self.assertEqual(generated["capabilities"][0]["id"], "local-capture")

    def test_ui_copy_scans_templates_but_not_script_code(self):
        source = self.root / "views" / "Home.vue"
        source.parent.mkdir()
        source.write_text(
            '<template><button>Enable Local AI</button></template>'
            '<script>const legacy = "Local AI";</script>', encoding="utf-8"
        )
        self.assertEqual(validate_ui_copy(source.parent), ["Home.vue: forbidden user-facing term"])
        source.write_text(
            '<template><button>Turn AI off</button></template>'
            '<script>const note = "Local AI";</script>', encoding="utf-8"
        )
        self.assertEqual(validate_ui_copy(source.parent), [])


if __name__ == "__main__":
    unittest.main()
