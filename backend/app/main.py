from fastapi import FastAPI

from app.core.database import client
from app.api.projects import router as project_router
from app.api.auth import router as auth_router


app = FastAPI(
    title="AI Developer Copilot",
    description="AI-powered platform for analyzing software projects",
    version="0.1.0",
)


# Register API routes
app.include_router(project_router)
app.include_router(auth_router)


@app.get("/health")
def health_check():
    try:
        client.admin.command("ping")

        return {
            "status": "ok",
            "service": "developer-copilot",
            "database": "connected",
        }

    except Exception as error:
        return {
            "status": "error",
            "service": "developer-copilot",
            "database": "disconnected",
            "error": str(error),
        }