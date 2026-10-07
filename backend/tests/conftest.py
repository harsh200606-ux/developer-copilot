import os
import sys
from pathlib import Path

import pytest


BACKEND_DIR = Path(__file__).resolve().parents[1]

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


# Use a separate database for automated tests.
os.environ["MONGODB_DATABASE"] = "developer_copilot_test"


@pytest.fixture(autouse=True)
def clean_test_database():
    from app.core.database import database

    database.client.drop_database("developer_copilot_test")

    yield

    database.client.drop_database("developer_copilot_test")