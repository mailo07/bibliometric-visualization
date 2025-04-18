import os
from datetime import timedelta

class Config:
    # Flask settings
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
    DEBUG = os.environ.get('FLASK_DEBUG', 'True') == 'True'
    
    # Database settings
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_PORT = int(os.environ.get('DB_PORT', 8080))
    DB_NAME = os.environ.get('DB_NAME', 'bibliometric_data')
    DB_USER = os.environ.get('DB_USER', 'postgres')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', 'vivo18#')
    
    # Cache settings
    CACHE_TYPE = 'simple'
    CACHE_DEFAULT_TIMEOUT = 300
    CACHE_TIMEOUT = 300
    
    # API Configuration
    CROSSREF_API_KEY = os.environ.get('CROSSREF_API_KEY', '')
    SEMANTIC_SCHOLAR_API_KEY = os.environ.get('SEMANTIC_SCHOLAR_API_KEY', '')
    OPENALEX_API_KEY = os.environ.get('OPENALEX_API_KEY', 'demo_key')
    PUBMED_API_KEY = os.environ.get('PUBMED_API_KEY', '')
    
    # Application identification
    ADMIN_EMAIL = '404brain.dead@gmail.com'
    APP_NAME = 'BiblioKnow'
    APP_VERSION = '1.0'
    EXTERNAL_API_RATE_LIMIT = 5  # requests per second

    @classmethod
    def has_any_api_keys(cls):
        """Check if at least one API key is configured"""
        return any([
            cls.CROSSREF_API_KEY,
            cls.SEMANTIC_SCHOLAR_API_KEY,
            cls.OPENALEX_API_KEY,
            cls.PUBMED_API_KEY
        ])