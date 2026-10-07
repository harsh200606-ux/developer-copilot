from app.core.security import hash_password, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository


class AuthService:
    def __init__(self):
        self.repository = UserRepository()

    def register_user(
        self,
        username: str,
        email: str,
        password: str,
    ):
        existing_email = self.repository.find_by_email(email)

        if existing_email:
            return None

        existing_username = self.repository.find_by_username(username)

        if existing_username:
            return None

        password_hash = hash_password(password)

        user = User(
            username=username,
            email=email,
            password_hash=password_hash,
        )

        user_id = self.repository.insert_one(
            user.to_document()
        )

        return {
            "id": str(user_id),
            "username": username,
            "email": email,
        }

    def authenticate_user(
        self,
        email: str,
        password: str,
    ):
        user = self.repository.find_by_email(email)

        if not user:
            return None

        if not verify_password(
            password,
            user["password_hash"],
        ):
            return None

        return {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
        }