#!/bin/bash
echo "BUILD START"
python3 -m pip install -r requirements.txt
python3 manage.py collectstatic --noinput --clear
mkdir -p staticfiles_build/static
cp -r staticfiles/* staticfiles_build/static/ 2>/dev/null || true
echo "BUILD END"
