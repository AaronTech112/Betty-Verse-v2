import os
import sys
from pathlib import Path

# Add project root directory to path so imports work seamlessly on Vercel
current_dir = Path(__file__).resolve().parent
project_root = current_dir.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from bettyverse.wsgi import application

app = application
