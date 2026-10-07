from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_check():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_create_project():
    # Register test user
    register_response = client.post(
        "/api/auth/register",
        json={
            "username": "projecttester",
            "email": "projecttester@example.com",
            "password": "password123",
        },
    )

    assert register_response.status_code == 201

    # Login test user
    login_response = client.post(
        "/api/auth/login",
        json={
            "email": "projecttester@example.com",
            "password": "password123",
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    # Create project using JWT
    response = client.post(
        "/api/projects/",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "name": "Test Project",
            "description": "Project created during automated testing",
            "repository_url": "https://github.com/example/test",
            "language": "Python",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == "Test Project"
    assert data["language"] == "Python"
    assert data["status"] == "created"
    assert "id" in data
def test_user_cannot_access_another_users_project():
    # -----------------------------
    # Create User A
    # -----------------------------
    register_user_a = client.post(
        "/api/auth/register",
        json={
            "username": "user_a",
            "email": "user_a@example.com",
            "password": "password123",
        },
    )

    assert register_user_a.status_code == 201

    # Login User A
    login_user_a = client.post(
        "/api/auth/login",
        json={
            "email": "user_a@example.com",
            "password": "password123",
        },
    )

    assert login_user_a.status_code == 200

    token_a = login_user_a.json()["access_token"]

    # -----------------------------
    # User A creates a project
    # -----------------------------
    create_project = client.post(
        "/api/projects/",
        headers={
            "Authorization": f"Bearer {token_a}",
        },
        json={
            "name": "User A Project",
            "description": "Private project",
            "repository_url": "https://github.com/example/project-a",
            "language": "Python",
        },
    )

    assert create_project.status_code == 200

    project_id = create_project.json()["id"]

    # -----------------------------
    # Create User B
    # -----------------------------
    register_user_b = client.post(
        "/api/auth/register",
        json={
            "username": "user_b",
            "email": "user_b@example.com",
            "password": "password123",
        },
    )

    assert register_user_b.status_code == 201

    # Login User B
    login_user_b = client.post(
        "/api/auth/login",
        json={
            "email": "user_b@example.com",
            "password": "password123",
        },
    )

    assert login_user_b.status_code == 200

    token_b = login_user_b.json()["access_token"]

    # -----------------------------
    # User B tries to access
    # User A's project
    # -----------------------------
    response = client.get(
        f"/api/projects/{project_id}",
        headers={
            "Authorization": f"Bearer {token_b}",
        },
    )

    assert response.status_code == 404    