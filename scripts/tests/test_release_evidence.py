import importlib.util
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parents[1]))
spec = importlib.util.spec_from_file_location("release_evidence", Path(__file__).parents[1] / "release_evidence.py")
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)


def test_prohibited_runtime_is_rejected_in_either_sbom():
    spdx = {"spdxVersion": "SPDX-2.3", "packages": [{"name": "safe", "licenseDeclared": "MIT"}]}
    cyclone = {"bomFormat": "CycloneDX", "components": [{"name": "PyQt6", "licenses": []}]}
    with pytest.raises(ValueError, match="prohibited"):
        release.check_sbom(spdx, cyclone)
    cyclone["components"][0]["name"] = "llama_cpp_python"
    with pytest.raises(ValueError, match="prohibited"):
        release.check_sbom(spdx, cyclone)


def test_unknown_license_is_reported_without_claiming_approval():
    result = release.check_sbom(
        {"spdxVersion": "SPDX-2.3", "packages": [{"name": "example", "licenseDeclared": "NOASSERTION"}]},
        {"bomFormat": "CycloneDX", "components": [{"name": "example"}]},
    )
    assert result == ["example"]


def test_source_digest_tamper_is_rejected(tmp_path):
    (tmp_path / "SHA256SUMS.unsigned").write_text("0" * 64 + "  source.tar.gz\n" + "0" * 64 + "  source-manifest.json\n")
    (tmp_path / "source.tar.gz").write_bytes(b"changed")
    (tmp_path / "source-manifest.json").write_text("{}")
    with pytest.raises(ValueError, match="checksum"):
        release.source_inputs(tmp_path)
