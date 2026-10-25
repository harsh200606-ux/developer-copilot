
import json

import pytest

from app.runners.dependency_service import inspect_dependencies


def test_inspects_python_requirements(tmp_path):
    (tmp_path / "requirements.txt").write_text(
        "fastapi\nuvicorn\n",
        encoding="utf-8",
    )

    result = inspect_dependencies(tmp_path)

    assert "requirements.txt" in result["manifest_files"]
    assert result["dependencies"][0]["manager"] == "pip"
    assert result["dependencies"][0]["declared_dependencies"] == [
        "fastapi",
        "uvicorn",
    ]
    assert result["installation_performed"] is False
    assert result["status"] == "inspection_complete"


def test_inspects_node_dependencies(tmp_path):
    package_data = {
        "name": "sample-app",
        "dependencies": {"react": "^18.0.0"},
        "devDependencies": {"vite": "^5.0.0"},
    }

    (tmp_path / "package.json").write_text(
        json.dumps(package_data),
        encoding="utf-8",
    )

    result = inspect_dependencies(tmp_path)

    assert "package.json" in result["manifest_files"]
    assert result["dependencies"][0]["manager"] == "npm"
    assert "react" in result["dependencies"][0]["runtime_dependencies"]
    assert "vite" in result["dependencies"][0]["development_dependencies"]


def test_warns_when_no_manifest_exists(tmp_path):
    (tmp_path / "README.md").write_text(
        "Sample project",
        encoding="utf-8",
    )

    result = inspect_dependencies(tmp_path)

    assert result["manifest_files"] == []
    assert any(
        "No supported dependency manifest" in warning
        for warning in result["warnings"]
    )


def test_rejects_invalid_package_json(tmp_path):
    (tmp_path / "package.json").write_text(
        "{invalid json",
        encoding="utf-8",
    )

    with pytest.raises(ValueError, match="Invalid JSON"):
        inspect_dependencies(tmp_path)


def test_flags_requirements_options_for_review(tmp_path):
    (tmp_path / "requirements.txt").write_text(
        "--extra-index-url https://example.invalid/simple\n"
        "fastapi\n",
        encoding="utf-8",
    )

    result = inspect_dependencies(tmp_path)

    assert result["dependencies"][0]["declared_dependencies"] == [
        "fastapi"
    ]
    assert any(
        "needs review" in warning
        for warning in result["warnings"]
    )
