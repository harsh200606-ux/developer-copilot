
import ast
import json
import re
from pathlib import Path
from app.services.code_symbol_service import extract_python_symbols


from app.services.project_ingestion_service import STORAGE_DIR


# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

MAX_FILES = 8
MAX_FILE_CHARS = 6000
MAX_REQUESTED_FILE_CHARS = 24000
MAX_TOTAL_CHARS = 24000
MAX_CANDIDATES = 3000
MAX_INVENTORY_FILES = 200
MAX_SOURCE_FILE_BYTES = 200_000

BLOCKED_DIRS = {
    ".git",
    ".venv",
    "venv",
    "env",
    "__pycache__",
    "node_modules",
    "dist",
    "build",
    ".idea",
    ".vscode",
    "site-packages",
    "project_storage",
}

BLOCKED_FILES = {
    ".env",
    ".env.local",
    ".env.production",
    "id_rsa",
    "id_ed25519",
    "credentials.json",
    "secrets.json",
}

ALLOWED_EXTENSIONS = {
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".html",
    ".css",
    ".json",
    ".md",
    ".txt",
    ".yml",
    ".yaml",
    ".toml",
    ".ini",
    ".sql",
    ".sh",
    ".bat",
    ".ps1",
    ".xml",
    ".ipynb",
}

SECRET_PATTERNS = [
    re.compile(
        r"(?i)(api[_-]?key|secret|password|passwd|token|"
        r"access[_-]?key|private[_-]?key)"
        r"\s*[:=]\s*(['\"])[^'\"]{4,}\2"
    ),
    re.compile(
        r"(?i)\bBearer\s+[A-Za-z0-9._~+/=-]{12,}"
    ),
]

THREAT_WORKFLOW_FILES = (
    "routes/threat_routes.py",
    "services/threat_db_service.py",
    "services/threat_api_service.py",
)

TARGETED_FUNCTIONS = {
    "routes/threat_routes.py": {
        "analyze_threat",
    },
    "services/threat_db_service.py": {
        "get_threat_collection",
        "find_threat_result",
        "save_threat_result",
    },
    "services/threat_api_service.py": {
        "analyze_ip_with_virustotal",
        "analyze_url_with_virustotal",
    },
}
def _format_relevant_symbols(project_root, selected_files, question):
    """Build a compact index of Python functions and classes."""
    try:
        result = extract_python_symbols(project_root)
    except (OSError, ValueError):
        return []

    selected_paths = {
        _normalise_path(item["relative_path"])
        for item in selected_files
    }

    question_words = {
        word.lower()
        for word in re.findall(
            r"[A-Za-z_][A-Za-z0-9_]*",
            question,
        )
    }

    matching_symbols = []
    other_symbols = []

    for symbol in result["symbols"]:
        symbol_file = _normalise_path(symbol["file"])

        if symbol_file not in selected_paths:
            continue

        name = symbol["name"]
        name_lower = name.lower()

        line = (
            f"- {symbol['kind']}: {symbol['qualified_name']} "
            f"({symbol['file']}:{symbol['line']}-{symbol['end_line']})"
        )

        if (
            name_lower in question_words
            or any(
                len(word) >= 4 and word in name_lower
                for word in question_words
            )
        ):
            matching_symbols.append(line)
        else:
            other_symbols.append(line)

    lines = matching_symbols[:40]

    if len(lines) < 40:
        lines.extend(other_symbols[:40 - len(lines)])

    if not lines:
        return []

    return [
        "PYTHON SYMBOL INDEX (definitions verified by AST):",
        *lines,
        "",
    ]

# ---------------------------------------------------------
# Helpers
# ---------------------------------------------------------

def _normalise_path(value):
    """Normalise a path for comparisons across operating systems."""
    return str(value).replace("\\", "/").strip().lower()


def _is_blocked_path(path):
    """Return True for paths that should never enter project context."""
    path = Path(path)

    blocked_files = {name.lower() for name in BLOCKED_FILES}
    blocked_dirs = {name.lower() for name in BLOCKED_DIRS}

    if path.name.lower() in blocked_files:
        return True

    if path.suffix.lower() in {
        ".pem",
        ".key",
        ".p12",
        ".pfx",
        ".db",
        ".sqlite",
        ".sqlite3",
        ".log",
        ".pyc",
    }:
        return True

    if any(part.lower() in blocked_dirs for part in path.parts):
        return True

    if path.name.lower().startswith(".env"):
        return True

    return False


