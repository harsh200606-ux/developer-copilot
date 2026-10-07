from datetime import datetime, timezone

from bson import ObjectId

from app.models.project import Project
from app.repositories.project_repository import ProjectRepository


class ProjectService:
    def __init__(self):
        self.repository = ProjectRepository()

    def create_project(
        self,
        name: str,
        description: str = "",
        repository_url: str = "",
        language: str = "Python",
        owner_id: str | None = None,
    ):
        project = Project(
            name=name,
            description=description,
            repository_url=repository_url,
            language=language,
            owner_id=owner_id,
        )

        document = project.to_document()

        project_id = self.repository.insert_one(document)

        return {
            "id": str(project_id),
            **document,
        }

    def get_all_projects(self, owner_id: str | None = None):
        if owner_id:
            projects = list(
                self.repository.collection.find(
                    {"owner_id": owner_id}
                )
            )
        else:
            projects = self.repository.find_all()

        return [
            {
                "id": str(project["_id"]),
                "name": project["name"],
                "description": project["description"],
                "repository_url": project["repository_url"],
                "language": project["language"],
                "status": project["status"],
                "created_at": project["created_at"],
                "updated_at": project["updated_at"],
            }
            for project in projects
        ]

    def get_project_by_id(
        self,
        project_id: str,
        owner_id: str | None = None,
    ):
        try:
            object_id = ObjectId(project_id)
        except Exception:
            return None

        query = {"_id": object_id}

        if owner_id:
            query["owner_id"] = owner_id

        project = self.repository.collection.find_one(query)

        if not project:
            return None

        return {
            "id": str(project["_id"]),
            "name": project["name"],
            "description": project["description"],
            "repository_url": project["repository_url"],
            "language": project["language"],
            "status": project["status"],
            "created_at": project["created_at"],
            "updated_at": project["updated_at"],
        }

    def update_project(
        self,
        project_id: str,
        update_data: dict,
        owner_id: str | None = None,
    ):
        try:
            object_id = ObjectId(project_id)
        except Exception:
            return None

        update_data = {
            key: value
            for key, value in update_data.items()
            if value is not None
        }

        if not update_data:
            return self.get_project_by_id(
                project_id,
                owner_id,
            )

        update_data["updated_at"] = datetime.now(timezone.utc)

        query = {"_id": object_id}

        if owner_id:
            query["owner_id"] = owner_id

        result = self.repository.collection.update_one(
            query,
            {"$set": update_data},
        )

        if result.matched_count == 0:
            return None

        return self.get_project_by_id(
            project_id,
            owner_id,
        )

    def delete_project(
        self,
        project_id: str,
        owner_id: str | None = None,
    ):
        try:
            object_id = ObjectId(project_id)
        except Exception:
            return False

        query = {"_id": object_id}

        if owner_id:
            query["owner_id"] = owner_id

        result = self.repository.collection.delete_one(query)

        return result.deleted_count > 0