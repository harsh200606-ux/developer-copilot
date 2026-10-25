
import zipfile

import pytest

from app.services import project_ingestion_service as ingestion


def create_zip(path, files):
    with zipfile.ZipFile(path, "w") as archive:
        for filename, content in files.items():
            archive.writestr(filename, content)


def test_valid_project_zip_is_ingested(tmp_path, monkeypatch):
    monkeypatch.setattr(
        ingestion,
        "STORAGE_DIR",
        tmp_path / "storage",
    )

    archive_path = tmp_path / "project.zip"

    create_zip(
        archive_path,
        {
            "requirements.txt": "fastapi\n",
            "src/main.py": "print('Hello')\n",
            "README.md": "# Demo project\n",
        },
    )

    result = ingestion.ingest_project_zip(
        archive_path=archive_path,
        owner_id="test-user",
        project_id="test-project",
    )

    assert result["inventory"]["file_count"] == 3
    assert "requirements.txt" in result["inventory"]["manifest_files"]
    assert "src/main.py" in [
        item["path"] for item in result["inventory"]["files"]
    ]

    assert (tmp_path / "storage").resolve() in (
        __import__("pathlib").Path(result["storage_path"]).resolve().parents
    )


def test_path_traversal_zip_is_rejected(tmp_path, monkeypatch):
    monkeypatch.setattr(
        ingestion,
        "STORAGE_DIR",
        tmp_path / "storage",
    )

    archive_path = tmp_path / "malicious.zip"

    create_zip(
        archive_path,
        {
            "../outside.txt": "This must not be extracted",
        },
    )

    with pytest.raises(ingestion.ProjectIngestionError):
        ingestion.ingest_project_zip(
            archive_path=archive_path,
            owner_id="test-user",
            project_id="test-project",
        )

    assert not (tmp_path / "outside.txt").exists()


def test_oversized_archive_is_rejected(tmp_path, monkeypatch):
    archive_path = tmp_path / "large.zip"
    archive_path.write_bytes(b"x" * (ingestion.MAX_ARCHIVE_SIZE + 1))

    with pytest.raises(ingestion.ProjectIngestionError):
        ingestion.ingest_project_zip(
            archive_path=archive_path,
            owner_id="test-user",
            project_id="test-project",
        )