def _sanitise_source(content):
    """Redact common hard-coded secrets before adding source to context."""

    def redact(match):
        value = match.group(0)

        if "=" in value:
            prefix = value.split("=", 1)[0]
            return prefix + '="[REDACTED]"'

        if ":" in value:
            prefix = value.split(":", 1)[0]
            return prefix + ': "[REDACTED]"'

        return "[REDACTED SECRET]"

    result = content

    for pattern in SECRET_PATTERNS:
        result = pattern.sub(redact, result)

    return result


def _read_text_file(path):
    """Read a supported source file safely."""
    try:
        if path.stat().st_size > MAX_SOURCE_FILE_BYTES:
            return None

        content = path.read_text(
            encoding="utf-8",
            errors="replace",
        )

        return _sanitise_source(content)

    except (OSError, UnicodeError):
        return None


def _collect_candidates(project_root):
    """Collect supported source files from an extracted project."""
    project_root = Path(project_root).resolve()
    candidates = []

    if not project_root.exists() or not project_root.is_dir():
        return candidates

    for path in project_root.rglob("*"):
        if not path.is_file():
            continue

        try:
            relative_path = path.relative_to(project_root)
        except ValueError:
            continue

        if _is_blocked_path(relative_path):
            continue

        if path.suffix.lower() not in ALLOWED_EXTENSIONS:
            continue

        try:
            if path.stat().st_size > MAX_SOURCE_FILE_BYTES:
                continue
        except OSError:
            continue

        candidates.append(
            {
                "path": path,
                "relative_path": relative_path.as_posix(),
            }
        )

        if len(candidates) >= MAX_CANDIDATES:
            break

    return candidates


def _extract_question_terms(question):
    """Extract useful identifiers and keywords from the user's question."""
    return set(
        re.findall(
            r"[a-zA-Z_][a-zA-Z0-9_.\-/]*",
            question.lower(),
        )
    )


def _score_file(relative_path, content, question):
    """Score a source file for relevance to the current question."""
    path_lower = _normalise_path(relative_path)
    filename = Path(relative_path).name.lower()
    stem = Path(relative_path).stem.lower()
    extension = Path(relative_path).suffix.lower()
    question_lower = question.lower()

    score = 0
    normalised_question = _normalise_path(question)

    if path_lower in normalised_question:
        score += 5000

    if filename and filename in normalised_question:
        score += 3000

    if stem and len(stem) > 2 and stem in normalised_question:
        score += 1000

    terms = _extract_question_terms(question)

    for term in terms:
        cleaned_term = term.strip("./-")

        if len(cleaned_term) < 3:
            continue

        if cleaned_term in path_lower:
            score += 100

        if cleaned_term in filename:
            score += 150

    asks_python = any(
        term in question_lower
        for term in (
            "python",
            "function",
            "class",
            "method",
            "implementation",
            "code",
        )
    )

    asks_routes = any(
        term in question_lower
        for term in (
            "route",
            "routes",
            "endpoint",
            "endpoints",
            "api",
            "blueprint",
            "url",
            "urls",
        )
    )

    asks_tests = any(
        term in question_lower
        for term in (
            "test",
            "tests",
            "pytest",
            "coverage",
        )
    )

    asks_database = any(
        term in question_lower
        for term in (
            "database",
            "mongodb",
            "mongo",
            "collection",
            "collections",
            "query",
            "schema",
        )
    )

    asks_frontend = any(
        term in question_lower
        for term in (
            "frontend",
            "react",
            "component",
            "page",
            "interface",
            "ui",
        )
    )

    content_lower = content.lower()

    asks_threat_analysis = any(
        term in question_lower
        for term in (
            "ip address",
            "url",
            "virustotal",
            "duplicate",
            "submitted twice",
            "threat analysis",
            "threat analyzer",
            "threat analyzer's",
            "malicious",
            "suspicious",
        )
    )

    if asks_threat_analysis:
        if any(
            term in path_lower
            for term in (
                "threat_routes",
                "threat_api_service",
                "threat_db_service",
                "threat_service",
            )
        ):
            score += 1200

        if any(
            term in content_lower
            for term in (
                "analyze_ip_with_virustotal",
                "analyze_url_with_virustotal",
                "find_threat_result",
                "save_threat_result",
            )
        ):
            score += 300

    if asks_python:
        score += 500 if extension == ".py" else -300

    if asks_routes:
        if extension == ".py" and any(
            term in path_lower
            for term in ("route", "api", "endpoint", "view")
        ):
            score += 600

        if extension == ".py" and (
            "router" in content_lower
            or "blueprint" in content_lower
            or "@app." in content_lower
            or "@router." in content_lower
        ):
            score += 250

    if asks_tests and "test" in path_lower:
        score += 800

    if asks_database:
        if any(
            term in path_lower
            for term in (
                "database",
                "db_service",
                "schema",
                "model",
                "repository",
            )
        ):
            score += 500

        if any(
            term in content_lower
            for term in (
                "collection(",
                "insert_one(",
                "find_one(",
                "pymongo",
                "motor",
            )
        ):
            score += 200

    if asks_frontend:
        if extension in {".jsx", ".tsx", ".js", ".ts", ".html", ".css"}:
            score += 500

    if filename in {
        "main.py",
        "app.py",
        "server.py",
        "index.js",
        "index.ts",
    }:
        score += 100

    return score




