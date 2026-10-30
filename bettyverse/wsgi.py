"""
WSGI config for bettyverse project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/wsgi/
"""

import os
import sys

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bettyverse.settings')

application = get_wsgi_application()


def _ensure_database_ready():
    """Automatically run migrations and seed initial packages on a fresh database (e.g. Neon on Vercel)."""
    try:
        from django.core.management import call_command
        from django.db import connection

        existing_tables = set(connection.introspection.table_names())
        required_tables = {"core_package", "core_user", "django_session"}
        if not required_tables.issubset(existing_tables):
            print("Initializing database schema via migrate...", file=sys.stderr)
            call_command("migrate", interactive=False, verbosity=1)

        from core.models import Package

        if not Package.objects.exists():
            print("Seeding initial packages fixture...", file=sys.stderr)
            call_command("loaddata", "initial_packages.json", verbosity=1)
    except Exception as exc:
        print(f"Database initialization warning: {exc}", file=sys.stderr)


_ensure_database_ready()

app = application


