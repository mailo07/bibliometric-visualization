# external_apis.py
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
            'openlibrary': True,
            'dblp': True,
            'arxiv': True,
            'zotero': True
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
    def search_openlibrary(self, query, page=1, per_page=10):
        try:
            url = "https://openlibrary.org/search.json"
            params = {
                'q': query,
                'page': page,
                'limit': per_page
            }
            
            response = self._make_api_request(url, params=params)
            if not response:
                return [], 0
                
            data = response.json()
            
            results = []
            for doc in data.get('docs', []):
                results.append({
                    'id': doc.get('key', '').split('/')[-1],
                    'title': doc.get('title'),
                    'authors': doc.get('author_name', ['Unknown']),
                    'year': doc.get('first_publish_year'),
                    'source': 'openlibrary',
                    'url': f"https://openlibrary.org{doc.get('key', '')}"
                })
            
            return results, data.get('num_found', 0)
            
        except Exception as e:
            logging.error(f"OpenLibrary search error: {str(e)}")
            return [], 0

    @rate_limited(Config.EXTERNAL_API_RATE_LIMIT)
    def search_dblp(self, query, page=1, per_page=10):
        try:
            url = "https://dblp.org/search/publ/api"
            params = {
                'q': query,
                'h': per_page,
                'f': (page - 1) * per_page,
                'format': 'json'
            }
            
            response = self._make_api_request(url, params=params)
            if not response:
                return [], 0
                
            data = response.json()
            
            results = []
            for hit in data.get('result', {}).get('hits', {}).get('hit', []):
                info = hit.get('info', {})
                results.append({
                    'id': info.get('key', '').split('/')[-1],
                    'title': info.get('title'),
                    'authors': [a.get('text', '') for a in info.get('authors', {}).get('author', [])],
                    'year': info.get('year'),
                    'source': 'dblp',
                    'url': info.get('ee')
                })
            
            return results, data.get('result', {}).get('hits', {}).get('total', 0)
            
        except Exception as e:
            logging.error(f"DBLP search error: {str(e)}")
            return [], 0

    @rate_limited(Config.EXTERNAL_API_RATE_LIMIT)
    def search_arxiv(self, query, page=1, per_page=10):
        try:
            url = "http://export.arxiv.org/api/query"
            params = {
                'search_query': f'all:{query}',
                'start': (page - 1) * per_page,
                'max_results': per_page
            }
            
            response = self._make_api_request(url, params=params)
            if not response:
                return [], 0
                
            # Parse XML response
            import xml.etree.ElementTree as ET
            root = ET.fromstring(response.text)
            
            results = []
            for entry in root.findall('{http://www.w3.org/2005/Atom}entry'):
                results.append({
                    'id': entry.find('{http://www.w3.org/2005/Atom}id').text.split('/')[-1],
                    'title': entry.find('{http://www.w3.org/2005/Atom}title').text,
                    'authors': [a.find('{http://www.w3.org/2005/Atom}name').text 
                              for a in entry.findall('{http://www.w3.org/2005/Atom}author')],
                    'published': entry.find('{http://www.w3.org/2005/Atom}published').text,
                    'source': 'arxiv',
                    'url': entry.find('{http://www.w3.org/2005/Atom}id').text
                })
            
            total = int(root.find('{http://www.w3.org/2005/Atom}totalResults').text)
            return results, total
            
        except Exception as e:
            logging.error(f"arXiv search error: {str(e)}")
            return [], 0

    @rate_limited(Config.EXTERNAL_API_RATE_LIMIT)
    def search_zotero(self, query, page=1, per_page=10):
        try:
            url = "https://api.zotero.org/items"
            params = {
                'q': query,
                'start': (page - 1) * per_page,
                'limit': per_page,
                'format': 'json'
            }
            
            headers = {
                'Zotero-API-Version': '3',
                'User-Agent': f'{Config.APP_NAME}/{Config.APP_VERSION}'
            }
            
            response = self._make_api_request(url, params=params, headers=headers)
            if not response:
                return [], 0
                
            data = response.json()
            
            results = []
            for item in data:
                results.append({
                    'id': item.get('key'),
                    'title': item.get('data', {}).get('title'),
                    'authors': [c.get('name') for c in item.get('data', {}).get('creators', []) 
                              if c.get('creatorType') == 'author'],
                    'year': item.get('data', {}).get('date'),
                    'source': 'zotero',
                    'url': item.get('data', {}).get('url')
                })
            
            return results, len(data)
            
        except Exception as e:
            logging.error(f"Zotero search error: {str(e)}")
            return [], 0

    def get_paper_details(self, source, external_id):
        """Unified paper details fetcher"""
        try:
            if source == 'openlibrary':
                return self._get_openlibrary_details(external_id)
            elif source == 'dblp':
                return self._get_dblp_details(external_id)
            elif source == 'arxiv':
                return self._get_arxiv_details(external_id)
            elif source == 'zotero':
                return self._get_zotero_details(external_id)
            else:
                return None
        except Exception as e:
            logging.error(f"Error getting paper details from {source}: {str(e)}")
            return None

    def _get_openlibrary_details(self, work_id):
        url = f"https://openlibrary.org/works/{work_id}.json"
        
        response = self._make_api_request(url)
        if not response:
            return None
            
        work = response.json()
        
        return {
            'title': work.get('title'),
            'authors': [a.get('author', {}).get('key', '').split('/')[-1] 
                      for a in work.get('authors', [])],
            'year': work.get('first_publish_date'),
            'description': work.get('description'),
            'subjects': work.get('subjects', []),
            'url': f"https://openlibrary.org/works/{work_id}"
        }

    def _get_dblp_details(self, pub_id):
        url = f"https://dblp.org/rec/{pub_id}.json"
        
        response = self._make_api_request(url)
        if not response:
            return None
            
        pub = response.json()
        
        return {
            'title': pub.get('title'),
            'authors': [a.get('text', '') for a in pub.get('authors', {}).get('author', [])],
            'year': pub.get('year'),
            'venue': pub.get('venue'),
            'url': pub.get('ee')
        }

    def _get_arxiv_details(self, paper_id):
        url = f"http://export.arxiv.org/api/query?id_list={paper_id}"
        
        response = self._make_api_request(url)
        if not response:
            return None
            
        import xml.etree.ElementTree as ET
        root = ET.fromstring(response.text)
        entry = root.find('{http://www.w3.org/2005/Atom}entry')
        
        if not entry:
            return None
            
        return {
            'title': entry.find('{http://www.w3.org/2005/Atom}title').text,
            'authors': [a.find('{http://www.w3.org/2005/Atom}name').text 
                      for a in entry.findall('{http://www.w3.org/2005/Atom}author')],
            'published': entry.find('{http://www.w3.org/2005/Atom}published').text,
            'summary': entry.find('{http://www.w3.org/2005/Atom}summary').text,
            'url': entry.find('{http://www.w3.org/2005/Atom}id').text
        }

    def _get_zotero_details(self, item_id):
        url = f"https://api.zotero.org/items/{item_id}"
        
        headers = {
            'Zotero-API-Version': '3',
            'User-Agent': f'{Config.APP_NAME}/{Config.APP_VERSION}'
        }
        
        response = self._make_api_request(url, headers=headers)
        if not response:
            return None
            
        item = response.json()
        
        return {
            'title': item.get('data', {}).get('title'),
            'authors': [c.get('name') for c in item.get('data', {}).get('creators', []) 
                      if c.get('creatorType') == 'author'],
            'date': item.get('data', {}).get('date'),
            'abstract': item.get('data', {}).get('abstractNote'),
            'url': item.get('data', {}).get('url')
        }