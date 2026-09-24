"""Validate the public capability/experience contract and generate its client view."""
import argparse
import json
import re
from pathlib import Path

try:
    from scripts.public_policy import STATUSES, safe_path, strict_json
except ModuleNotFoundError:
    from public_policy import STATUSES, safe_path, strict_json


CAPABILITY_FIELDS = {
    "id", "product", "platforms", "plan", "status", "permissions", "offline",
    "data_egress", "summary", "basis", "evidence_paths",
}
PACKAGE_FIELDS = {"id", "label", "status", "purchase_model", "feature_ids", "device_limit", "grace_period_seconds"}
PACKAGE_STATUSES = {"Available", "Planned", "Decision required"}
PURCHASE_MODELS = {"free", "subscription", "one-time-license", "usage-credits", "decision-required"}
PRODUCTS = {
    "desktop", "server", "sync", "ai", "account", "mobile", "browser",
    "website", "freelancer", "marketplace", "enterprise",
}
PLATFORMS = {"windows", "macos", "linux", "android", "ios", "browser", "web"}
PLANS = {"Community", "Local Pro", "Plus", "Pro", "Freelancer", "Enterprise"}
DATA_EGRESS = {"none", "loopback", "user-approved", "ciphertext-only", "service"}
EXPERIENCE_FIELDS = {
    "schema_version", "contract_version", "language", "terms", "states", "actions", "ai_modes",
    "forbidden_terms", "flows",
}
TERM_LABELS = {
    "activity": "Activity", "timeline": "Timeline", "category": "Category",
    "project": "Project", "rule": "Rule", "privacy-zone": "Privacy Zone",
    "privacy-firewall": "Privacy Firewall", "vault": "Vault", "sync-vault": "Sync Vault",
    "device": "Device", "insight": "Insight", "report": "Report",
    "approved-timesheet": "Approved Timesheet", "ai-mode": "AI Mode",
    "peak-ai": "Peak AI", "custom-endpoint": "Custom Endpoint", "receipt": "Receipt",
    "plugin": "Plugin", "category-weight": "Category weight",
    "category-weighting": "Category weighting",
}
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
AI_MODES = [
    {"id": "off", "label": "Off"},
    {"id": "peak-ai", "label": "Peak AI"},
    {"id": "custom-endpoint", "label": "Custom Endpoint"},
]
FORBIDDEN_TERMS = [
    "Edge AI", "Local AI", "Hybrid AI", "BYOK", "Client AI", "Cloud Fallback",
    "Monitoring Mode", "Productivity Score", "Employee Rank",
]
FLOWS = ["permission", "egress", "ai", "sync", "purchase", "destructive-action", "policy-update"]
ID_PATTERN = re.compile(r"[a-z][a-z0-9-]*\Z")


