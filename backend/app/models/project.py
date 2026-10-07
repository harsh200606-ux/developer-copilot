from datetime import datetime, timezone


class Project:
    def __init__(
        self,
        name: str,
        description: str = "",
        repository_url: str = "",
        language: str = "Python",
        status: str = "created",
        owner_id: str | None = None,
    ):
        self.name = name
        self.description = description
        self.repository_url = repository_url
        self.language = language
        self.status = status
        self.owner_id = owner_id
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = self.created_at

    def to_document(self):
        return {
            "name": self.name,
            "description": self.description,
            "repository_url": self.repository_url,
            "language": self.language,
            "status": self.status,
            "owner_id": self.owner_id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }