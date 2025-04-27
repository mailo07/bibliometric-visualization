# Fixed config.py
import os
from datetime import timedelta
from flask import Flask
class Config:
    # Flask settings
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
    DEBUG = os.environ.get('FLASK_DEBUG', 'True') == 'True'
    
    # JWT settings
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-for-development')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)  # Added token expiration
    
    # Database settings (updated with connection timeout)
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    
    # Changed to standard PostgreSQL port
    DB_PORT = int(os.environ.get('DB_PORT', 8080))  # Standard PostgreSQL port
    
    DB_NAME = os.environ.get('DB_NAME', 'bibliometric_data')
    DB_USER = os.environ.get('DB_USER', 'postgres')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', 'vivo18#')
    DB_CONNECT_TIMEOUT = 5  # Added connection timeout
    
    # SQLAlchemy settings
    SQLALCHEMY_DATABASE_URI = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?connect_timeout={DB_CONNECT_TIMEOUT}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Cache settings (unchanged)
    CACHE_TYPE = 'simple'
    CACHE_DEFAULT_TIMEOUT = 300
    CACHE_TIMEOUT = 300
    
    # API Configuration (unchanged)
    CROSSREF_API_KEY = os.environ.get('CROSSREF_API_KEY', '')
    SEMANTIC_SCHOLAR_API_KEY = os.environ.get('SEMANTIC_SCHOLAR_API_KEY', '')
    OPENALEX_API_KEY = os.environ.get('OPENALEX_API_KEY', 'demo_key')
    PUBMED_API_KEY = os.environ.get('PUBMED_API_KEY', '')
    
    # Application identification (unchanged)
    ADMIN_EMAIL = '404brain.dead@gmail.com'
    APP_NAME = 'BiblioKnow'
    APP_VERSION = '1.0'
    EXTERNAL_API_RATE_LIMIT = 5

    # CORS settings (added)
    CORS_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000']
    
    @classmethod
    def has_any_api_keys(cls):
        """Check if at least one API key is configured"""
        return any([
            cls.CROSSREF_API_KEY,
            cls.SEMANTIC_SCHOLAR_API_KEY,
            cls.OPENALEX_API_KEY,
            cls.PUBMED_API_KEY
        ])
        
    # File upload settings (unchanged)
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads'))
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload size

# Add to your main Flask app.py file:
from flask_cors import CORS
from config import Config

app = Flask(__name__)
# Configure CORS
CORS(app, resources={r"/api/*": {"origins": Config.CORS_ORIGINS}})