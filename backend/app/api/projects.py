from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_current_user
from app.schemas.project import (
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)
from app.services.project_service import ProjectService


router = APIRouter(
    prefix="/api/projects",
    tags=["Projects"],
)

project_service = ProjectService()


@router.post("/", response_model=ProjectResponse)
def create_project(
    project: ProjectCreate,
    current_user=Depends(get_current_user),
):
    return project_service.create_project(
        name=project.name,
        description=project.description,
        repository_url=project.repository_url,
        language=project.language,
        owner_id=current_user["id"],
    )


@router.get("/", response_model=list[ProjectResponse])
def get_projects(
    current_user=Depends(get_current_user),
):
    return project_service.get_all_projects(
        owner_id=current_user["id"]
    )


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: str,
    current_user=Depends(get_current_user),
):
    project = project_service.get_project_by_id(
        project_id,
        owner_id=current_user["id"],
    )

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    return project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str,
    project: ProjectUpdate,
    current_user=Depends(get_current_user),
):
    updated_project = project_service.update_project(
        project_id,
        project.model_dump(exclude_unset=True),
        owner_id=current_user["id"],
    )

    if updated_project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    return updated_project


@router.delete("/{project_id}")
def delete_project(
    project_id: str,
    current_user=Depends(get_current_user),
):
    deleted = project_service.delete_project(
        project_id,
        owner_id=current_user["id"],
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    return {
        "message": "Project deleted successfully"
    }