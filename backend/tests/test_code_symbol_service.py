
from pathlib import Path

from app.services.code_symbol_service import extract_python_symbols


def test_extracts_functions_classes_and_async_functions(tmp_path: Path):
    source = tmp_path / "sample.py"
    source.write_text(
        """
def greet():
    pass

async def fetch_data():
    pass

class UserService:
    def get_user(self):
        pass

    def outer(self):
        def inner():
            pass
""".lstrip(),
        encoding="utf-8",
    )

    result = extract_python_symbols(tmp_path)

    assert result["status"] == "completed"
    assert result["files_parsed"] == 1

    symbols = {
        item["qualified_name"]: item
        for item in result["symbols"]
    }

    assert symbols["greet"]["kind"] == "function"
    assert symbols["fetch_data"]["is_async"] is True
    assert symbols["UserService"]["kind"] == "class"
    assert symbols["UserService.get_user"]["kind"] == "function"
    assert symbols["UserService.outer.inner"]["kind"] == "function"


def test_records_correct_line_numbers(tmp_path: Path):
    source = tmp_path / "locations.py"
    source.write_text(
        "x = 1\n\ndef actual_function():\n    pass\n",
        encoding="utf-8",
    )

    result = extract_python_symbols(tmp_path)

    function = next(
        item
        for item in result["symbols"]
        if item["name"] == "actual_function"
    )

    assert function["line"] == 3
    assert function["end_line"] == 4
    assert function["file"] == "locations.py"


def test_skips_syntax_errors_without_crashing(tmp_path: Path):
    (tmp_path / "broken.py").write_text(
        "def unfinished(\n",
        encoding="utf-8",
    )

    (tmp_path / "valid.py").write_text(
        "def working():\n    pass\n",
        encoding="utf-8",
    )

    result = extract_python_symbols(tmp_path)

    assert result["syntax_errors"] == 1
    assert any(
        item["name"] == "working"
        for item in result["symbols"]
    )


def test_rejects_nonexistent_project_directory(tmp_path: Path):
    missing = tmp_path / "missing"

    try:
        extract_python_symbols(missing)
        assert False, "Expected ValueError for a missing directory"
    except ValueError as error:
        assert "does not exist" in str(error)

def test_extracts_function_call_sites_with_correct_line_numbers(
    tmp_path: Path,
):
    source = tmp_path / "lab7_1.py"
    source.write_text(
        (
            "def get_bson_size(document):\n"  # line 1
            "    return len(document)\n"      # line 2
            "\n"                               # line 3
            "size = get_bson_size(post)\n"     # line 4
            "size_100 = get_bson_size(big_post)\n"  # line 5
            "size_1k = get_bson_size(big_post)\n"   # line 6
            "size_10k = get_bson_size(big_post)\n"  # line 7
        ),
        encoding="utf-8",
    )

    result = extract_python_symbols(tmp_path)

    matching_calls = [
        call
        for call in result["calls"]
        if call["name"] == "get_bson_size"
    ]

    assert result["total_calls"] == len(result["calls"])
    assert len(matching_calls) == 4
    assert [call["line"] for call in matching_calls] == [
        4,
        5,
        6,
        7,
    ]
    assert all(
        call["file"] == "lab7_1.py"
        for call in matching_calls
    )
