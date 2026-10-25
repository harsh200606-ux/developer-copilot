
from pathlib import Path

from app.runners.sandbox import run_sandbox


def test_sandbox_runs_python_container():
    project_path = (
        Path(__file__).resolve().parents[2]
        / "sample-project"
    )

    result = run_sandbox(project_path)

    assert result["success"] is True, result
    assert "Sandbox is running successfully." in result["stdout"]
    assert result["timed_out"] is False
