# cache.py
from flask_caching import Cache
from config import Config
import logging
from extensions import cache

class CacheService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(CacheService, cls).__new__(cls)
        return cls._instance

    def init_app(self, app):
        """Initialize and configure Flask-Caching"""
        try:
            cache_config = {
                'CACHE_TYPE': 'SimpleCache',  # For production use 'Redis' or 'Memcached'
                'CACHE_DEFAULT_TIMEOUT': Config.CACHE_TIMEOUT,
                'CACHE_THRESHOLD': 1000,
                'CACHE_KEY_PREFIX': 'biblio_'
            }
            cache.init_app(app, config=cache_config)
            
            # Test cache connection
            with app.app_context():
                cache.set('health_check', 'ok', timeout=10)
                if cache.get('health_check') != 'ok':
                    raise RuntimeError("Cache connection test failed")
            
            logging.info("✅ Cache service initialized successfully")
            return cache
        except Exception as e:
            logging.error(f"❌ Cache initialization failed: {e}")
            # Fallback to null cache
            cache.init_app(app, config={'CACHE_TYPE': 'NullCache'})
            return cache

    def get(self, key):
        return cache.get(key)

    def set(self, key, value, timeout=None):
        return cache.set(key, value, timeout=timeout)

    def delete(self, key):
        return cache.delete(key)

    def clear(self):
        return cache.clear()

# Singleton instance
cache_service = CacheService()
