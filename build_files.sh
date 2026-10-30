#!/bin/bash
set -e
echo "BUILD START"
python3 -m pip install -r requirements.txt
python3 manage.py collectstatic --noinput --clear
python3 manage.py migrate --noinput || echo "Skipping build-time migrate (will run at startup)"
python3 -c "import os, django; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bettyverse.settings'); django.setup(); from core.models import Package; from django.core.management import call_command; call_command('loaddata', 'initial_packages.json') if not Package.objects.exists() else None" || echo "Skipping build-time seed"
mkdir -p staticfiles_build/static
cp -r staticfiles/* staticfiles_build/static/ 2>/dev/null || true
echo "BUILD END"
