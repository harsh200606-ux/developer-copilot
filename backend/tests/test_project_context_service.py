
from app.services.project_context_service import _extract_named_functions


def test_extracts_requested_function():
    source = """
def first_function():
    return "first"

def target_function():
    result = 42
    return result

def last_function():
    return "last"
""".lstrip()

    result = _extract_named_functions(
        source,
        {"target_function"},
    )

    assert "def target_function():" in result
    assert "result = 42" in result
    assert "def first_function():" not in result
    assert "def last_function():" not in result


def test_extracts_requested_class():
    source = """
class UserService:
    def get_user(self):
        return "user"

class OtherService:
    pass
""".lstrip()

    result = _extract_named_functions(
        source,
        {"UserService"},
    )

    assert "class UserService:" in result
    assert "def get_user(self):" in result
    assert "class OtherService:" not in result


def test_extracts_nested_function():
    source = """
def outer():
    def inner():
        return 123
    return inner()
""".lstrip()

    result = _extract_named_functions(
        source,
        {"inner"},
    )

    assert "def inner():" in result
    assert "return 123" in result
    assert "def outer():" not in result


def test_extracts_async_function():
    source = """
async def fetch_data():
    return "data"
""".lstrip()

    result = _extract_named_functions(
        source,
        {"fetch_data"},
    )

    assert "async def fetch_data():" in result
    assert 'return "data"' in result


def test_preserves_collection_name_assignment():
    source = """
COLLECTION_NAME = "projects"

def get_project():
    return COLLECTION_NAME
""".lstrip()

    result = _extract_named_functions(
        source,
        {"get_project"},
    )

    assert "def get_project():" in result
    assert 'COLLECTION_NAME = "projects"' in result


def test_returns_empty_for_missing_symbol():
    source = """
def existing_function():
    pass
""".lstrip()

    result = _extract_named_functions(
        source,
        {"missing_function"},
    )

    assert result == ""


def test_returns_empty_for_invalid_python():
    source = "def broken_function(\n"

    result = _extract_named_functions(
        source,
        {"broken_function"},
    )

    assert result == ""
