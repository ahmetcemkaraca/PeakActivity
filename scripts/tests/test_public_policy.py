"""Offline publication policy checks using small, real Git repositories."""
import importlib.util
import json
import os
import subprocess
from pathlib import Path

import pytest


SCRIPT = Path(__file__).parents[1] / "public_policy.py"
spec = importlib.util.spec_from_file_location("public_policy", SCRIPT)
policy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(policy)


def git(root, *args):
    return subprocess.check_output(["git", "-C", str(root), *args], stderr=subprocess.DEVNULL).decode().strip()


@pytest.fixture
def repo(tmp_path):
    git(tmp_path, "init", "-q")
    git(tmp_path, "config", "user.name", "Policy Test")
    git(tmp_path, "config", "user.email", "test@example.invalid")
    (tmp_path / "README.md").write_text("# Example\n")
    (tmp_path / ".gitignore").write_text(".private/\n")
    git(tmp_path, "add", ".")
    git(tmp_path, "commit", "-qm", "base")
    config = {
        "schema_version": 1,
        "base_commit": git(tmp_path, "rev-parse", "HEAD"),
        "base_tree": git(tmp_path, "rev-parse", "HEAD^{tree}"),
        "allowed_changes": ["README.md", "docs/usage.md", "docs/capabilities.json", "link"],
        "restricted_paths": [".private", "docs/plans"],
        "public_surfaces": ["README.md", "docs/*.md"],
        "content_rules": {"private-reference": [r"confidential-repository"]},
        "secret_patterns": [r"ghp_[A-Za-z0-9]{36}"],
        "capabilities": None,
        "experience": None,
        "claim_terms": {},
        "required_statements": {},
        "brand_surfaces": [],
        "workflow": None,
    }
    return tmp_path, config


def rules(repo):
    return {item["rule"] for item in policy.scan_tree(*repo)["violations"]}


def test_rejects_restricted_ignored_paths_and_external_symlink(repo, tmp_path):
    root, _ = repo
    (root / ".private").mkdir()
    (root / ".private" / "note.txt").write_text("restricted")
    (root / "link").symlink_to(root.parent / "outside")
    assert {"restricted-path", "external-symlink"} <= rules(repo)


def test_pinned_base_and_changed_path_gate(repo):
    root, config = repo
    assert policy.scan_tree(*repo)["passed"]
    (root / "unexpected.txt").write_text("new")
    assert "path-not-allowlisted" in rules(repo)
    config["base_tree"] = "0" * 40
    assert "invalid-base" in rules(repo)


def test_add_modify_delete_and_stable_output(repo):
    root, _ = repo
    (root / "README.md").unlink()
    (root / "docs").mkdir()
    (root / "docs/usage.md").write_text("# Usage\n")
    first = policy.scan_tree(*repo)
    assert first["passed"]
    assert first == policy.scan_tree(*repo)


@pytest.mark.parametrize("text,expected", [
    ("[missing](missing.md)", "broken-local-link"),
    ("[escape](../outside.md)", "broken-local-link"),
    ("[report][ref]\n\n[ref]: missing.md", "broken-local-link"),
    ("confidential-repository", "private-reference"),
    ("ghp_" + "a" * 36, "secret-pattern"),
])
def test_content_and_links(repo, text, expected):
    root, _ = repo
    (root / "README.md").write_text(text)
    report = policy.scan_tree(*repo)
    assert expected in {item["rule"] for item in report["violations"]}
    if expected == "secret-pattern":
        assert "a" * 36 not in json.dumps(report)


def test_readme_requires_provenance_status_and_non_affiliation(repo):
    root, config = repo
    config["required_statements"] = {
        "README.md": [
            "ActivityWatch derivative",
            "does not endorse",
            r"Mozilla Public License 2\.0",
            "pre-alpha source bootstrap",
            r"25e34c71882fd4cf054731bf7f74ca92b934b0d6",
            r"\]\(docs/capabilities\.json\)",
            r"\]\(docs/roadmap\.md\)",
            r"FORKED_FROM\.md",
        ],
    }
    readme = root / "README.md"
    readme.write_text("# PeakActivity\nActivityWatch derivative.\n")
    assert "missing-required-statement" in rules(repo)

    readme.write_text(
        "# PeakActivity\nPeakActivity is an independent ActivityWatch derivative. "
        "ActivityWatch does not endorse it. This is a pre-alpha source bootstrap. "
        "ActivityWatch-derived files retain the Mozilla Public License 2.0. "
        "The reviewed upstream base is 25e34c71882fd4cf054731bf7f74ca92b934b0d6. "
        "See [capabilities](docs/capabilities.json), [roadmap](docs/roadmap.md), "
        "and [FORKED_FROM.md](FORKED_FROM.md).\n"
    )
    assert "missing-required-statement" not in rules(repo)


