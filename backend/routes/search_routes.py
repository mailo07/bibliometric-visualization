# search_routes.py (updated)
from flask import Blueprint, jsonify, request
from flask_caching import Cache
from services.search_service import SearchService
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

# search_routes.py (updated api_search route)
# search_routes.py (updated api_search route)
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
    
    # Check cache first
    cached_result = cache.get(cache_key)
    if cached_result:
        logging.info(f"Returning cached results for {cache_key}")
        return jsonify(cached_result)
    
    try:
        search_service = SearchService()
        search_results = search_service.search_publications(
            query=query,
            page=page,
            per_page=per_page,
            filters=request.args.to_dict()
        )
        
        # Log the number of results for debugging
        logging.info(f"Search found {len(search_results.get('results', []))} total results")
        
        # Ensure all results have the expected fields
        standardized_results = []
        for result in search_results.get('results', []):
            # Standardize field names to match what frontend expects
            standard_result = {
                'id': result.get('id', ''),
                'title': result.get('title', 'Untitled'),
                'author': result.get('author', result.get('authors', 'Unknown')),
                'year': result.get('year', result.get('published', '')),
                'journal': result.get('journal', result.get('source', 'Unknown')),
                'citations': result.get('citations', 0),
                'doi': result.get('doi', ''),
                'source': result.get('source', 'unknown')
            }
            standardized_results.append(standard_result)
        
        # Safely calculate metrics even if some results are missing
        metrics = calculate_metrics(standardized_results)
        
        response = {
            "results": standardized_results,
            "total": search_results.get('total', 0),
            "page": page,
            "per_page": per_page,
            "external_apis_used": search_results.get('external_apis_used', False),
            "metrics": metrics
        }
        
        cache.set(cache_key, response, timeout=Config.CACHE_TIMEOUT)
        return jsonify(response)
        
    except Exception as e:
        logging.error(f"Search processing failed but returning empty results: {str(e)}")
        return jsonify({
            "results": [],
            "total": 0,
            "page": page,
            "per_page": per_page,
            "external_apis_used": False,
            "metrics": {
                'citation_trends': [],
                'top_authors': [{'name': "Error loading data", 'citations': 0}],
                'publication_distribution': [{'name': "Error loading data", 'count': 0}],
                'scholarlyWorks': 0,
                'worksCited': 0,
                'frequentlyCited': 0
            }
        }), 200  # Still return 200 OK but with empty results

def calculate_metrics(results):
    """Calculate metrics from search results"""
    metrics = {
        'scholarlyWorks': len(results),
        'worksCited': 0,
        'frequentlyCited': 0,
        'citation_trends': [],
        'top_authors': [],
        'publication_distribution': []
    }
    
    if not results:
        # Return placeholder data
        current_year = datetime.now().year
        metrics['citation_trends'] = [
            {'year': str(y), 'citations': 0} for y in range(current_year-4, current_year+1)
        ]
        metrics['top_authors'] = [{'name': "No author data", 'citations': 0}]
        metrics['publication_distribution'] = [{'name': "No publication data", 'count': 0}]
        return metrics
    
    citation_years = {}
    author_stats = {}
    source_stats = {}
    
    for item in results:
        citations = int(item.get('citations', 0) or 0)
        metrics['worksCited'] += citations
        if citations > 10:
            metrics['frequentlyCited'] += 1
        
        # Extract year data
        year = None
        if item.get('year'):
            year = str(item['year'])[:4]
        elif item.get('published'):
            year = str(item['published'])[:4]
        
        if year and len(year) == 4 and year.isdigit():
            citation_years[year] = citation_years.get(year, 0) + citations
        
        # Extract author data
        authors = []
        if item.get('authors'):
            if isinstance(item['authors'], str):
                authors = [a.strip() for a in item['authors'].split(',')]
            elif isinstance(item['authors'], list):
                authors = [a if isinstance(a, str) else a.get('name', str(a)) for a in item['authors']]
        elif item.get('author'):
            if isinstance(item['author'], str):
                authors = [item['author']]
            elif isinstance(item['author'], list):
                authors = item['author']
        
        for author in authors:
            if author and author != 'Unknown':
                author_stats[author] = author_stats.get(author, 0) + citations
        
        # Extract source/publication data
        source = item.get('journal') or item.get('publisher') or item.get('source') or 'Unknown'
        source_stats[source] = source_stats.get(source, 0) + 1
    
    # Format the metrics data
    metrics['citation_trends'] = [
        {'year': k, 'citations': v} for k, v in sorted(citation_years.items())
    ]
    
    metrics['top_authors'] = [
        {'name': k, 'citations': v} for k, v in 
        sorted(author_stats.items(), key=lambda x: x[1], reverse=True)[:5]
    ]
    
    metrics['publication_distribution'] = [
        {'name': k, 'count': v} for k, v in 
        sorted(source_stats.items(), key=lambda x: x[1], reverse=True)[:5]
    ]
    
    # Add placeholder data if any category is empty
    if not metrics['citation_trends']:
        current_year = datetime.now().year
        metrics['citation_trends'] = [
            {'year': str(y), 'citations': 0} for y in range(current_year-4, current_year+1)
        ]
    
    if not metrics['top_authors']:
        metrics['top_authors'] = [{'name': "No author data", 'citations': 0}]
    
    if not metrics['publication_distribution']:
        metrics['publication_distribution'] = [{'name': "No publication data", 'count': 0}]
    
    return metrics

@search_bp.route('/paper_details', methods=['GET'])
@handle_errors
def get_paper_details():
    paper_id = request.args.get('id')
    source = request.args.get('source')
    
    if not paper_id or not source:
        return jsonify({
            "error": "Paper ID and source are required"
        }), 400
    
    cache_key = f"paper:{paper_id}:{source}"
    cached_result = cache.get(cache_key)
    if cached_result:
        return jsonify(cached_result)
    
    search_service = SearchService()
    paper_details = search_service.get_publication_details(paper_id, source)
    
    if not paper_details:
        return jsonify({
            "error": "Paper not found"
        }), 404
    
    # Cache the result
    cache.set(cache_key, paper_details, timeout=Config.CACHE_TIMEOUT)
    return jsonify(paper_details)