def validate_capability_manifest(manifest, root, paths, base_commit=None, base_tree=None, content_rules=None):
    """Return (records, stable errors) without echoing supplied field values."""
    errors = []
    if not isinstance(manifest, dict) or set(manifest) != {"schema_version", "base_commit", "base_tree", "capabilities"}:
        return {}, ["capabilities: invalid fields"]
    if (manifest["schema_version"] != 2 or not isinstance(manifest["base_commit"], str)
            or not re.fullmatch(r"[a-f0-9]{40}", manifest["base_commit"])
            or not isinstance(manifest["base_tree"], str)
            or not re.fullmatch(r"[a-f0-9]{40}", manifest["base_tree"])
            or (base_commit is not None and manifest["base_commit"] != base_commit)
            or (base_tree is not None and manifest["base_tree"] != base_tree)):
        errors.append("capabilities: invalid provenance")
    records = {}
    items = manifest["capabilities"]
    if not isinstance(items, list):
        return {}, errors + ["capabilities: invalid records"]
    for index, item in enumerate(items):
        prefix = f"capabilities[{index}]"
        if not isinstance(item, dict) or set(item) != CAPABILITY_FIELDS:
            errors.append(f"{prefix}: invalid fields")
            continue
        identity = item["id"]
        if not isinstance(identity, str) or not ID_PATTERN.fullmatch(identity):
            errors.append(f"{prefix}.id: invalid")
        elif identity in records:
            errors.append(f"{prefix}.id: duplicate")
        if not isinstance(item["status"], str) or item["status"] not in STATUSES:
            errors.append(f"{prefix}.status: invalid")
        if (not isinstance(item["product"], str) or item["product"] not in PRODUCTS
                or not isinstance(item["plan"], str) or item["plan"] not in PLANS):
            errors.append(f"{prefix}: invalid product or plan")
        platforms = item["platforms"]
        if (not isinstance(platforms, list) or not platforms
                or not all(isinstance(value, str) for value in platforms)
                or len(set(platforms)) != len(platforms) or not set(platforms) <= PLATFORMS):
            errors.append(f"{prefix}.platforms: invalid")
        permissions = item["permissions"]
        if (not isinstance(permissions, list) or not all(isinstance(value, str) for value in permissions)
                or len(set(permissions)) != len(permissions)
                or not all(isinstance(value, str) and ID_PATTERN.fullmatch(value) for value in permissions)):
            errors.append(f"{prefix}.permissions: invalid")
        if (type(item["offline"]) is not bool or not isinstance(item["data_egress"], str)
                or item["data_egress"] not in DATA_EGRESS):
            errors.append(f"{prefix}: invalid offline or egress disclosure")
        if not all(isinstance(item[key], str) and item[key].strip() for key in ("summary", "basis")):
            errors.append(f"{prefix}: empty summary or basis")
        evidence = item["evidence_paths"]
        if (not isinstance(evidence, list) or not evidence
                or not all(isinstance(value, str) for value in evidence)
                or len(set(evidence)) != len(evidence)
                or not all(safe_path(value) and value in paths for value in evidence)):
            errors.append(f"{prefix}.evidence_paths: invalid")
        if item["status"] == "Available" and isinstance(item["basis"], str) and re.search(
            r"\b(planned|not implemented|not shipped)\b", item["basis"], re.I
        ):
            errors.append(f"{prefix}.basis: contradicts status")
        text = f"{item['summary']} {item['basis']}"
        if content_rules and any(re.search(pattern, text, re.I)
                                 for patterns in content_rules.values() for pattern in patterns):
            errors.append(f"{prefix}: prohibited public content")
        if isinstance(identity, str) and ID_PATTERN.fullmatch(identity) and identity not in records:
            records[identity] = item
    return records, errors


