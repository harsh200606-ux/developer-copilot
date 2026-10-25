
from pathlib import Path

from app.runners.dependency_installer import (
    install_python_dependencies,
)


def test_missing_project_returns_error(tmp_path: Path):
    result = install_python_dependencies(
        tmp_path / "missing-project"
    )

    assert result["success"] is False
    assert result["error"] == "Project directory does not exist."


def test_missing_requirements_returns_error(tmp_path: Path):
    result = install_python_dependencies(tmp_path)

    assert result["success"] is False
    assert result["error"] == "requirements.txt was not found."


def test_unsupported_requirements_option_is_rejected(
    tmp_path: Path,
):
    (tmp_path / "requirements.txt").write_text(
        "-r other-requirements.txt\n",
        encoding="utf-8",
    )

    result = install_python_dependencies(tmp_path)

    assert result["success"] is False
    assert "unsupported option" in result["error"]

