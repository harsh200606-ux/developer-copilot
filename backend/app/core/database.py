from pymongo import MongoClient

from app.core.config import settings


client = MongoClient(settings.mongodb_url)

database = client[settings.mongodb_database]


def get_database():
    return database