
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.api.dependencies import get_current_user
from app.core.config import settings
from app.services.ollama_service import (
    OllamaServiceError,
    generate_response,
)
from app.services.project_context_service import build_project_context
from app.services.project_ingestion_service import STORAGE_DIR
from app.services.project_service import ProjectService
from app.services.project_context_service import (
    build_project_context,
    _format_relevant_call_sites,
)
from app.services.code_symbol_service import extract_python_symbols
import re

router = APIRouter(
    prefix="/api/copilot",
    tags=["Copilot"],
)

project_service = ProjectService()


class ChatMessage(BaseModel):
    role: str
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=10)
    project_id: str | None = Field(default=None, max_length=100)


class ChatResponse(BaseModel):
    reply: str
    model: str



def get_verified_call_site_answer(
    project_root: Path,
    question: str,
) -> str | None:
    """Return deterministic AST-verified answers about Python definitions and calls."""

    def normalize_path(path: str) -> str:
        parts = path.replace("\\", "/").split("/")
        return "/".join(
            part for part in parts if part not in ("", ".")
        )

    question_lower = question.lower()

    # Determine whether this is a definition or call-site question.
    asks_definition = any(
        phrase in question_lower
        for phrase in (
            "where is",
            "where are",
            "where defined",
            "definition of",
            "defined in",
            "find the definition",
            "show the definition",
            "function definition",
        )
    )

    asks_about_calls = any(
        phrase in question_lower
        for phrase in (
            "call site",
            "call sites",
            "calls to",
            "call to",
            "callers of",
            "caller of",
            "how many times",
            "how many calls",
            "where used",
            "usages of",
            "references to",
            "function calls",
        )
    )

    if not asks_definition and not asks_about_calls:
        return None

    # Extract the identifier, preferring backticks.
    match = re.search(
        r"`([A-Za-z_][A-Za-z0-9_]*)`",
        question,
    )

    if not match:
        match = re.search(
            r"\b(?:definition|defined|calls?|callers?|usages?|references?)"
            r"\s+(?:of|for|to)\s+"
            r"`?([A-Za-z_][A-Za-z0-9_]*)`?",
            question,
            re.IGNORECASE,
        )

    if not match:
        match = re.search(
            r"\b([A-Za-z_][A-Za-z0-9_]*)\s+"
            r"(?:defined|called|used|invoked)\b",
            question,
            re.IGNORECASE,
        )

    if not match:
        return None

    target_name = match.group(1)

    try:
        index = extract_python_symbols(project_root)
    except (OSError, ValueError):
        return "Could not scan the uploaded project's Python source."

    # Optional file restriction from the question.
    file_match = re.search(
        r"(?<![\w.-])"
        r"([A-Za-z0-9_.-]+(?:[/\\][A-Za-z0-9_.-]+)*\.py)"
        r"(?![\w.-])",
        question,
        re.IGNORECASE,
    )

    requested_path = (
        normalize_path(file_match.group(1))
        if file_match
        else None
    )

    def path_matches(path: str) -> bool:
        if requested_path is None:
            return True

        normalized = normalize_path(path)
        return (
            normalized == requested_path
            or normalized.endswith("/" + requested_path)
        )

    if asks_definition:
        definitions = [
            symbol
            for symbol in index.get("symbols", [])
            if symbol.get("name") == target_name
            and symbol.get("kind") == "function"
            and path_matches(symbol.get("file", ""))
        ]

        definitions.sort(
            key=lambda item: (item["file"], item["line"])
        )

        scope = (
            f" in `{requested_path}`"
            if requested_path
            else " in the uploaded project"
        )

        lines = [
            f"AST-verified function definitions for `{target_name}`{scope}:",
            f"**Definition count: {len(definitions)}**",
        ]

        if definitions:
            lines.extend(
                f"- `{item['file']}:{item['line']}` — "
                f"`def {target_name}(...)`"
                for item in definitions
            )
        else:
            lines.append(
                "No matching function definition was found "
                "by the AST scanner in the requested scope."
            )

        lines.append(
            "\nThese locations come from parsing Python source code; "
            "the code was not executed."
        )

        return "\n".join(lines)

    calls = [
        call
        for call in index.get("calls", [])
        if call.get("name") == target_name
        and path_matches(call.get("file", ""))
    ]

    calls.sort(key=lambda item: (item["file"], item["line"]))

    scope = (
        f" in `{requested_path}`"
        if requested_path
        else " in the uploaded project"
    )

    lines = [
        f"AST-verified call sites for `{target_name}`{scope}:",
        f"**Verified call count: {len(calls)}**",
    ]

    if calls:
        lines.extend(
            f"- `{call['file']}:{call['line']}` — "
            f"`{target_name}(...)`"
            for call in calls
        )
    else:
        lines.append(
            "No matching call sites were found by the AST scanner "
            "in the requested scope."
        )

    lines.append(
        "\nThese results come from parsing Python source code; "
        "the code was not executed."
    )

    return "\n".join(lines)


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    project_context = None
    project_root = None

    # A project is optional; without one, normal chat works as before.
    if request.project_id:
        project = project_service.get_project_document(
            request.project_id,
            current_user["id"],
        )

        # Do not reveal whether another user's project exists.
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found.",
            )

        source_path = project.get("source_storage_path")

        if not source_path:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Upload a project ZIP before using project-aware chat.",
            )

        try:
            storage_root = Path(STORAGE_DIR).resolve()
            project_root = Path(source_path).resolve()

            if not project_root.is_relative_to(storage_root):
                raise ValueError(
                    "Project path is outside the project storage directory."
                )

            project_context = build_project_context(
                project_root=project_root,
                question=request.message.strip(),
            )

        except ValueError as error:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(error),
            ) from error

        except OSError as error:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not read the uploaded project files.",
            ) from error

    try:
        # Answer function call-site questions directly from the AST scanner.
        # This avoids relying on the language model for exact counts and lines.
        if request.project_id and project_root is not None:
            verified_answer = get_verified_call_site_answer(
                project_root=project_root,
                question=request.message.strip(),
            )

            if verified_answer is not None:
                return ChatResponse(
                    reply=verified_answer,
                    model="AST source analysis",
                )

        # All other questions continue to use Ollama.
        reply = await generate_response(
            prompt=request.message.strip(),
            history=[
                item.model_dump()
                for item in request.history
            ],
            project_context=project_context,
        )

        return ChatResponse(
            reply=reply,
            model=settings.ollama_model,
        )

    except OllamaServiceError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error),
        ) from error

    except (OSError, ValueError) as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not analyze the uploaded project source.",
        ) from error
