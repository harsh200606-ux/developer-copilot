
import json

import pytest

from app.runners.app_runner import (
    detect_start_command,
    prepare_runtime_plan,
)


def test_detects_fastapi_application(tmp_path):
    (tmp_path / "requirements.txt").write_text(
        "fastapi\n",
        encoding="utf-8",
    )

    src = tmp_path / "src"
    src.mkdir()

    (src / "main.py").write_text(
        "from fastapi import FastAPI\n"
        "app = FastAPI()\n"
        "@app.get('/')\n"
        "def hello():\n"
        "    return {'message': 'hello'}\n",
        encoding="utf-8",
    )

    result = detect_start_command(tmp_path)

    assert result["runtime"] == "python"
    assert result["framework"] == "FastAPI"
    assert result["entry_point"] == "src/main.py"
    assert result["command"] == [
        "python",
        "-m",
        "uvicorn",
        "src.main:app",
        "--host",
        "0.0.0.0",
        "--port",
        "8000",
    ]


def test_runtime_plan_does_not_execute_code(tmp_path):
    (tmp_path / "requirements.txt").write_text(
        "fastapi\n",
        encoding="utf-8",
    )

    (tmp_path / "main.py").write_text(
        "from fastapi import FastAPI\napp = FastAPI()\n",
        encoding="utf-8",
    )

    result = prepare_runtime_plan(tmp_path)

    assert result["runtime"] == "python"
    assert result["framework"] == "FastAPI"
    assert result["status"] == "ready_for_sandbox"
    assert result["execution_performed"] is False


def test_unsupported_project_raises_error(tmp_path):
    (tmp_path / "notes.txt").write_text(
        "This is not an application.",
        encoding="utf-8",
    )

    with pytest.raises(
        ValueError,
        match="No supported application start command",
    ):
        detect_start_command(tmp_path)


def test_invalid_package_json_raises_error(tmp_path):
    (tmp_path / "package.json").write_text(
        "{invalid json",
        encoding="utf-8",
    )

    with pytest.raises(
        ValueError,
        match="Could not read package.json",
    ):
        detect_start_command(tmp_path)
