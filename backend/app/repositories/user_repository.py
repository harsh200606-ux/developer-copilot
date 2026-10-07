from app.core.database import get_database
from app.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository):
    def __init__(self):
        database = get_database()
        super().__init__(database["users"])

    def find_by_email(self, email: str):
        return self.collection.find_one({"email": email})

    def find_by_username(self, username: str):
        return self.collection.find_one({"username": username})