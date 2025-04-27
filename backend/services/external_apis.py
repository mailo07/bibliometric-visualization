# services/external_apis.py
import requests
import logging
import json
import xml.etree.ElementTree as ET
from datetime import datetime
from config import Config
import time

class ExternalAPIService:
    """Service for interacting with external bibliographic APIs"""
    
    def __init__(self):
        self.base_urls = {
            'openlibrary': 'https://openlibrary.org/search.json',
            'dblp': 'https://dblp.org/search/publ/api',
            'arxiv': 'http://export.arxiv.org/api/query',
            'zotero': 'https://api.zotero.org/groups/2412229/items'
        }
        
        self.api_keys = {
            'zotero': Config.ZOTERO_API_KEY
        }
        
        # Rate limiting
        self.last_request_time = {
            'openlibrary': 0,
            'dblp': 0,
            'arxiv': 0,
            'zotero': 0
        }
        
        # Minimum time between requests in seconds
        self.request_interval = {
            'openlibrary': 1,
            'dblp': 2,
            'arxiv': 3,
            'zotero': 1
        }
    
    def _rate_limit(self, api):
        """Enforce rate limiting for external APIs"""
        current_time = time.time()
        elapsed = current_time - self.last_request_time.get(api, 0)
        
        if elapsed < self.request_interval.get(api, 1):
            time.sleep(self.request_interval.get(api, 1) - elapsed)
        
        self.last_request_time[api] = time.time()
    
    def search_external(self, source, query, page=1, per_page=10):
        """Unified method to search any external API"""
        if source == 'openlibrary':
            return self.search_openlibrary(query, page, per_page)
        elif source == 'dblp':
            return self.search_dblp(query, page, per_page)
        elif source == 'arxiv':
            return self.search_arxiv(query, page, per_page)
        elif source == 'zotero':
            return self.search_zotero(query, page, per_page)
        else:
            logging.error(f"Unknown external API source: {source}")
            return [], 0
    
    def search_openlibrary(self, query, page=1, per_page=10):
        """Search Open Library API"""
        self._rate_limit('openlibrary')
        try:
            params = {
                'q': query,
                'page': page,
                'limit': per_page,
                'fields': 'key,title,author_name,publish_date,publisher'
            }
            
            response = requests.get(self.base_urls['openlibrary'], params=params)
            
            if response.status_code != 200:
                logging.error(f"OpenLibrary API error: {response.status_code}")
                return [], 0
            
            data = response.json()
            
            results = []
            for doc in data.get('docs', []):
                # Format the result to match our unified format
                results.append({
                    'id': doc.get('key', '').replace('/works/', ''),
                    'title': doc.get('title', 'Untitled'),
                    'authors': doc.get('author_name', []),
                    'year': doc.get('publish_date', [''])[0][:4] if doc.get('publish_date') else None,
                    'publisher': ', '.join(doc.get('publisher', [])) if doc.get('publisher') else 'Unknown',
                    'citations': 0,  # Open Library doesn't provide citation data
                    'source': 'external_openlibrary'
                })
            
            return results, data.get('numFound', 0)
        except Exception as e:
            logging.error(f"OpenLibrary search error: {str(e)}")
            return [], 0
    
    def search_dblp(self, query, page=1, per_page=10):
        """Search DBLP API"""
        self._rate_limit('dblp')
        try:
            offset = (page - 1) * per_page
            
            params = {
                'q': query,
                'format': 'json',
                'h': per_page,
                'f': offset
            }
            
            response = requests.get(self.base_urls['dblp'], params=params)
            
            if response.status_code != 200:
                logging.error(f"DBLP API error: {response.status_code}")
                return [], 0
            
            data = response.json()
            hits = data.get('result', {}).get('hits', {})
            
            results = []
            for hit in hits.get('hit', []):
                info = hit.get('info', {})
                authors = []
                for author in info.get('authors', {}).get('author', []):
                    if isinstance(author, dict):
                        authors.append(author.get('text', ''))
                    else:
                        authors.append(author)
                
                results.append({
                    'id': hit.get('@id', ''),
                    'title': info.get('title', 'Untitled'),
                    'authors': authors,
                    'year': info.get('year', ''),
                    'journal': info.get('venue', ''),
                    'citations': 0,  # DBLP doesn't provide citation data
                    'doi': info.get('doi', ''),
                    'source': 'external_dblp'
                })
            
            return results, int(hits.get('@total', 0))
        except Exception as e:
            logging.error(f"DBLP search error: {str(e)}")
            return [], 0
    
    def search_arxiv(self, query, page=1, per_page=10):
        """Search arXiv API"""
        self._rate_limit('arxiv')
        try:
            # arXiv uses start, not page
            start = (page - 1) * per_page
            
            params = {
                'search_query': f'all:{query}',
                'start': start,
                'max_results': per_page,
                'sortBy': 'relevance',
                'sortOrder': 'descending'
            }
            
            response = requests.get(self.base_urls['arxiv'], params=params)
            
            if response.status_code != 200:
                logging.error(f"arXiv API error: {response.status_code}")
                return [], 0
            
            # Parse XML response
            root = ET.fromstring(response.content)
            
            # Define namespace for arXiv API
            ns = {'atom': 'http://www.w3.org/2005/Atom',
                  'arxiv': 'http://arxiv.org/schemas/atom'}
            
            # Get total results
            total_results = root.find('./atom:totalResults', ns)
            total = int(total_results.text) if total_results is not None else 0
            
            results = []
            for entry in root.findall('./atom:entry', ns):
                title = entry.find('./atom:title', ns)
                published = entry.find('./atom:published', ns)
                summary = entry.find('./atom:summary', ns)
                
                # Get author names
                authors = []
                for author in entry.findall('./atom:author', ns):
                    name = author.find('./atom:name', ns)
                    if name is not None:
                        authors.append(name.text)
                
                # Get DOI if available
                doi = None
                for link in entry.findall('./atom:link', ns):
                    if link.get('title') == 'doi':
                        doi = link.get('href').replace('http://dx.doi.org/', '')
                
                # Get arXiv ID
                id_text = entry.find('./atom:id', ns).text
                arxiv_id = id_text.split('/')[-1]
                
                # Get published year
                year = None
                if published is not None:
                    try:
                        year = datetime.strptime(published.text, '%Y-%m-%dT%H:%M:%SZ').year
                    except ValueError:
                        pass
                
                results.append({
                    'id': arxiv_id,
                    'title': title.text if title is not None else 'Untitled',
                    'authors': authors,
                    'year': year,
                    'abstract': summary.text if summary is not None else '',
                    'doi': doi,
                    'citations': 0,  # arXiv doesn't provide citation data
                    'source': 'external_arxiv'
                })
            
            return results, total
        except Exception as e:
            logging.error(f"arXiv search error: {str(e)}")
            return [], 0
    
    def search_zotero(self, query, page=1, per_page=10):
        """Search Zotero API"""
        self._rate_limit('zotero')
        try:
            start = (page - 1) * per_page
            
            # Zotero API requires pagination parameters in headers
            headers = {
                'Zotero-API-Version': '3'
            }
            
            if self.api_keys.get('zotero'):
                headers['Zotero-API-Key'] = self.api_keys['zotero']
            
            params = {
                'q': query,
                'limit': per_page,
                'start': start,
                'sort': 'date',
                'direction': 'desc',
                'format': 'json'
            }
            
            response = requests.get(self.base_urls['zotero'], params=params, headers=headers)
            
            if response.status_code != 200:
                logging.error(f"Zotero API error: {response.status_code}")
                return [], 0
            
            data = response.json()
            
            # Get total from headers
            total = int(response.headers.get('Total-Results', 0))
            
            results = []
            for item in data:
                data = item.get('data', {})
                
                # Get authors
                authors = []
                for creator in data.get('creators', []):
                    if creator.get('creatorType') == 'author':
                        name_parts = [creator.get('lastName', ''), creator.get('firstName', '')]
                        authors.append(' '.join(filter(None, name_parts)))
                
                # Get year
                year = None
                date = data.get('date', '')
                if date:
                    year_match = date.split('-')[0] if '-' in date else date.split('/')[0] if '/' in date else date
                    if year_match and year_match.isdigit() and len(year_match) == 4:
                        year = year_match
                
                results.append({
                    'id': item.get('key', ''),
                    'title': data.get('title', 'Untitled'),
                    'authors': authors,
                    'year': year,
                    'journal': data.get('publicationTitle', ''),
                    'doi': data.get('DOI', ''),
                    'citations': 0,  # Zotero doesn't provide citation data
                    'source': 'external_zotero'
                })
            
            return results, total
        except Exception as e:
            logging.error(f"Zotero search error: {str(e)}")
            return [], 0
    
    def get_paper_details(self, source, paper_id):
        """Get detailed information about a paper from a specific external source"""
        try:
            # Implement source-specific paper detail retrieval
            if source == 'openlibrary':
                return self._get_openlibrary_details(paper_id)
            elif source == 'dblp':
                return self._get_dblp_details(paper_id)
            elif source == 'arxiv':
                return self._get_arxiv_details(paper_id)
            elif source == 'zotero':
                return self._get_zotero_details(paper_id)
            else:
                logging.error(f"Unknown external source: {source}")
                return None
        except Exception as e:
            logging.error(f"Error getting paper details: {str(e)}")
            return None
    
    def _get_openlibrary_details(self, paper_id):
        """Get paper details from Open Library"""
        self._rate_limit('openlibrary')
        try:
            url = f"https://openlibrary.org/works/{paper_id}.json"
            response = requests.get(url)
            
            if response.status_code != 200:
                return None
            
            data = response.json()
            
            # Get author names
            author_names = []
            if 'authors' in data and isinstance(data['authors'], list):
                for author_ref in data['authors']:
                    if isinstance(author_ref, dict) and 'author' in author_ref:
                        author_key = author_ref['author']['key']
                        author_url = f"https://openlibrary.org{author_key}.json"
                        author_response = requests.get(author_url)
                        if author_response.status_code == 200:
                            author_data = author_response.json()
                            author_names.append(author_data.get('name', 'Unknown Author'))
            
            return {
                'id': paper_id,
                'title': data.get('title', 'Untitled'),
                'authors': author_names,
                'description': data.get('description', ''),
                'subjects': data.get('subjects', []),
                'created': data.get('created', {}).get('value', ''),
                'source': 'external_openlibrary'
            }
        except Exception as e:
            logging.error(f"Error getting OpenLibrary details: {str(e)}")
            return None
    
    def _get_dblp_details(self, paper_id):
        """Get paper details from DBLP"""
        self._rate_limit('dblp')
        try:
            url = f"https://dblp.org/rec/{paper_id}.json"
            response = requests.get(url)
            
            if response.status_code != 200:
                return None
            
            data = response.json()
            publication = data.get('result', {}).get('hits', {}).get('hit', [{}])[0].get('info', {})
            
            return {
                'id': paper_id,
                'title': publication.get('title', 'Untitled'),
                'authors': [a.get('text', '') for a in publication.get('authors', {}).get('author', [])],
                'year': publication.get('year', ''),
                'venue': publication.get('venue', ''),
                'type': publication.get('type', ''),
                'doi': publication.get('doi', ''),
                'source': 'external_dblp'
            }
        except Exception as e:
            logging.error(f"Error getting DBLP details: {str(e)}")
            return None
    
    def _get_arxiv_details(self, paper_id):
        """Get paper details from arXiv"""
        self._rate_limit('arxiv')
        try:
            url = f"http://export.arxiv.org/api/query?id_list={paper_id}"
            response = requests.get(url)
            
            if response.status_code != 200:
                return None
            
            # Parse XML response
            root = ET.fromstring(response.content)
            
            # Define namespace for arXiv API
            ns = {'atom': 'http://www.w3.org/2005/Atom',
                 'arxiv': 'http://arxiv.org/schemas/atom'}
            
            entry = root.find('./atom:entry', ns)
            if entry is None:
                return None
            
            title = entry.find('./atom:title', ns)
            summary = entry.find('./atom:summary', ns)
            published = entry.find('./atom:published', ns)
            
            # Get categories
            categories = []
            for category in entry.findall('./arxiv:category', ns):
                categories.append(category.get('term'))
            
            # Get authors
            authors = []
            for author in entry.findall('./atom:author', ns):
                name = author.find('./atom:name', ns)
                if name is not None:
                    authors.append(name.text)
            
            # Get links
            links = {}
            for link in entry.findall('./atom:link', ns):
                link_type = link.get('title', '')
                if link_type:
                    links[link_type] = link.get('href', '')
            
            return {
                'id': paper_id,
                'title': title.text if title is not None else 'Untitled',
                'abstract': summary.text if summary is not None else '',
                'authors': authors,
                'categories': categories,
                'published': published.text if published is not None else '',
                'pdf_url': links.get('pdf', ''),
                'source': 'external_arxiv'
            }
        except Exception as e:
            logging.error(f"Error getting arXiv details: {str(e)}")
            return None
    
    def _get_zotero_details(self, paper_id):
        """Get paper details from Zotero"""
        self._rate_limit('zotero')
        try:
            url = f"{self.base_urls['zotero']}/{paper_id}"
            
            headers = {
                'Zotero-API-Version': '3'
            }
            
            if self.api_keys.get('zotero'):
                headers['Zotero-API-Key'] = self.api_keys['zotero']
            
            response = requests.get(url, headers=headers)
            
            if response.status_code != 200:
                return None
            
            data = response.json()
            item_data = data.get('data', {})
            
            # Get authors
            authors = []
            for creator in item_data.get('creators', []):
                if creator.get('creatorType') == 'author':
                    name_parts = [creator.get('lastName', ''), creator.get('firstName', '')]
                    authors.append(' '.join(filter(None, name_parts)))
            
            return {
                'id': paper_id,
                'title': item_data.get('title', 'Untitled'),
                'authors': authors,
                'abstract': item_data.get('abstractNote', ''),
                'publication': item_data.get('publicationTitle', ''),
                'date': item_data.get('date', ''),
                'doi': item_data.get('DOI', ''),
                'url': item_data.get('url', ''),
                'tags': [tag.get('tag', '') for tag in item_data.get('tags', [])],
                'source': 'external_zotero'
            }
        except Exception as e:
            logging.error(f"Error getting Zotero details: {str(e)}")
            return None