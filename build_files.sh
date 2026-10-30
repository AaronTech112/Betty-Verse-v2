#!/bin/bash
echo "BUILD START"
mkdir -p staticfiles_build/static
cp -r staticfiles/* staticfiles_build/static/ 2>/dev/null || true
echo "BUILD END"
