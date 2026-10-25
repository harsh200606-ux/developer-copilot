
import ast
import os
from pathlib import Path


IGNORED_DIRECTORIES = {
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
    ".mypy_cache",
    ".pytest_cache",
    "site-packages",
    "project_storage",
}

MAX_FILE_SIZE = 200_000
MAX_FILES = 2_000
MAX_SYMBOLS = 20_000

class _CallVisitor(ast.NodeVisitor):
    """Collect function call names and their original source locations."""

    def __init__(self, relative_path: str):
        self.relative_path = relative_path
        self.calls = []

    def visit_Call(self, node: ast.Call) -> None:
        name = None

        if isinstance(node.func, ast.Name):
            name = node.func.id
        elif isinstance(node.func, ast.Attribute):
            name = node.func.attr

        if name:
            self.calls.append(
                {
                    "name": name,
                    "file": self.relative_path,
                    "line": node.lineno,
                }
            )

        self.generic_visit(node)


class _SymbolVisitor(ast.NodeVisitor):
    """Collect Python function and class definitions with their locations."""

    def __init__(self, relative_path: str):
        self.relative_path = relative_path
        self.symbols = []
        self.scope = []

    def _record(self, node, kind: str) -> None:
        qualified_name = ".".join([*self.scope, node.name])

        self.symbols.append(
            {
                "name": node.name,
                "qualified_name": qualified_name,
                "kind": kind,
                "file": self.relative_path,
                "line": node.lineno,
                "end_line": getattr(node, "end_lineno", node.lineno),
                "is_async": isinstance(node, ast.AsyncFunctionDef),
            }
        )

    def visit_ClassDef(self, node: ast.ClassDef) -> None:
        self._record(node, "class")
        self.scope.append(node.name)
        self.generic_visit(node)
        self.scope.pop()

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        self._record(node, "function")
        self.scope.append(node.name)
        self.generic_visit(node)
        self.scope.pop()

    def visit_AsyncFunctionDef(
        self,
        node: ast.AsyncFunctionDef,
    ) -> None:
        self._record(node, "function")
        self.scope.append(node.name)
        self.generic_visit(node)
        self.scope.pop()


def extract_python_symbols(project_root: str | Path) -> dict:
    """
    Index Python functions, classes, and call sites without executing code.

    Returns symbol records and function-call records with file paths
    and original source line numbers.
    """
    root = Path(project_root).resolve()

    if not root.exists() or not root.is_dir():
        raise ValueError("Project source directory does not exist.")

    symbols = []
    calls = []

    files_scanned = 0
    files_parsed = 0
    syntax_errors = 0
    files_skipped = 0
    files_truncated = False
    symbols_truncated = False

    for current_root, directories, filenames in os.walk(
        root,
        followlinks=False,
    ):
        directories[:] = sorted(
            name
            for name in directories
            if name not in IGNORED_DIRECTORIES
        )

        for filename in sorted(filenames):
            path = Path(current_root) / filename

            if path.suffix.lower() != ".py":
                continue

            if path.is_symlink() or not path.is_file():
                continue

            if files_scanned >= MAX_FILES:
                files_truncated = True
                break

            files_scanned += 1
            relative_path = path.relative_to(root).as_posix()

            try:
                if path.stat().st_size > MAX_FILE_SIZE:
                    files_skipped += 1
                    continue

                source = path.read_text(
                    encoding="utf-8-sig",
                    errors="replace",
                )

            except OSError:
                files_skipped += 1
                continue

            try:
                tree = ast.parse(source, filename=relative_path)
            except SyntaxError:
                syntax_errors += 1
                continue

            files_parsed += 1

            # Extract function and class definitions.
            visitor = _SymbolVisitor(relative_path)
            visitor.visit(tree)

            remaining = MAX_SYMBOLS - len(symbols)

            if remaining <= 0:
                symbols_truncated = True
                break

            if len(visitor.symbols) > remaining:
                symbols.extend(visitor.symbols[:remaining])
                symbols_truncated = True
            else:
                symbols.extend(visitor.symbols)

            # Extract function call sites from the same parsed file.
            call_visitor = _CallVisitor(relative_path)
            call_visitor.visit(tree)
            calls.extend(call_visitor.calls)

            if symbols_truncated:
                break

        if files_truncated or symbols_truncated:
            break

    symbols.sort(
        key=lambda item: (
            item["file"],
            item["line"],
            item["qualified_name"],
        )
    )

    calls.sort(
        key=lambda item: (
            item["file"],
            item["line"],
            item["name"],
        )
    )

    return {
        "status": "completed",
        "project_root": str(root),
        "language": "python",
        "files_scanned": files_scanned,
        "files_parsed": files_parsed,
        "files_skipped": files_skipped,
        "syntax_errors": syntax_errors,
        "total_symbols": len(symbols),
        "total_calls": len(calls),
        "files_truncated": files_truncated,
        "symbols_truncated": symbols_truncated,
        "symbols": symbols,
        "calls": calls,
    }