def validate_package_catalog(catalog, capabilities):
    """Validate package-to-capability mappings without accepting price fields."""
    errors = []
    if not isinstance(catalog, dict) or set(catalog) != {
        "schema_version", "prices_published", "always_available_feature_ids", "packages"
    }:
        return ["package catalog: invalid fields"]
    if catalog["schema_version"] != 1 or catalog["prices_published"] is not False:
        errors.append("package catalog: invalid version or price state")
    packages = catalog["packages"]
    if not isinstance(packages, list):
        return errors + ["packages: invalid records"]
    known_features = set(capabilities)
    always_available = catalog["always_available_feature_ids"]
    if (not isinstance(always_available, list)
            or not all(isinstance(feature, str) and ID_PATTERN.fullmatch(feature) for feature in always_available)):
        errors.append("always_available_feature_ids: invalid")
        always_available = []
    elif len(always_available) != len(set(always_available)) or always_available != sorted(always_available):
        errors.append("always_available_feature_ids: duplicate or not canonical")
    for index, feature in enumerate(always_available):
        if feature not in known_features:
            errors.append(f"always_available_feature_ids[{index}]: unknown capability")
    seen = set()
    for index, package in enumerate(packages):
        prefix = f"packages[{index}]"
        if not isinstance(package, dict) or set(package) != PACKAGE_FIELDS:
            errors.append(f"{prefix}: invalid fields")
            continue
        identity = package["id"]
        if not isinstance(identity, str) or not ID_PATTERN.fullmatch(identity):
            errors.append(f"{prefix}.id: invalid")
        elif identity in seen:
            errors.append(f"{prefix}.id: duplicate")
        else:
            seen.add(identity)
        if not isinstance(package["label"], str) or not package["label"].strip():
            errors.append(f"{prefix}.label: invalid")
        if not isinstance(package["status"], str) or package["status"] not in PACKAGE_STATUSES:
            errors.append(f"{prefix}.status: invalid")
        if not isinstance(package["purchase_model"], str) or package["purchase_model"] not in PURCHASE_MODELS:
            errors.append(f"{prefix}.purchase_model: invalid")
        feature_ids = package["feature_ids"]
        if (not isinstance(feature_ids, list)
                or not all(isinstance(feature, str) and ID_PATTERN.fullmatch(feature) for feature in feature_ids)):
            errors.append(f"{prefix}.feature_ids: invalid")
            continue
        if len(feature_ids) != len(set(feature_ids)):
            errors.append(f"{prefix}.feature_ids: duplicate")
        if feature_ids != sorted(feature_ids):
            errors.append(f"{prefix}.feature_ids: not canonical")
        paid = isinstance(package["purchase_model"], str) and package["purchase_model"] not in {"free", "decision-required"}
        device_limit = package["device_limit"]
        grace_period = package["grace_period_seconds"]
        if package["status"] == "Available" and paid:
            if (type(device_limit) is not int or not 1 <= device_limit <= 64
                    or type(grace_period) is not int or grace_period < 0):
                errors.append(f"{prefix}: activation policy required")
        elif device_limit is not None or grace_period is not None:
            errors.append(f"{prefix}: activation policy is only configurable for available paid packages")
        for feature_index, feature in enumerate(feature_ids):
            if feature not in known_features:
                errors.append(f"{prefix}.feature_ids[{feature_index}]: unknown capability")
            elif feature in always_available:
                errors.append(f"{prefix}.feature_ids[{feature_index}]: always-available capability cannot be paid")
            elif package["status"] == "Available" and capabilities[feature]["status"] != "Available":
                errors.append(f"{prefix}.feature_ids[{feature_index}]: capability unavailable")
    return errors


def validate_experience_document(document):
    errors = []
    if not isinstance(document, dict) or set(document) != EXPERIENCE_FIELDS:
        return ["experience: invalid fields"]
    if (document["schema_version"] != 1 or type(document["contract_version"]) is not int
            or document["contract_version"] < 1 or document["language"] != "en"):
        errors.append("experience: invalid version or language")
    terms = document["terms"]
    if not isinstance(terms, list):
        errors.append("terms: invalid list")
        terms = []
    seen_terms = set()
    labels = {}
    for index, term in enumerate(terms):
        if not isinstance(term, dict) or set(term) != {"id", "label", "definition"}:
            errors.append(f"terms[{index}]: invalid fields")
            continue
        identity = term["id"]
        label = term["label"]
        valid_identity = isinstance(identity, str) and bool(ID_PATTERN.fullmatch(identity))
        if not valid_identity or identity in seen_terms:
            errors.append(f"terms[{index}].id: invalid or duplicate")
        if valid_identity:
            seen_terms.add(identity)
        if not isinstance(label, str) or not label.strip() or not isinstance(term["definition"], str) or not term["definition"].strip():
            errors.append(f"terms[{index}]: empty label or definition")
        else:
            if valid_identity:
                labels[identity] = label
            if not valid_identity or TERM_LABELS.get(identity) != label:
                errors.append(f"terms[{index}].label: noncanonical")
            if any(forbidden.casefold() in label.casefold() for forbidden in FORBIDDEN_TERMS):
                errors.append(f"terms[{index}].label: forbidden")
    if set(labels) != set(TERM_LABELS):
        errors.append("terms: incomplete vocabulary")
    if document["states"] != STATES:
        errors.append("states: noncanonical vocabulary")
    if document["actions"] != ACTIONS:
        errors.append("actions: noncanonical vocabulary")
    if document["ai_modes"] != AI_MODES:
        errors.append("ai_modes: invalid set")
    if document["forbidden_terms"] != FORBIDDEN_TERMS:
        errors.append("forbidden_terms: invalid set")
    if document["flows"] != FLOWS:
        errors.append("flows: incomplete set")
    for field, values in (("actions", document["actions"]),):
        if isinstance(values, list) and any(not isinstance(value, str) or any(
            forbidden.casefold() in value.casefold() for forbidden in FORBIDDEN_TERMS
        ) for value in values):
            errors.append(f"{field}: forbidden term")
    return errors


