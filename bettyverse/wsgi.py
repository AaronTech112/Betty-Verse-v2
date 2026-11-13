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


def _reset_postgres_sequences(connection):
    if connection.vendor != "postgresql":
        return
    from django.apps import apps
    from django.core.management.color import no_style

    core_models = list(apps.get_app_config("core").get_models())
    statements = connection.ops.sequence_reset_sql(no_style(), core_models)
    if statements:
        with connection.cursor() as cursor:
            for sql in statements:
                cursor.execute(sql)


def _ensure_database_ready():
    """Automatically run migrations, seed initial data, and sync sequences on startup."""
    try:
        from django.core.management import call_command
        from django.db import connection
        from django.db.migrations.executor import MigrationExecutor

        executor = MigrationExecutor(connection)
        plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
        if plan:
            print("Applying pending database migrations...", file=sys.stderr)
            call_command("migrate", interactive=False, verbosity=1)

        from core.models import Package, User

        if not Package.objects.exists() or not User.objects.filter(username="Betty").exists():
            print("Seeding initial database records and users from fixture...", file=sys.stderr)
            call_command("loaddata", "initial_packages.json", verbosity=1)

        _reset_postgres_sequences(connection)
    except Exception as exc:
        print(f"Database initialization warning: {exc}", file=sys.stderr)


_ensure_database_ready()

app = application


