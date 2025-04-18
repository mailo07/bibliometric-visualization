import requests
import time
from datetime import datetime
from flask import current_app
from functools import wraps
from config import Config
import logging
from urllib.parse import quote

class ExternalAPIService:
    _instance = None
    API_TIMEOUT = 15  # seconds
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ExternalAPIService, cls).__new__(cls)
            cls._instance._verify_api_config()
        return cls._instance
    
    def _verify_api_config(self):
        """Verify all API configurations are correct"""
        self.available_apis = {
            'crossref': bool(Config.CROSSREF_API_KEY),
            'semantic_scholar': bool(Config.SEMANTIC_SCHOLAR_API_KEY),
            'openalex': True,  # Doesn't require key
            'pubmed': hasattr(Config, 'PUBMED_API_KEY') and bool(Config.PUBMED_API_KEY)
        }
        logging.info(f"Available APIs: {self.available_apis}")

    @staticmethod
    def rate_limited(max_per_second):
        min_interval = 1.0 / max_per_second
        
        def decorate(func):
            last_time_called = [0.0]
            
            @wraps(func)
            def rate_limited_function(*args, **kwargs):
                elapsed = time.time() - last_time_called[0]
                wait_time = min_interval - elapsed
                if wait_time > 0:
                    time.sleep(wait_time)
                last_time_called[0] = time.time()
                return func(*args, **kwargs)
            return rate_limited_function
        return decorate
    
    def _make_api_request(self, url, params=None, headers=None, method='GET'):
        """Centralized API request handler with retries"""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = requests.request(
                    method,
                    url,
                    params=params,
                    headers=headers,
                    timeout=self.API_TIMEOUT
                )
                response.raise_for_status()
                logging.info(f"API request successful to {url}")
                return response
            except requests.exceptions.RequestException as e:
                logging.warning(f"API request attempt {attempt + 1} failed: {str(e)}")
                if attempt == max_retries - 1:
                    raise
                time.sleep(1 + attempt)  # Exponential backoff
        return None

    @rate_limited(Config.EXTERNAL_API_RATE_LIMIT)
    def search_crossref(self, query, page=1, per_page=10):
        if not self.available_apis['crossref']:
            logging.info("Crossref API not enabled")
            return [], 0
            
        try:
            url = "https://api.crossref.org/works"
            params = {
                'query': query,
                'rows': per_page,
                'offset': (page - 1) * per_page,
                'mailto': Config.ADMIN_EMAIL,
                'filter': 'has-full-text:true',
                'select': 'DOI,title,author,citation-count,created,container-title'
            }
            
            headers = {
                'User-Agent': f'{Config.APP_NAME}/{Config.APP_VERSION} (mailto:{Config.ADMIN_EMAIL})'
            }
            if Config.CROSSREF_API_KEY:
                headers['Crossref-Plus-API-Token'] = Config.CROSSREF_API_KEY
                logging.debug("Using Crossref API with authentication")
            else:
                logging.warning("Using Crossref API without authentication (rate limited)")
            
            response = self._make_api_request(url, params=params, headers=headers)
            if not response:
                return [], 0
                
            data = response.json()
            
            results = []
            for item in data.get('message', {}).get('items', []):
                authors = []
                for author in item.get('author', []):
                    given = author.get('given', '')
                    family = author.get('family', '')
                    authors.append(f"{given} {family}".strip())
                
                results.append({
                    'id': item.get('DOI'),
                    'title': ' '.join(item.get('title', ['Untitled'])),
                    'authors': authors,
                    'year': item.get('created', {}).get('date-parts', [[None]])[0][0],
                    'citation_count': item.get('citation-count', 0),
                    'source': 'crossref',
                    'doi': item.get('DOI'),
                    'published': item.get('created', {}).get('date-time'),
                    'journal': item.get('container-title', [''])[0],
                    'url': f"https://doi.org/{item.get('DOI')}" if item.get('DOI') else None
                })
            
            return results, data.get('message', {}).get('total-results', 0)
            
        except Exception as e:
            logging.error(f"Crossref search error: {str(e)}")
            return [], 0

    @rate_limited(Config.EXTERNAL_API_RATE_LIMIT)
    def search_semantic_scholar(self, query, page=1, per_page=10):
        if not self.available_apis['semantic_scholar']:
            logging.info("Semantic Scholar API not enabled")
            return [], 0
            
        try:
            url = "https://api.semanticscholar.org/graph/v1/paper/search"
            params = {
                'query': query,
                'offset': (page - 1) * per_page,
                'limit': per_page,
                'fields': 'title,authors,year,citationCount,externalIds,url'
            }
            
            headers = {}
            if Config.SEMANTIC_SCHOLAR_API_KEY:
                headers['x-api-key'] = Config.SEMANTIC_SCHOLAR_API_KEY
                logging.debug("Using Semantic Scholar API with authentication")
            else:
                logging.warning("Using Semantic Scholar API without authentication (strict rate limits)")
            
            response = self._make_api_request(url, params=params, headers=headers)
            if not response:
                return [], 0
                
            data = response.json()
            
            results = []
            for paper in data.get('data', []):
                results.append({
                    'id': paper.get('paperId'),
                    'title': paper.get('title'),
                    'authors': [a['name'] for a in paper.get('authors', [])],
                    'year': paper.get('year'),
                    'citation_count': paper.get('citationCount', 0),
                    'source': 'semantic_scholar',
                    'doi': paper.get('externalIds', {}).get('DOI'),
                    'url': paper.get('url')
                })
            
            return results, data.get('total', 0)
            
        except Exception as e:
            logging.error(f"Semantic Scholar search error: {str(e)}")
            return [], 0

    @rate_limited(Config.EXTERNAL_API_RATE_LIMIT)
    def search_openalex(self, query, page=1, per_page=10):
        try:
            url = "https://api.openalex.org/works"
            params = {
                'search': query,
                'per-page': per_page,
                'page': page,
                'mailto': Config.ADMIN_EMAIL
            }
            
            logging.debug("Using OpenAlex API")
            response = self._make_api_request(url, params=params)
            if not response:
                return [], 0
                
            data = response.json()
            
            results = []
            for work in data.get('results', []):
                results.append({
                    'id': work.get('id', '').split('/')[-1],
                    'title': work.get('title'),
                    'authors': [a.get('author', {}).get('display_name', '') 
                              for a in work.get('authorships', [])],
                    'year': work.get('publication_year'),
                    'citation_count': work.get('cited_by_count', 0),
                    'source': 'openalex',
                    'doi': work.get('doi'),
                    'published': work.get('publication_date'),
                    'journal': work.get('host_venue', {}).get('display_name'),
                    'url': work.get('doi_url') or work.get('id')
                })
            
            return results, data.get('meta', {}).get('count', 0)
            
        except Exception as e:
            logging.error(f"OpenAlex search error: {str(e)}")
            return [], 0

    def get_paper_details(self, source, external_id):
        """Unified paper details fetcher"""
        try:
            if source == 'crossref':
                return self._get_crossref_details(external_id)
            elif source == 'semantic_scholar':
                return self._get_semantic_scholar_details(external_id)
            elif source == 'openalex':
                return self._get_openalex_details(external_id)
            else:
                return None
        except Exception as e:
            logging.error(f"Error getting paper details from {source}: {str(e)}")
            return None

    def _get_crossref_details(self, doi):
        url = f"https://api.crossref.org/works/{quote(doi)}"
        headers = {
            'User-Agent': f'{Config.APP_NAME}/{Config.APP_VERSION} (mailto:{Config.ADMIN_EMAIL})'
        }
        
        response = self._make_api_request(url, headers=headers)
        if not response:
            return None
            
        item = response.json().get('message', {})
        
        return {
            'title': ' '.join(item.get('title', ['Untitled'])),
            'authors': [f"{a.get('given', '')} {a.get('family', '')}".strip() 
                       for a in item.get('author', [])],
            'year': item.get('published', {}).get('date-parts', [[None]])[0][0],
            'citation_count': item.get('is-referenced-by-count', 0),
            'references': [],
            'doi': doi,
            'published': item.get('created', {}).get('date-time'),
            'journal': item.get('container-title', [''])[0],
            'url': f"https://doi.org/{doi}"
        }

    def _get_semantic_scholar_details(self, paper_id):
        url = f"https://api.semanticscholar.org/graph/v1/paper/{paper_id}"
        params = {
            'fields': 'title,authors,year,citationCount,references,externalIds,url'
        }
        
        response = self._make_api_request(url, params=params)
        if not response:
            return None
            
        paper = response.json()
        
        return {
            'title': paper.get('title'),
            'authors': [a['name'] for a in paper.get('authors', [])],
            'year': paper.get('year'),
            'citation_count': paper.get('citationCount', 0),
            'references': [ref['title'] for ref in paper.get('references', [])],
            'doi': paper.get('externalIds', {}).get('DOI'),
            'url': paper.get('url')
        }

    def _get_openalex_details(self, work_id):
        url = f"https://api.openalex.org/works/{work_id}"
        
        response = self._make_api_request(url)
        if not response:
            return None
            
        work = response.json()
        
        return {
            'title': work.get('title'),
            'authors': [a.get('author', {}).get('display_name', '') 
                      for a in work.get('authorships', [])],
            'year': work.get('publication_year'),
            'citation_count': work.get('cited_by_count', 0),
            'references': [ref.get('title') for ref in work.get('referenced_works', [])],
            'doi': work.get('doi'),
            'published': work.get('publication_date'),
            'journal': work.get('host_venue', {}).get('display_name'),
            'url': work.get('doi_url') or work.get('id')
        }