def _read_json(path, errors, label):
    if path.is_symlink() or not path.is_file():
        errors.append(f"{label}: unavailable")
        return None
    try:
        return strict_json(path.read_bytes())
    except (OSError, ValueError, TypeError):
        errors.append(f"{label}: invalid JSON")
        return None


def validate_ui_copy(source_root):
    source_root = Path(source_root).resolve()
    errors = []
    for path in sorted(source_root.rglob("*.vue")):
        if path.is_symlink() or not path.is_file():
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeError):
            errors.append(f"{path.relative_to(source_root).as_posix()}: unreadable")
            continue
        start = re.search(r"<template\b[^>]*>", text, re.I)
        end = text.rfind("</template>")
        if start is None or end < start.end():
            continue
        template = text[start.end():end].casefold()
        if any(term.casefold() in template for term in FORBIDDEN_TERMS):
            errors.append(f"{path.relative_to(source_root).as_posix()}: forbidden user-facing term")
    return errors


def validate_experience(root, capabilities_path="docs/capabilities.json", experience_path="docs/experience.json", ui_root=None):
    root = Path(root).resolve()
    errors = []
    capability_path = root / capabilities_path
    experience_file = root / experience_path
    if not capability_path.resolve().is_relative_to(root) or not experience_file.resolve().is_relative_to(root):
        return ["experience: unsafe path"]
    package_file = root / "docs/package-catalog.json"
    if not package_file.resolve().is_relative_to(root):
        return ["package catalog: unsafe path"]
    capabilities = _read_json(capability_path, errors, "capabilities")
    experience = _read_json(experience_file, errors, "experience")
    package_catalog = _read_json(package_file, errors, "package catalog")
    paths = {path.relative_to(root).as_posix() for path in root.rglob("*")
             if ".git" not in path.relative_to(root).parts}
    capability_records = {}
    if capabilities is not None:
        capability_records, manifest_errors = validate_capability_manifest(capabilities, root, paths)
        errors.extend(manifest_errors)
    if package_catalog is not None:
        errors.extend(validate_package_catalog(package_catalog, capability_records))
    if experience is not None:
        errors.extend(validate_experience_document(experience))
    if ui_root is not None:
        errors.extend(validate_ui_copy(ui_root))
    return errors


def generate_client_contract(root, output):
    root = Path(root).resolve()
    errors = validate_experience(root)
    if errors:
        raise ValueError("experience contract is invalid")
    capabilities = strict_json((root / "docs/capabilities.json").read_bytes())
    experience = strict_json((root / "docs/experience.json").read_bytes())
    client = {
        "schema_version": experience["schema_version"],
        "contract_version": experience["contract_version"],
        "capability_schema_version": capabilities["schema_version"],
        "language": experience["language"],
        "capabilities": capabilities["capabilities"],
        "terms": experience["terms"],
        "states": experience["states"],
        "actions": experience["actions"],
        "ai_modes": experience["ai_modes"],
    }
    output = Path(output)
    if output.is_symlink():
        raise ValueError("generated contract path is unsafe")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(client, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path("."))
    parser.add_argument("--output", type=Path)
    parser.add_argument("--ui-root", type=Path)
    args = parser.parse_args()
    errors = validate_experience(args.root, ui_root=args.ui_root)
    if errors:
        parser.exit(1, "Experience contract rejected: " + ", ".join(errors) + "\n")
    if args.output:
        generate_client_contract(args.root, args.output)
    print("Experience contract passed")


if __name__ == "__main__":
    main()
