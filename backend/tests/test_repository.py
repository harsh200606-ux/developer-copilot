from app.repositories.project_repository import ProjectRepository


def test_project_repository_connection():
    repository = ProjectRepository()

    assert repository.collection.name == "projects"