def _find_requested_file(candidates, question, project_root):
    """Find a file or Python function/class explicitly named in the question."""
    normalised_question = _normalise_path(question)

    # 1. Match an explicitly mentioned relative path, including
    # paths that omit a ZIP wrapper directory.
    for item in candidates:
        relative_path = _normalise_path(item["relative_path"])

        if relative_path in normalised_question:
            return item

        path_parts = relative_path.split("/")

        for index in range(1, len(path_parts)):
            suffix_path = "/".join(path_parts[index:])

            if suffix_path and suffix_path in normalised_question:
                return item

    # 2. Match an explicitly mentioned filename.
    for item in candidates:
        filename = Path(item["relative_path"]).name.lower()

        if filename and filename in normalised_question:
            return item

    # 3. Match a Python function or class name.
    question_identifiers = {
        word.lower()
        for word in re.findall(
            r"[A-Za-z_][A-Za-z0-9_]*",
            question,
        )
    }

    if not question_identifiers:
        return None

    try:
        result = extract_python_symbols(
            Path(project_root).resolve()
        )
    except (OSError, ValueError):
        return None

    for symbol in result["symbols"]:
        if symbol["name"].lower() not in question_identifiers:
            continue

        symbol_path = _normalise_path(symbol["file"])

        for item in candidates:
            candidate_path = _normalise_path(item["relative_path"])

            if candidate_path == symbol_path:
                return item

            if candidate_path.endswith("/" + symbol_path):
                return item

    return None



def _extract_named_functions(content, function_names):
    """
    Extract requested Python functions, async functions, and classes.

    Also preserve the existing behavior of including the top-level
    COLLECTION_NAME assignment when extracting selected functions.
    """
    try:
        tree = ast.parse(content)
    except SyntaxError:
        return ""

    lines = content.splitlines()
    excerpts = []
    seen_ranges = set()

    def add_node(node):
        start_line = getattr(node, "lineno", None)
        end_line = getattr(node, "end_lineno", None)

        if start_line is None or end_line is None:
            return

        line_range = (start_line, end_line)

        if line_range in seen_ranges:
            return

        seen_ranges.add(line_range)
        excerpts.append(
            "\n".join(f"{line_number:4}: {lines[line_number - 1]}"
                      for line_number in range(start_line, end_line + 1)
                    )
        )

    # Walk the complete syntax tree so nested functions, class methods,
    # async functions, and nested classes can also be found.
    for node in ast.walk(tree):
        if isinstance(
            node,
            (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef),
        ):
            if node.name in function_names:
                add_node(node)

    # Preserve the existing collection-name constant behavior.
    for node in tree.body:
        if isinstance(node, ast.Assign):
            names = {
                target.id
                for target in node.targets
                if isinstance(target, ast.Name)
            }

            if "COLLECTION_NAME" in names:
                add_node(node)

        elif isinstance(node, ast.AnnAssign):
            if (
                isinstance(node.target, ast.Name)
                and node.target.id == "COLLECTION_NAME"
            ):
                add_node(node)

    return "\n\n".join(excerpts)




