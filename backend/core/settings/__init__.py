# Settings module - imports based on environment
# Set DJANGO_ENV=production for production settings
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file BEFORE checking environment
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / '.env')

environment = os.environ.get('DJANGO_ENV', 'development')

if environment == 'production':
    from .production import *
else:
    from .development import *
