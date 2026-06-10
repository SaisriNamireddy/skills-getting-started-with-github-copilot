import copy

import pytest
from fastapi.testclient import TestClient

from src import app as app_module


@pytest.fixture
def client():
    with TestClient(app_module.app) as c:
        yield c


@pytest.fixture(autouse=True)
def fresh_activities():
    """Ensure the module-level `activities` dict is reset after each test."""
    backup = copy.deepcopy(app_module.activities)
    try:
        yield
    finally:
        app_module.activities = copy.deepcopy(backup)
