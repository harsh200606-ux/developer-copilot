from datetime import datetime, timezone


class User:
    def __init__(
        self,
        username: str,
        email: str,
        password_hash: str,
    ):
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = self.created_at

    def to_document(self):
        return {
            "username": self.username,
            "email": self.email,
            "password_hash": self.password_hash,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }