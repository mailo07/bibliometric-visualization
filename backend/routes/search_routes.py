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
        
        if include_external and Config.has_any_api_keys():
            external_apis_used = True
            external_api = ExternalAPIService()
            
            if Config.CROSSREF_API_KEY or True:  # Crossref works without key
                cr_results, _ = external_api.search_crossref(query, page, per_page)
                external_results.extend(cr_results)
            
            if Config.SEMANTIC_SCHOLAR_API_KEY:
                ss_results, _ = external_api.search_semantic_scholar(query, page, per_page)
                external_results.extend(ss_results)
            
            if Config.OPENALEX_API_KEY:
                oa_results, _ = external_api.search_openalex(query, page, per_page)
                external_results.extend(oa_results)
            
            logging.info(f"External API results count: {len(external_results)}")
        
        all_results = db_results.get('results', []) + external_results
        
        # Calculate metrics with proper citation handling
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
                # Get citation count from various possible fields
                citations = 0
                if 'citation_count' in item:
                    citations = int(item['citation_count'] or 0)
                elif 'cited_by' in item:
                    citations = int(item['cited_by'] or 0)
                elif 'citations' in item:
                    citations = int(item['citations'] or 0)
                
                metrics['worksCited'] += citations
                if citations > 10:
                    metrics['frequentlyCited'] += 1
                
                # Year extraction
                year = None
                if item.get('year'):
                    year = str(item['year'])[:4]
                elif item.get('published'):
                    year = str(item['published'])[:4]
                
                if year and len(year) == 4:
                    citation_years[year] = citation_years.get(year, 0) + citations
                
                # Author processing
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
                
                # Source processing
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

@search_bp.route('/paper_details', methods=['GET'])
@handle_errors
def get_paper_details():
    source = request.args.get('source')
    external_id = request.args.get('id')
    
    if not source or not external_id:
        return jsonify({"error": "Missing source or id parameter"}), 400
    
    cache_key = f"paper_details:{source}:{external_id}"
    cached_result = cache.get(cache_key)
    if cached_result:
        return jsonify(cached_result)
    
    try:
        external_api = ExternalAPIService()
        details = external_api.get_paper_details(source, external_id)
        
        if not details:
            return jsonify({"error": "Paper details not found"}), 404
        
        cache.set(cache_key, details, timeout=Config.CACHE_TIMEOUT)
        return jsonify(details)
        
    except Exception as e:
        logging.error(f"Error fetching paper details: {str(e)}")
        return jsonify({
            "error": "Failed to fetch paper details",
            "message": str(e)
        }), 500

@search_bp.route('/clear_cache', methods=['POST'])
def clear_cache():
    try:
        cache.clear()
        return jsonify({"status": "success", "message": "Cache cleared"})
    except Exception as e:
        logging.error(f"Error clearing cache: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@search_bp.route('/health', methods=['GET'])
def health_check():
    try:
        db_service = DatabaseService()
        db_test = db_service.execute_query("SELECT 1")
        
        api = ExternalAPIService()
        
        return jsonify({
            "status": "healthy",
            "database": "connected" if db_test else "disconnected",
            "external_apis": {
                "crossref": bool(Config.CROSSREF_API_KEY),
                "semantic_scholar": bool(Config.SEMANTIC_SCHOLAR_API_KEY),
                "openalex": True
            }
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500