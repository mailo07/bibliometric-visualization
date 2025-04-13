from flask_caching import Cache
from config import Config

def init_cache(app):
    cache = Cache(config={
        'CACHE_TYPE': 'SimpleCache',
        'CACHE_DEFAULT_TIMEOUT': Config.CACHE_TIMEOUT,
        'CACHE_THRESHOLD': 1000
    })
    cache.init_app(app)
    return cache