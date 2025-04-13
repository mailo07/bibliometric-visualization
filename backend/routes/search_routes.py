# routes/search_routes.py
from flask import Blueprint, jsonify, request
from flask_caching import Cache
from services.database import DatabaseService
from services.external_apis import ExternalAPIService
from config import Config

search_bp = Blueprint('search', __name__)

# Cache reference will be set during app initialization
cache = None

# Initialize cache reference
def init_search_cache(app_cache):
    global cache
    cache = app_cache

@search_bp.route('/search', methods=['GET'])
def api_search():
    if cache:
        # Use decorator for caching if cache is available
        @cache.cached(timeout=300, query_string=True)
        def cached_search():
            return perform_search()
        return cached_search()
    else:
        # Fallback if cache is not initialized
        return perform_search()

def perform_search():
    query = request.args.get('query')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    include_external = request.args.get('include_external', 'false').lower() == 'true'
    
    if not query:
        return jsonify({"error": "No query provided"}), 400
    
    # Get filters from query params
    filters = {
        'year_from': request.args.get('year_from'),
        'year_to': request.args.get('year_to'),
        'source': request.args.get('source'),
        'min_citations': request.args.get('min_citations')
    }
    
    # Get database results
    db_service = DatabaseService()
    db_results = db_service.search_across_sources(
        query=query,
        page=page,
        per_page=per_page,
        filters={k: v for k, v in filters.items() if v is not None}
    )
    
    # Get external results if requested and APIs are configured
    external_results = []
    external_apis_used = False
    
    if include_external and Config.has_any_api_keys():
        external_api = ExternalAPIService()
        external_apis_used = True
        
        if Config.SEMANTIC_SCHOLAR_API_KEY:
            ss_results, _ = external_api.search_semantic_scholar(query, page, per_page)
            external_results.extend(ss_results)
        
        if Config.CROSSREF_API_KEY:
            cr_results, _ = external_api.search_crossref(query, page, per_page)
            external_results.extend(cr_results)
        
        if Config.OPENALEX_API_KEY:
            oa_results, _ = external_api.search_openalex(query, page, per_page)
            external_results.extend(oa_results)
        
        if Config.EUROPE_PMC_API_KEY:
            epmc_results, _ = external_api.search_europepmc(query, page, per_page)
            external_results.extend(epmc_results)
    
    return jsonify({
        "results": db_results['results'] + external_results,
        "total": db_results['total'] + len(external_results),
        "page": page,
        "per_page": per_page,
        "external_apis_used": external_apis_used
    })

@search_bp.route('/paper_details', methods=['GET'])
def get_paper_details():
    if cache:
        # Use decorator for caching if cache is available
        @cache.cached(timeout=300, query_string=True)
        def cached_paper_details():
            return fetch_paper_details()
        return cached_paper_details()
    else:
        # Fallback if cache is not initialized
        return fetch_paper_details()

def fetch_paper_details():
    source = request.args.get('source')
    external_id = request.args.get('id')
    
    if not source or not external_id:
        return jsonify({"error": "Missing source or id parameter"}), 400
    
    # Try to get from external API
    external_api = ExternalAPIService()
    details = external_api.get_paper_details(source, external_id)
    
    if details:
        return jsonify(details)
    else:
        return jsonify({"error": "Could not retrieve paper details"}), 404