def test_fenced_examples_and_reference_links(repo):
    root, _ = repo
    (root / "README.md").write_text(
        "```md\n[example](missing.md)\n```\n\n[valid][readme]\n\n[readme]: README.md\n"
    )
    assert policy.scan_tree(*repo)["passed"]


def test_inline_annotation_example_is_not_a_product_claim(repo):
    root, config = repo
    found = []
    policy.check_claims("README.md", "Use `<!-- capability:identifier:Status -->` in a paragraph.",
                        config, {}, lambda *args: found.append(args))
    assert not found


def test_submodule_contents_are_opaque(repo):
    root, config = repo
    git(root, "update-index", "--add", "--cacheinfo", "160000", git(root, "rev-parse", "HEAD"), "module")
    git(root, "commit", "-qm", "module")
    config["base_commit"] = git(root, "rev-parse", "HEAD")
    config["base_tree"] = git(root, "rev-parse", "HEAD^{tree}")
    (root / "module").mkdir()
    (root / "module/README.md").write_text("confidential-repository")
    (root / "module/tauri.conf.json").write_text('{"identifier":"net.activitywatch.desktop"}')
    config["brand_surfaces"] = ["module/tauri.conf.json"]
    assert "module/README.md" not in policy.scan_tree(*repo)["scanned_paths"]
    assert "legacy-product-identifier" not in rules(repo)

    git(root, "update-index", "--cacheinfo", "160000", git(root, "rev-parse", "HEAD^"), "module")
    config["allowed_changes"].append("module")
    assert "legacy-product-identifier" in rules(repo)


def test_capability_claim_cannot_promote_planned_to_available(repo):
    root, config = repo
    (root / "docs").mkdir()
    config["capabilities"] = "docs/capabilities.json"
    config["claim_terms"] = {"vault": ["encrypted vault"]}
    registry = {
        "schema_version": 2, "base_commit": config["base_commit"], "base_tree": config["base_tree"],
        "capabilities": [{
            "id": "vault", "product": "desktop", "platforms": ["linux"],
            "plan": "Community", "status": "Planned", "permissions": [],
            "offline": True, "data_egress": "none", "summary": "Encrypted vault",
            "basis": "Planned; no shipped implementation.", "evidence_paths": ["README.md"],
        }],
    }
    (root / config["capabilities"]).write_text(json.dumps(registry))
    (root / "README.md").write_text("Encrypted vault is available.\n<!-- capability:vault:Available -->\n")
    assert "capability-status-mismatch" in rules(repo)
    (root / "README.md").write_text("Encrypted vault is Planned.\n<!-- capability:vault:Planned -->\n")
    assert policy.scan_tree(*repo)["passed"]
    (root / "README.md").write_text("Encrypted vault is available.\n<!-- capability:vault:Planned -->\n")
    assert "unqualified-capability-claim" in rules(repo)


def test_cli_config_failure_is_json_without_private_error(repo):
    root, _ = repo
    result = subprocess.run(
        [os.sys.executable, str(SCRIPT), "--root", str(root), "--config", "missing.json", "--format", "json"],
        capture_output=True, text=True,
    )
    assert result.returncode == 2
    assert json.loads(result.stdout)["passed"] is False
    assert "Traceback" not in result.stderr


def test_deleting_private_file_does_not_clean_history(repo):
    root, _ = repo
    (root / "docs/plans").mkdir(parents=True)
    (root / "docs/plans/private.md").write_text("sensitive plan")
    git(root, "add", "docs/plans/private.md")
    git(root, "commit", "-qm", "introduce plan")
    git(root, "rm", "docs/plans/private.md")
    git(root, "commit", "-qm", "remove plan")
    assert "restricted-history-path" in rules(repo)


