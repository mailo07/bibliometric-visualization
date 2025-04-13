import os

class Config:
    # Database configuration
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '8080')
    DB_NAME = os.getenv('DB_NAME', 'bibliometric_data')
    DB_USER = os.getenv('DB_USER', 'postgres')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'vivo18#')
    
    # External API keys (empty = disabled)
    SEMANTIC_SCHOLAR_API_KEY = os.getenv('SEMANTIC_SCHOLAR_API_KEY', '')
    CROSSREF_API_KEY = os.getenv('CROSSREF_API_KEY', '')
    OPENALEX_API_KEY = os.getenv('OPENALEX_API_KEY', '')  # OpenAlex doesn't require key
    EUROPE_PMC_API_KEY = os.getenv('EUROPE_PMC_API_KEY', '')
    
    # Rate limiting
    EXTERNAL_API_RATE_LIMIT = 5  # requests per second
    CACHE_TIMEOUT = 300  # 5 minutes
    
    # Flask configuration
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'your-secret-key-here')
    
    @classmethod
    def has_any_api_keys(cls):
        """Check if any external API is configured"""
        return any([
            cls.SEMANTIC_SCHOLAR_API_KEY,
            cls.CROSSREF_API_KEY,
            cls.EUROPE_PMC_API_KEY
        ])