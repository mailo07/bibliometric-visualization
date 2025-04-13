import requests
import time
from datetime import datetime
from flask import current_app
from functools import wraps
from config import Config

class ExternalAPIService:
    _instance = None
    _last_request_time = 0
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ExternalAPIService, cls).__new__(cls)
            cls._rate_limited_apis = {}
        return cls._instance
    
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
    
    @rate_limited(Config.EXTERNAL_API_RATE_LIMIT)
    def search_semantic_scholar(self, query, page=1, per_page=10):
        try:
            offset = (page - 1) * per_page
            url = f"https://api.semanticscholar.org/graph/v1/paper/search?query={query}&offset={offset}&limit={per_page}"
            headers = {
                'x-api-key': Config.SEMANTIC_SCHOLAR_API_KEY
            }
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            results = []
            for paper in data.get('data', []):
                results.append({
                    'id': paper.get('paperId'),
                    'title': paper.get('title'),
                    'abstract': paper.get('abstract'),
                    'authors': [a['name'] for a in paper.get('authors', [])],
                    'year': paper.get('year'),
                    'citation_count': paper.get('citationCount', 0),
                    'source': 'semantic_scholar',
                    'doi': paper.get('externalIds', {}).get('DOI'),
                    'published': paper.get('publicationDate'),
                    'journal': paper.get('venue')
                })
            
            return results, data.get('total', 0)
        except Exception as e:
            current_app.logger.error(f"Semantic Scholar API error: {str(e)}")
            return [], 0
    
    @rate_limited(Config.EXTERNAL_API_RATE_LIMIT)
    def search_crossref(self, query, page=1, per_page=10):
        try:
            offset = (page - 1) * per_page
            url = f"https://api.crossref.org/works?query={query}&rows={per_page}&offset={offset}"
            headers = {
                'User-Agent': 'Biblioknow/1.0 (mailto:your@email.com)',
                'Crossref-Plus-API-Token': Config.CROSSREF_API_KEY
            }
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            results = []
            for item in data.get('message', {}).get('items', []):
                results.append({
                    'id': item.get('DOI'),
                    'title': ' '.join(item.get('title', ['Untitled'])),
                    'abstract': item.get('abstract', ''),
                    'authors': [f"{a.get('given', '')} {a.get('family', '')}".strip() 
                               for a in item.get('author', [])],
                    'year': item.get('published', {}).get('date-parts', [[None]])[0][0],
                    'citation_count': item.get('is-referenced-by-count', 0),
                    'source': 'crossref',
                    'doi': item.get('DOI'),
                    'published': item.get('created', {}).get('date-time'),
                    'journal': item.get('container-title', [''])[0]
                })
            
            return results, data.get('message', {}).get('total-results', 0)
        except Exception as e:
            current_app.logger.error(f"Crossref API error: {str(e)}")
            return [], 0
    
    @rate_limited(Config.EXTERNAL_API_RATE_LIMIT)
    def search_openalex(self, query, page=1, per_page=10):
        try:
            offset = (page - 1) * per_page
            url = f"https://api.openalex.org/works?search={query}&per-page={per_page}&page={page}"
            headers = {
                'User-Agent': 'Biblioknow/1.0 (mailto:your@email.com)'
            }
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            results = []
            for work in data.get('results', []):
                results.append({
                    'id': work.get('id').split('/')[-1] if work.get('id') else None,
                    'title': work.get('title'),
                    'abstract': work.get('abstract'),
                    'authors': [a.get('author', {}).get('display_name', '') 
                              for a in work.get('authorships', [])],
                    'year': work.get('publication_year'),
                    'citation_count': work.get('cited_by_count', 0),
                    'source': 'openalex',
                    'doi': work.get('doi'),
                    'published': work.get('publication_date'),
                    'journal': work.get('host_venue', {}).get('display_name')
                })
            
            return results, data.get('meta', {}).get('count', 0)
        except Exception as e:
            current_app.logger.error(f"OpenAlex API error: {str(e)}")
            return [], 0
    
    @rate_limited(Config.EXTERNAL_API_RATE_LIMIT)
    def search_europepmc(self, query, page=1, per_page=10):
        try:
            offset = (page - 1) * per_page
            url = f"https://www.ebi.ac.uk/europepmc/webservices/rest/search?query={query}&resultType=core&pageSize={per_page}&offset={offset}&format=json"
            headers = {
                'User-Agent': 'Biblioknow/1.0 (mailto:your@email.com)'
            }
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            results = []
            for result in data.get('resultList', {}).get('result', []):
                results.append({
                    'id': result.get('id'),
                    'title': result.get('title'),
                    'abstract': result.get('abstractText', ''),
                    'authors': result.get('authorString', '').split(', ') if result.get('authorString') else [],
                    'year': result.get('pubYear'),
                    'citation_count': result.get('citedByCount', 0),
                    'source': 'europepmc',
                    'doi': result.get('doi'),
                    'published': result.get('firstPublicationDate'),
                    'journal': result.get('journalTitle')
                })
            
            return results, data.get('hitCount', 0)
        except Exception as e:
            current_app.logger.error(f"Europe PMC API error: {str(e)}")
            return [], 0
    
    def get_paper_details(self, source, external_id):
        try:
            if source == 'semantic_scholar':
                return self._get_semantic_scholar_details(external_id)
            elif source == 'crossref':
                return self._get_crossref_details(external_id)
            elif source == 'openalex':
                return self._get_openalex_details(external_id)
            elif source == 'europepmc':
                return self._get_europepmc_details(external_id)
            else:
                return None
        except Exception as e:
            current_app.logger.error(f"Error getting paper details from {source}: {str(e)}")
            return None
    
    def _get_semantic_scholar_details(self, paper_id):
        url = f"https://api.semanticscholar.org/graph/v1/paper/{paper_id}?fields=title,abstract,authors,year,citationCount,references,publicationDate,venue,externalIds"
        headers = {'x-api-key': Config.SEMANTIC_SCHOLAR_API_KEY}
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        paper = response.json()
        
        return {
            'title': paper.get('title'),
            'abstract': paper.get('abstract'),
            'authors': [a['name'] for a in paper.get('authors', [])],
            'year': paper.get('year'),
            'citation_count': paper.get('citationCount', 0),
            'references': [ref['title'] for ref in paper.get('references', [])],
            'doi': paper.get('externalIds', {}).get('DOI'),
            'published': paper.get('publicationDate'),
            'journal': paper.get('venue')
        }
    
    def _get_crossref_details(self, doi):
        url = f"https://api.crossref.org/works/{doi}"
        headers = {
            'User-Agent': 'Biblioknow/1.0 (mailto:your@email.com)',
            'Crossref-Plus-API-Token': Config.CROSSREF_API_KEY
        }
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        item = response.json().get('message', {})
        
        return {
            'title': ' '.join(item.get('title', ['Untitled'])),
            'abstract': item.get('abstract', ''),
            'authors': [f"{a.get('given', '')} {a.get('family', '')}".strip() 
                       for a in item.get('author', [])],
            'year': item.get('published', {}).get('date-parts', [[None]])[0][0],
            'citation_count': item.get('is-referenced-by-count', 0),
            'references': [],
            'doi': doi,
            'published': item.get('created', {}).get('date-time'),
            'journal': item.get('container-title', [''])[0]
        }
    
    def _get_openalex_details(self, work_id):
        url = f"https://api.openalex.org/works/{work_id}"
        headers = {
            'User-Agent': 'Biblioknow/1.0 (mailto:your@email.com)'
        }
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        work = response.json()
        
        return {
            'title': work.get('title'),
            'abstract': work.get('abstract'),
            'authors': [a.get('author', {}).get('display_name', '') 
                      for a in work.get('authorships', [])],
            'year': work.get('publication_year'),
            'citation_count': work.get('cited_by_count', 0),
            'references': [ref.get('title') for ref in work.get('referenced_works', [])],
            'doi': work.get('doi'),
            'published': work.get('publication_date'),
            'journal': work.get('host_venue', {}).get('display_name')
        }
    
    def _get_europepmc_details(self, pmc_id):
        url = f"https://www.ebi.ac.uk/europepmc/webservices/rest/{pmc_id}/fullTextXML"
        headers = {
            'User-Agent': 'Biblioknow/1.0 (mailto:your@email.com)'
        }
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        # This is a simplified parser - you might want to use proper XML parsing
        content = response.text
        abstract_start = content.find('<abstract>') + len('<abstract>')
        abstract_end = content.find('</abstract>')
        abstract = content[abstract_start:abstract_end] if abstract_start > 0 and abstract_end > 0 else ''
        
        return {
            'abstract': abstract,
            'references': []
        }