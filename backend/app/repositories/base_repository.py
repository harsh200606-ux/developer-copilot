from typing import Any

from pymongo.collection import Collection


class BaseRepository:
    def __init__(self, collection: Collection):
        self.collection = collection

    def find_by_id(self, document_id: Any):
        return self.collection.find_one({"_id": document_id})

    def find_all(self):
        return list(self.collection.find())

    def insert_one(self, document: dict):
        result = self.collection.insert_one(document)
        return result.inserted_id

    def delete_by_id(self, document_id: Any):
        result = self.collection.delete_one({"_id": document_id})
        return result.deleted_count