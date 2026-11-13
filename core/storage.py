import mimetypes
import os
from urllib.parse import urljoin

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible
from django.utils.encoding import filepath_to_uri


@deconstructible
class DatabaseMediaStorage(Storage):
    """Store uploaded media files in PostgreSQL/SQLite while reading existing repo media from disk."""

    @staticmethod
    def _normalize_name(name: str) -> str:
        return str(name or "").replace("\\", "/").lstrip("/")

    @staticmethod
    def _disk_path(name: str) -> str:
        return os.path.join(settings.MEDIA_ROOT, name)

    def _open(self, name, mode="rb"):
        from core.models import MediaFile

        normalized = self._normalize_name(name)
        media = MediaFile.objects.filter(name=normalized).first()
        if media is not None:
            return ContentFile(bytes(media.content), name=normalized)

        disk_path = self._disk_path(normalized)
        if os.path.exists(disk_path):
            return open(disk_path, mode)

        raise FileNotFoundError(f"Media file not found: {normalized}")

    def _save(self, name, content):
        from core.models import MediaFile

        normalized = self._normalize_name(name)
        if hasattr(content, "seek"):
            content.seek(0)
        data = content.read()
        if isinstance(data, str):
            data = data.encode("utf-8")

        guessed_type, _ = mimetypes.guess_type(normalized)
        content_type = (
            getattr(content, "content_type", None)
            or guessed_type
            or "application/octet-stream"
        )

        MediaFile.objects.update_or_create(
            name=normalized,
            defaults={
                "content": data,
                "content_type": content_type,
                "size": len(data),
            },
        )
        return normalized

    def delete(self, name):
        from core.models import MediaFile

        normalized = self._normalize_name(name)
        if not normalized:
            return
        MediaFile.objects.filter(name=normalized).delete()

    def exists(self, name):
        from core.models import MediaFile

        normalized = self._normalize_name(name)
        if not normalized:
            return False
        try:
            if MediaFile.objects.filter(name=normalized).exists():
                return True
        except Exception:
            pass
        return os.path.exists(self._disk_path(normalized))

    def size(self, name):
        from core.models import MediaFile

        normalized = self._normalize_name(name)
        media_size = (
            MediaFile.objects.filter(name=normalized)
            .values_list("size", flat=True)
            .first()
        )
        if media_size is not None:
            return media_size

        disk_path = self._disk_path(normalized)
        if os.path.exists(disk_path):
            return os.path.getsize(disk_path)
        return 0

    def url(self, name):
        normalized = self._normalize_name(name)
        return urljoin(settings.MEDIA_URL, filepath_to_uri(normalized))