def _format_file_excerpt(relative_path, content, limit):
    """Format source with original line numbers and truncation status."""
    lines = content.splitlines(keepends=True)
    numbered_lines = [
        f"{line_number:4}: {line.rstrip()}"
        for line_number, line in enumerate(lines, start=1)
    ]

    numbered_content = "\n".join(numbered_lines)

    if len(numbered_content) > limit:
        excerpt = numbered_content[:limit]
        status = (
            "TRUNCATED: only the beginning of this file is included. "
            "Line numbers refer to the original source file. "
            "Do not assume omitted code is absent."
        )
    else:
        excerpt = numbered_content
        status = (
            "COMPLETE FILE CONTENT. Line numbers refer to "
            "the original source file."
        )

    return (
        f"\n### FILE: {relative_path}\n"
        f"Source status: {status}\n"
        "```text\n"
        f"{excerpt}\n"
        "```\n"
    )



def _is_threat_workflow_question(question):
    """Detect questions that specifically concern threat analysis."""
    question_lower = question.lower()

    return any(
        term in question_lower
        for term in (
            "threat analyzer",
            "threat analysis",
            "threat-analysis",
            "threat detection",
            "threat workflow",
            "threat_routes",
            "threat_db_service",
            "threat_api_service",
            "virustotal",
            "ip address",
            "submitted twice",
            "malicious",
            "suspicious",
        )
    )



# ---------------------------------------------------------
# Project context builder
# ---------------------------------------------------------

def _format_relevant_call_sites(project_root, selected_files, question):
    """Return AST-verified call sites for a function mentioned in a question."""
    # Prefer an explicitly quoted Python identifier.
    match = re.search(
        r"`([A-Za-z_][A-Za-z0-9_]*)`",
        question,
    )

    # Support questions such as:
    # "Find every call to get_bson_size"
    # "Show callers of get_bson_size"
    if not match:
        match = re.search(
            r"\b(?:calls?|call sites?|callers?|usages?|references?)\b"
            r".{0,80}?\b(?:to|of|for)\s+"
            r"`?([A-Za-z_][A-Za-z0-9_]*)`?",
            question,
            re.IGNORECASE,
        )

    # Support "Where is get_bson_size used?"
    if not match:
        match = re.search(
            r"\b([A-Za-z_][A-Za-z0-9_]*)\b"
            r".{0,60}\b(?:called|used|invoked)\b",
            question,
            re.IGNORECASE,
        )

    if not match:
        return []

    target_name = match.group(1)

    try:
        index = extract_python_symbols(project_root)
    except (OSError, ValueError):
        return [
            "",
            "CALL-SITE INDEX: Could not scan the project source.",
        ]

    # If the question specifies a file, restrict results to that file.
    # Otherwise, search all files indexed by the AST scanner.
    file_match = re.search(
        r"(?<![\w.-])"
        r"([A-Za-z0-9_.-]+(?:[/\\][A-Za-z0-9_.-]+)*\.py)"
        r"(?![\w.-])",
        question,
        re.IGNORECASE,
    )

    requested_path = None

    if file_match:
        requested_path = _normalise_path(
            file_match.group(1)
        ).lstrip("./")

    matching_calls = []

    for call in index.get("calls", []):
        if call["name"] != target_name:
            continue

        call_path = _normalise_path(
            call["file"]
        ).lstrip("./")

        if (
            requested_path is not None
            and call_path != requested_path
        ):
            continue

        matching_calls.append(call)

    matching_calls.sort(
        key=lambda call: (
            call["file"],
            call["line"],
        )
    )

    lines = [
        "",
        f"VERIFIED CALL SITES FOR {target_name}:",
        f"Verified call count: {len(matching_calls)}",
    ]

    if matching_calls:
        lines.extend(
            f"- {call['file']}:{call['line']} — "
            f"{target_name}(...)"
            for call in matching_calls
        )
    else:
        lines.append(
            "No matching calls were found by the AST scanner "
            "in the searched scope."
        )

    lines.append(
        "These call counts and locations come from AST analysis. "
        "Do not substitute guessed line numbers or a conflicting count."
    )

    return lines


