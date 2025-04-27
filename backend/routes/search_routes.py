from flask import Blueprint, jsonify, request
from flask_caching import Cache
from services.database import DatabaseService
from services.external_apis import ExternalAPIService
from config import Config
import logging
from functools import wraps
from datetime import datetime

search_bp = Blueprint('search', __name__)
cache = Cache()

def init_search_cache(app):
    """Initialize cache for search routes"""
    try:
        cache_config = {
            'CACHE_TYPE': 'SimpleCache',
            'CACHE_DEFAULT_TIMEOUT': Config.CACHE_TIMEOUT,
            'CACHE_THRESHOLD': 1000,
            'CACHE_KEY_PREFIX': 'search_'
        }
        cache.init_app(app, config=cache_config)
        logging.info("✅ Search cache initialized successfully")
    except Exception as e:
        logging.error(f"❌ Failed to initialize search cache: {e}")
        cache.init_app(app, config={'CACHE_TYPE': 'NullCache'})

def handle_errors(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            logging.error(f"Route error: {str(e)}", exc_info=True)
            return jsonify({
                "error": "Internal server error",
                "message": str(e),
                "results": [],
                "total": 0,
                "page": 1,
                "per_page": 10,
                "external_apis_used": False
            }), 500
    return wrapper

# search_routes.py (updated search function)
@search_bp.route('/search', methods=['GET'])
@handle_errors
def api_search():
    query = request.args.get('query', '').strip()
    logging.info(f"Search request received - Query: '{query}'")
    
    if not query:
        return jsonify({
            "error": "Query parameter is required",
            "results": [],
            "total": 0,
            "page": 1,
            "per_page": 10,
            "external_apis_used": False
        }), 400
    
    try:
        page = max(1, int(request.args.get('page', 1)))
        per_page = min(50, max(1, int(request.args.get('per_page', 10))))
    except ValueError:
        return jsonify({
            "error": "Invalid page or per_page parameter",
            "results": [],
            "total": 0
        }), 400
    
    cache_key = f"search:{query}:{page}:{per_page}"
    include_external = request.args.get('include_external', 'false').lower() == 'true'
    if include_external:
        cache_key += ":external"
    
    for param in ['year_from', 'year_to', 'source', 'min_citations']:
        if request.args.get(param):
            cache_key += f":{param}:{request.args.get(param)}"
    
    cached_result = cache.get(cache_key)
    if cached_result:
        logging.info(f"Returning cached results for {cache_key}")
        return jsonify(cached_result)
    
    try:
        db_service = DatabaseService()
        db_results = db_service.search_across_sources(
            query=query,
            page=page,
            per_page=per_page,
            filters=request.args.to_dict()
        )
        logging.info(f"Database results count: {len(db_results.get('results', []))}")
        
        external_results = []
        external_apis_used = False
        
        if include_external:
            external_apis_used = True
            external_api = ExternalAPIService()
            
            # Search all available APIs
            ol_results, _ = external_api.search_openlibrary(query, page, per_page)
            external_results.extend(ol_results)
            
            dblp_results, _ = external_api.search_dblp(query, page, per_page)
            external_results.extend(dblp_results)
            
            arxiv_results, _ = external_api.search_arxiv(query, page, per_page)
            external_results.extend(arxiv_results)
            
            zotero_results, _ = external_api.search_zotero(query, page, per_page)
            external_results.extend(zotero_results)
            
            logging.info(f"External API results count: {len(external_results)}")
        
        all_results = db_results.get('results', []) + external_results
        
        # Calculate metrics
        metrics = {
            'scholarlyWorks': len(all_results),
            'worksCited': 0,
            'frequentlyCited': 0,
            'citation_trends': [],
            'top_authors': [],
            'publication_distribution': []
        }
        
        if all_results:
            citation_years = {}
            author_stats = {}
            source_stats = {}
            
            for item in all_results:
                citations = int(item.get('citations', 0))
                metrics['worksCited'] += citations
                if citations > 10:
                    metrics['frequentlyCited'] += 1
                
                year = None
                if item.get('year'):
                    year = str(item['year'])[:4]
                elif item.get('published'):
                    year = str(item['published'])[:4]
                
                if year and len(year) == 4:
                    citation_years[year] = citation_years.get(year, 0) + citations
                
                authors = []
                if item.get('authors'):
                    if isinstance(item['authors'], str):
                        authors = [a.strip() for a in item['authors'].split(',')]
                    elif isinstance(item['authors'], list):
                        authors = [a if isinstance(a, str) else a.get('name', str(a)) for a in item['authors']]
                elif item.get('author'):
                    authors = [item['author']]
                
                for author in authors:
                    if author and author != 'Unknown':
                        author_stats[author] = author_stats.get(author, 0) + citations
                
                source = item.get('journal') or item.get('source') or 'Unknown'
                source_stats[source] = source_stats.get(source, 0) + 1
            
            metrics['citation_trends'] = [{'year': k, 'citations': v} for k, v in sorted(citation_years.items())]
            metrics['top_authors'] = [{'name': k, 'citations': v} for k, v in 
                                    sorted(author_stats.items(), key=lambda x: x[1], reverse=True)[:5]]
            metrics['publication_distribution'] = [{'name': k, 'count': v} for k, v in 
                                                 sorted(source_stats.items(), key=lambda x: x[1], reverse=True)[:5]]
        
        response = {
            "results": all_results,
            "total": db_results.get('total', 0) + len(external_results),
            "page": page,
            "per_page": per_page,
            "external_apis_used": external_apis_used,
            "metrics": metrics
        }
        
        cache.set(cache_key, response, timeout=Config.CACHE_TIMEOUT)
        return jsonify(response)
        
    except Exception as e:
        logging.error(f"Search processing failed: {str(e)}")
        return jsonify({
            "error": "Search processing failed",
            "message": str(e),
            "results": [],
            "total": 0,
            "page": page,
            "per_page": per_page,
            "external_apis_used": False
        }), 500