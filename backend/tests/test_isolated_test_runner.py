
from pathlib import Path

import pytest

from app.services.isolated_test_runner import validate_test_project


def test_finds_python_test_files(tmp_path: Path):
    (tmp_path / "test_main.py").write_text(
        "def test_example():\n    assert 1 + 1 == 2\n",
        encoding="utf-8",
    )

    result = validate_test_project(tmp_path)

    assert result["status"] == "ready"
    assert result["test_files"] == ["test_main.py"]
    assert result["test_file_count"] == 1
    assert result["execution_performed"] is False


def test_reports_when_no_tests_exist(tmp_path: Path):
    (tmp_path / "main.py").write_text(
        "def add(a, b):\n    return a + b\n",
        encoding="utf-8",
    )

    result = validate_test_project(tmp_path)

    assert result["status"] == "no_tests_found"
    assert result["test_file_count"] == 0


def test_rejects_missing_directory(tmp_path: Path):
    missing_path = tmp_path / "missing"

    with pytest.raises(ValueError):
        validate_test_project(missing_path)


def test_runner_rejects_invalid_timeout(tmp_path: Path):
    from app.services.isolated_test_runner import run_tests_in_docker

    (tmp_path / "test_main.py").write_text(
        "def test_example():\n    assert True\n",
        encoding="utf-8",
    )

    with pytest.raises(ValueError):
        run_tests_in_docker(tmp_path, timeout_seconds=0)
