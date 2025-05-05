# Fixed config.py
import os
from datetime import timedelta
from flask import Flask
from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()

class Config:
    # Flask settings
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
    DEBUG = os.environ.get('FLASK_DEBUG', 'True') == 'True'
    
    # Application settings
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev_key')
    TESTING = os.getenv('TESTING', 'False').lower() == 'true'
    ENV = os.getenv('ENV', 'development')
    
    # JWT settings
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # Database settings
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_PORT = int(os.environ.get('DB_PORT', 8080))      
    DB_NAME = os.environ.get('DB_NAME', 'bibliometric_data')
    DB_USER = os.environ.get('DB_USER', 'postgres')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', 'vivo18#')
    DB_CONNECT_TIMEOUT = 5  # Connection timeout
    
    # Construct DATABASE_URL from individual components
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?connect_timeout={DB_CONNECT_TIMEOUT}"
    
    # SQLAlchemy settings
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Cache settings
    CACHE_TYPE = 'simple'
    CACHE_DEFAULT_TIMEOUT = 300  # 5 minutes
    CACHE_TIMEOUT = 300
    
    # API Configuration
    CROSSREF_API_KEY = os.environ.get('CROSSREF_API_KEY', '')
    SEMANTIC_SCHOLAR_API_KEY = os.environ.get('SEMANTIC_SCHOLAR_API_KEY', '')
    OPENALEX_API_KEY = os.environ.get('OPENALEX_API_KEY', 'demo_key')
    PUBMED_API_KEY = os.environ.get('PUBMED_API_KEY', '')
    ZOTERO_API_KEY = os.getenv('ZOTERO_API_KEY', '')
    
    # Application identification
    ADMIN_EMAIL = '404brain.dead@gmail.com'
    APP_NAME = 'BiblioKnow'
    APP_VERSION = '1.0'
    EXTERNAL_API_RATE_LIMIT = 5

    # CORS settings
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
    
    # Logging configuration
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    
    # External API rate limits (requests per minute)
    OPENLIBRARY_RATE_LIMIT = int(os.getenv('OPENLIBRARY_RATE_LIMIT', 60))
    DBLP_RATE_LIMIT = int(os.getenv('DBLP_RATE_LIMIT', 30))
    ARXIV_RATE_LIMIT = int(os.getenv('ARXIV_RATE_LIMIT', 20))
    ZOTERO_RATE_LIMIT = int(os.getenv('ZOTERO_RATE_LIMIT', 30))
    
    # File upload settings
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads'))
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload size
    
    ELASTICSEARCH_HOST = os.environ.get('ELASTICSEARCH_HOST', 'localhost')
    ELASTICSEARCH_PORT = int(os.environ.get('ELASTICSEARCH_PORT', 9200))
    ELASTICSEARCH_ENABLED = os.environ.get('ELASTICSEARCH_ENABLED', 'False').lower() == 'true'