def build_project_context(project_root, question):
    """
    Build source-code context relevant to the user's question.

    Threat-workflow questions use configured threat-workflow files.
    General questions use relevance scoring and prioritize explicitly
    requested files.

    Also supports ZIP uploads containing one wrapper directory.
    """
    project_root = Path(project_root).resolve()

    if not project_root.exists() or not project_root.is_dir():
        return (
            "PROJECT SOURCE UNAVAILABLE: The project directory does not "
            "exist or is not a directory."
        )

    # Handle ZIP archives containing one wrapper directory.
    direct_candidates = _collect_candidates(project_root)

    if not direct_candidates:
        ignored = {
            ".git",
            ".venv",
            "venv",
            "env",
            "__pycache__",
            "node_modules",
            "dist",
            "build",
        }

        child_directories = [
            child
            for child in project_root.iterdir()
            if child.is_dir()
            and not child.is_symlink()
            and child.name.lower() not in ignored
        ]

        if len(child_directories) == 1:
            child_candidates = _collect_candidates(
                child_directories[0]
            )

            if child_candidates:
                project_root = child_directories[0].resolve()

    candidates = _collect_candidates(project_root)

    if not candidates:
        return (
            "PROJECT SOURCE UNAVAILABLE: No supported source files "
            "were found in the project directory."
        )

    requested_file = _find_requested_file(
        candidates,
        question,
        project_root,
    )

    scored_candidates = []

    for item in candidates:
        content = _read_text_file(item["path"])

        if content is None:
            continue

        score = _score_file(
            item["relative_path"],
            content,
            question,
        )

        scored_candidates.append(
            {
                "relative_path": item["relative_path"],
                "content": content,
                "score": score,
            }
        )

    if not scored_candidates:
        return (
            "PROJECT SOURCE UNAVAILABLE: Source files could not be read."
        )

    scored_candidates.sort(
        key=lambda item: item["score"],
        reverse=True,
    )

    asks_threat_workflow = _is_threat_workflow_question(question)

    if asks_threat_workflow:
        # Preserve existing threat-workflow file selection.
        selected = []

        for filename in THREAT_WORKFLOW_FILES:
            match = next(
                (
                    item
                    for item in scored_candidates
                    if _normalise_path(
                        item["relative_path"]
                    ).endswith(filename)
                ),
                None,
            )

            if match:
                selected.append(match)

    else:
        selected = []

        # Put an explicitly requested file first.
        if requested_file:
            requested_path = _normalise_path(
                requested_file["relative_path"]
            )

            for item in scored_candidates:
                if (
                    _normalise_path(item["relative_path"])
                    == requested_path
                ):
                    selected.append(item)
                    break

        # Fill remaining slots with relevant files.
        for item in scored_candidates:
            if len(selected) >= MAX_FILES:
                break

            if any(
                existing["relative_path"] == item["relative_path"]
                for existing in selected
            ):
                continue

            selected.append(item)

    inventory_paths = sorted(
        item["relative_path"]
        for item in candidates
    )

    inventory = inventory_paths[:MAX_INVENTORY_FILES]

    output = [
        "PROJECT SOURCE CONTEXT",
        f"Project root: {project_root}",
        f"Question: {question}",
        f"Supported source files discovered: {len(candidates)}",
        "",
        "IMPORTANT INSTRUCTIONS:",
        "- Use the actual source excerpts below as primary evidence.",
        "- Do not invent routes, functions, collections, or filenames.",
        "- If a detail cannot be verified from the available source, "
        "say so explicitly.",
        "- A TRUNCATED file contains only a partial excerpt.",
        "- Do not assume omitted code is absent.",
        "",
        "PROJECT FILE INVENTORY:",
    ]

    output.extend(
        f"- {path}"
        for path in inventory
    )

    if len(inventory_paths) > MAX_INVENTORY_FILES:
        output.append(
            f"- ... {len(inventory_paths) - MAX_INVENTORY_FILES} "
            "additional files omitted from the inventory."
        )

    output.extend(
        [
            "",
            "FILES SELECTED FOR THIS QUESTION:",
        ]
    )

    output.extend(
        f"- {item['relative_path']} "
        f"(relevance score: {item['score']})"
        for item in selected
    )

    output.append("")

    # Add the verified Python symbol index.
    symbol_lines = _format_relevant_symbols(
        project_root=project_root,
        selected_files=selected,
        question=question,
    )

    output.extend(symbol_lines)

    # Add independently verified function call sites.
    call_site_lines = _format_relevant_call_sites(
        project_root=project_root,
        selected_files=selected,
        question=question,
    )

    output.extend(call_site_lines)

    output.extend(
        [
            "",
            "SOURCE EXCERPTS:",
        ]
    )

    context = "\n".join(output)
    remaining = MAX_TOTAL_CHARS - len(context)

    # Recognize requests for a specific function or class definition.
    requested_symbol_match = re.search(
        r"\b(?:function|class|method|definition)\s+"
        r"(?:of\s+)?`?([A-Za-z_][A-Za-z0-9_]*)`?",
        question,
        re.IGNORECASE,
    )

    requested_symbol_name = (
        requested_symbol_match.group(1)
        if requested_symbol_match
        else None
    )

    for item in selected:
        if remaining <= 0:
            break

        path_lower = _normalise_path(
            item["relative_path"]
        )

        is_threat_workflow_file = any(
            path_lower.endswith(name)
            for name in THREAT_WORKFLOW_FILES
        )

        is_requested = (
            requested_file is not None
            and _normalise_path(item["relative_path"])
            == _normalise_path(requested_file["relative_path"])
        )

        if is_requested or is_threat_workflow_file:
            requested_limit = MAX_REQUESTED_FILE_CHARS
        else:
            requested_limit = MAX_FILE_CHARS

        excerpt_limit = min(
            requested_limit,
            remaining,
        )

        if excerpt_limit <= 0:
            break

        matching_functions = next(
            (
                names
                for filename, names in TARGETED_FUNCTIONS.items()
                if path_lower.endswith(filename)
            ),
            None,
        )

        if matching_functions:
            excerpt = _extract_named_functions(
                item["content"],
                matching_functions,
            )

            if excerpt:
                formatted = (
                    f"\n### FILE: {item['relative_path']}\n"
                    "Source status: SELECTED FUNCTION EXCERPTS\n"
                    "```python\n"
                    f"{excerpt}\n"
                    "```\n"
                )
            else:
                formatted = _format_file_excerpt(
                    item["relative_path"],
                    item["content"],
                    excerpt_limit,
                )

        else:
            requested_symbol = (
                requested_symbol_name
                if is_requested
                else None
            )

            if requested_symbol:
                extracted = _extract_named_functions(
                    item["content"],
                    {requested_symbol},
                )

                if extracted:
                    formatted = (
                        f"\n### FILE: {item['relative_path']}\n"
                        "Source status: REQUESTED FUNCTION EXCERPT\n"
                        "```python\n"
                        f"{extracted[:excerpt_limit]}\n"
                        "```\n"
                    )
                else:
                    formatted = _format_file_excerpt(
                        item["relative_path"],
                        item["content"],
                        excerpt_limit,
                    )
            else:
                formatted = _format_file_excerpt(
                    item["relative_path"],
                    item["content"],
                    excerpt_limit,
                )

        # Enforce the overall context budget.
        if len(formatted) > remaining:
            formatted = formatted[:remaining]

        context += formatted
        remaining = MAX_TOTAL_CHARS - len(context)

    return context

# ---------------------------------------------------------
# Project inventory
# ---------------------------------------------------------

def inspect_project_inventory(project_root):
    """Return a JSON-serialisable summary of a project directory."""
    project_root = Path(project_root).resolve()

    if not project_root.exists() or not project_root.is_dir():
        return {
            "success": False,
            "error": "Project directory does not exist.",
            "root": str(project_root),
            "total_files": 0,
            "files": [],
        }

    candidates = _collect_candidates(project_root)

    files = sorted(
        item["relative_path"]
        for item in candidates
    )

    extension_counts = {}

    for relative_path in files:
        extension = Path(relative_path).suffix.lower() or "[no extension]"
        extension_counts[extension] = (
            extension_counts.get(extension, 0) + 1
        )

    return {
        "success": True,
        "root": str(project_root),
        "total_files": len(files),
        "files": files[:MAX_INVENTORY_FILES],
        "files_omitted": max(
            0,
            len(files) - MAX_INVENTORY_FILES,
        ),
        "extension_counts": extension_counts,
    }


def inspect_project_inventory_json(project_root):
    """Return the inventory as formatted JSON."""
    return json.dumps(
        inspect_project_inventory(project_root),
        indent=2,
    )