def test_markdown_structure_rejects_bad_headings_reference_links_and_whitespace(repo):
    root, _ = repo
    (root / "README.md").write_text(
        "# One\n\n## Section\n### Nested\n# Two\n#### Skipped\n"
        "[unresolved][missing]\ntrailing spaces  "
    )
    found = {
        item["rule"]
        for item in policy.scan_tree(root, repo[1], rule_group="markdown-structure")["violations"]
    }
    assert {
        "markdown-h1-count",
        "markdown-heading-skip",
        "markdown-unresolved-reference",
        "markdown-trailing-whitespace",
        "markdown-final-newline",
    } <= found


def test_markdown_structure_ignores_fences_and_accepts_complete_documents(repo):
    root, _ = repo
    (root / "README.md").write_text(
        "# Title\n\n```md\n# Hidden\n### Also hidden\n````\n\n## Section\n\n"
        "[external](https://example.invalid)\n"
    )
    found = {
        item["rule"]
        for item in policy.scan_tree(root, repo[1], rule_group="markdown-structure")["violations"]
    }
    assert not any(rule.startswith("markdown-") for rule in found)


def test_markdown_structure_cli_selects_only_the_requested_rule_group(repo):
    root, config = repo
    (root / "README.md").write_text("# One\n\n# Two\n\nconfidential-repository\n")
    config_path = root / "public-policy.json"
    config_path.write_text(json.dumps(config))
    result = subprocess.run(
        [os.sys.executable, str(SCRIPT), "--root", str(root), "--config", str(config_path),
         "--rules", "markdown-structure", "--format", "json"],
        capture_output=True, text=True,
    )
    report = json.loads(result.stdout)
    assert result.returncode == 1
    assert {item["rule"] for item in report["violations"]} == {"markdown-h1-count"}


def test_public_policy_workflow_runs_markdown_structure_gate():
    workflow = Path(__file__).parents[2] / ".github/workflows/public-policy.yml"
    assert "--rules markdown-structure" in workflow.read_text()


@pytest.mark.parametrize(("dangerous_step", "expected_rule"), [
    ("on:\n  release:\n    types: [published]", "bootstrap-publication-trigger"),
    ("'on':\n  'schedule':\n    - cron: '0 0 * * *'", "bootstrap-publication-trigger"),
    ("permissions:\n  packages: write", "bootstrap-write-permission"),
    ("'permissions':\n  'packages': write", "bootstrap-write-permission"),
    ("jobs:\n  publish:\n    steps:\n      - run: npm publish", "bootstrap-publication-command"),
    ("jobs:\n  publish:\n    steps:\n      - uses: pypa/gh-action-pypi-publish@v1", "bootstrap-publication-command"),
    ("jobs:\n  merge:\n    steps:\n      - run: gh pr merge --auto", "bootstrap-auto-merge"),
])
def test_rejects_publication_and_auto_merge_in_the_reviewed_bootstrap_workflow(repo, dangerous_step, expected_rule):
    root, config = repo
    workflow = ".github/workflows/public-policy.yml"
    path = root / workflow
    path.parent.mkdir(parents=True)
    path.write_text(f"name: Policy\n{dangerous_step}\n")
    config["workflow"] = workflow
    config["allowed_changes"].append(workflow)
    found = {item["rule"] for item in policy.scan_tree(root, config)["violations"]}
    assert expected_rule in found


def test_rejects_legacy_product_name_and_identifier_on_configured_surface(repo):
    root, config = repo
    relative = "aw-tauri/src-tauri/tauri.conf.json"
    path = root / relative
    path.parent.mkdir(parents=True)
    path.write_text(json.dumps({"productName": "ActivityWatch", "identifier": "net.activitywatch.desktop"}))
    config["allowed_changes"].append(relative)
    config["brand_surfaces"] = [relative]

    found = rules(repo)
    assert {"legacy-product-name", "legacy-product-identifier"} <= found

    path.write_text(json.dumps({"productName": "PeakActivity", "identifier": "app.peakactivity.desktop"}))
    found = rules(repo)
    assert not {"legacy-product-name", "legacy-product-identifier"} & found
