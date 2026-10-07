from app.core.database import get_database
from app.repositories.base_repository import BaseRepository


class ProjectRepository(BaseRepository):
    def __init__(self):
        database = get_database()
        super().__init__(database["projects"])