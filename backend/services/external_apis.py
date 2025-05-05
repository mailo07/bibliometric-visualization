# services/external_apis.py
import requests
import xml.etree.ElementTree as ET
import time
import json
import logging
import urllib.parse
from typing import Dict, Any, List, Tuple, Optional

class ExternalAPIService:
    """Service for interacting with external APIs to fetch publication data"""
    
    def __init__(self):
        self.api_base_urls = {
            'openalex': 'https://api.openalex.org',
            'arxiv': 'http://export.arxiv.org/api/query',
            'crossref': 'https://api.crossref.org/works',
            'openlibrary': 'https://openlibrary.org/search.json',
            'dblp': 'https://dblp.org/search/publ/api',
            'gutendex': 'https://gutendex.com/books',
            'gbif': 'https://api.gbif.org/v1/literature/search'
        }
        self.rate_limits = {
            'openalex': {'requests': 0, 'last_request': 0, 'limit': 100, 'window': 3600},  # 100 per hour
            'arxiv': {'requests': 0, 'last_request': 0, 'limit': 30, 'window': 60},       # 30 per minute
            'crossref': {'requests': 0, 'last_request': 0, 'limit': 50, 'window': 60},    # 50 per minute
            'openlibrary': {'requests': 0, 'last_request': 0, 'limit': 100, 'window': 60}, # 100 per minute
            'dblp': {'requests': 0, 'last_request': 0, 'limit': 10, 'window': 60},        # 10 per minute
            'gutendex': {'requests': 0, 'last_request': 0, 'limit': 100, 'window': 60},   # 100 per minute
            'gbif': {'requests': 0, 'last_request': 0, 'limit': 60, 'window': 60}         # 60 per minute
        }
    
    def search_external(self, source: str, query: str, page: int = 1, per_page: int = 10) -> Tuple[List[Dict[str, Any]], int]:
        """
        Search external APIs for publications
        
        Args:
            source: API source to search
            query: Search text
            page: Page number (starting from 1)
            per_page: Number of results per page
            
        Returns:
            Tuple of (list of results, total count)
        """
        logging.info(f"Searching external API: {source} for query: {query}, page: {page}, per_page: {per_page}")
        
        try:
            if source == 'arxiv':
                return self._search_arxiv(query, page, per_page)
            elif source == 'openalex':
                return self._search_openalex(query, page, per_page)
            elif source == 'crossref':
                return self._search_crossref(query, page, per_page)
            elif source == 'openlibrary':
                return self._search_openlibrary(query, page, per_page)
            elif source == 'dblp':
                return self._search_dblp(query, page, per_page)
            elif source == 'gutendex':
                return self._search_gutendex(query, page, per_page)
            elif source == 'gbif':
                return self._search_gbif(query, page, per_page)
            else:
                logging.warning(f"Unknown external API source: {source}")
                return [], 0
        except Exception as e:
            logging.error(f"Error in external API search ({source}): {str(e)}")
            return [], 0
    
    def get_publication_details(self, source: str, pub_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a publication from external API"""
        try:
            if source == 'arxiv':
                return self._get_arxiv_details(pub_id)
            elif source == 'openalex':
                return self._get_openalex_details(pub_id)
            elif source == 'crossref':
                return self._get_crossref_details(pub_id)
            elif source == 'openlibrary':
                return self._get_openlibrary_details(pub_id)
            elif source == 'dblp':
                return self._get_dblp_details(pub_id)
            elif source == 'gutendex':
                return self._get_gutendex_details(pub_id)
            elif source == 'gbif':
                return self._get_gbif_details(pub_id)
            else:
                logging.warning(f"Unknown external API source for details: {source}")
                return None
        except Exception as e:
            logging.error(f"Error getting publication details from {source}: {str(e)}")
            return None
    
    def _check_rate_limit(self, source: str) -> bool:
        """Check if rate limit allows a request, and update counters"""
        now = time.time()
        rate_info = self.rate_limits.get(source)
        
        if not rate_info:
            return True
        
        # Reset counter if window has passed
        if now - rate_info['last_request'] > rate_info['window']:
            rate_info['requests'] = 0
            rate_info['last_request'] = now
        
        # Check if limit reached
        if rate_info['requests'] >= rate_info['limit']:
            logging.warning(f"Rate limit reached for {source}, waiting...")
            time.sleep(rate_info['window'] - (now - rate_info['last_request']) + 1)
            rate_info['requests'] = 0
            rate_info['last_request'] = time.time()
        
        # Update counters
        rate_info['requests'] += 1
        rate_info['last_request'] = now
        
        return True
    
    def _search_arxiv(self, query: str, page: int, per_page: int) -> Tuple[List[Dict[str, Any]], int]:
        """Search arXiv API"""
        self._check_rate_limit('arxiv')
        
        # arXiv uses start and max_results parameters
        start = (page - 1) * per_page
        
        # Prepare URL and parameters
        search_query = f"all:{query.replace(' ', '+')}"
        params = {
            'search_query': search_query,
            'start': start,
            'max_results': per_page,
            'sortBy': 'relevance',
            'sortOrder': 'descending'
        }
        
        # Make request
        response = requests.get(self.api_base_urls['arxiv'], params=params)
        
        if response.status_code != 200:
            logging.error(f"arXiv API error: {response.status_code}")
            return [], 0
        
        # Parse XML response
        try:
            root = ET.fromstring(response.content)
            
            # Get namespace from the root element
            ns = {'atom': 'http://www.w3.org/2005/Atom'}
            
            # Parse entries
            entries = root.findall('.//atom:entry', ns)
            
            results = []
            for entry in entries:
                # Get ID (arXiv ID)
                id_elem = entry.find('./atom:id', ns)
                if id_elem is not None:
                    arxiv_id = id_elem.text.split('/')[-1]
                else:
                    continue  # Skip entries without ID
                
                # Get title
                title_elem = entry.find('./atom:title', ns)
                title = title_elem.text if title_elem is not None else "No title"
                
                # Get authors
                authors = []
                for author_elem in entry.findall('./atom:author/atom:name', ns):
                    if author_elem.text:
                        authors.append(author_elem.text)
                
                # Get publication date
                published_elem = entry.find('./atom:published', ns)
                published = published_elem.text if published_elem is not None else ""
                year = published.split('-')[0] if published and '-' in published else ""
                
                # Get abstract
                summary_elem = entry.find('./atom:summary', ns)
                abstract = summary_elem.text if summary_elem is not None else ""
                
                # Get DOI if available
                doi = None
                
                # Get categories/subjects
                categories = []
                for category_elem in entry.findall('./atom:category', ns):
                    term = category_elem.get('term')
                    if term:
                        categories.append(term)
                
                # Create result object
                result = {
                    'id': arxiv_id,
                    'title': title,
                    'author': ', '.join(authors),
                    'year': year,
                    'abstract': abstract,
                    'doi': doi,
                    'subject': ', '.join(categories) if categories else None,
                    'citations': 0,  # arXiv doesn't provide citation counts
                    'source': 'arxiv',
                    'url': f"https://arxiv.org/abs/{arxiv_id}"
                }
                
                results.append(result)
            
            # Try to get total count if available
            total_results_elem = root.find('.//opensearch:totalResults', 
                                         {'opensearch': 'http://a9.com/-/spec/opensearch/1.1/'})
            total = int(total_results_elem.text) if total_results_elem is not None else len(results)
            
            return results, total
            
        except Exception as e:
            logging.error(f"Error parsing arXiv response: {str(e)}")
            return [], 0
    
    def _search_openalex(self, query: str, page: int, per_page: int) -> Tuple[List[Dict[str, Any]], int]:
        """Search OpenAlex API"""
        self._check_rate_limit('openalex')
        
        # OpenAlex uses page and per-page parameters
        params = {
            'search': query,
            'page': page,
            'per-page': per_page,
            'sort': 'relevance_score:desc'
        }
        
        # Make request
        url = f"{self.api_base_urls['openalex']}/works"
        response = requests.get(url, params=params)
        
        if response.status_code != 200:
            logging.error(f"OpenAlex API error: {response.status_code}")
            return [], 0
        
        # Parse JSON response
        data = response.json()
        
        results = []
        for work in data.get('results', []):
            # Extract author names
            authors = []
            for author in work.get('authorships', []):
                author_name = author.get('author', {}).get('display_name')
                if author_name:
                    authors.append(author_name)
            
            # Extract subjects/concepts
            subjects = []
            for concept in work.get('concepts', []):
                subject_name = concept.get('display_name')
                if subject_name:
                    subjects.append(subject_name)
            
            # Create result object
            result = {
                'id': work.get('id', '').replace('https://openalex.org/W', ''),
                'title': work.get('title'),
                'author': ', '.join(authors),
                'year': work.get('publication_year'),
                'abstract': work.get('abstract'),
                'doi': work.get('doi'),
                'subject': ', '.join(subjects) if subjects else None,
                'citations': work.get('cited_by_count', 0),
                'source': 'openalex',
                'url': work.get('doi') or work.get('id')
            }
            
            results.append(result)
        
        # Get total count
        total = data.get('meta', {}).get('count', len(results))
        
        return results, total
    
    def _search_crossref(self, query: str, page: int, per_page: int) -> Tuple[List[Dict[str, Any]], int]:
        """Search Crossref API"""
        self._check_rate_limit('crossref')
        
        # Crossref uses rows and offset parameters
        offset = (page - 1) * per_page
        
        # Prepare URL and parameters
        params = {
            'query': query,
            'rows': per_page,
            'offset': offset,
            'sort': 'relevance',
            'order': 'desc'
        }
        
        # Make request with proper error handling
        for attempt in range(3):  # Retry 3 times if needed
            try:
                response = requests.get(self.api_base_urls['crossref'], params=params)
                response.raise_for_status()  # Raise exception for 4XX/5XX responses
                data = response.json()
                break
            except requests.exceptions.RequestException as e:
                if attempt == 2:  # Last attempt
                    logging.error(f"Crossref API error after 3 retries: {str(e)}")
                    return [], 0
                time.sleep(2)  # Wait before retrying
        
        # Parse JSON response
        results = []
        for item in data.get('message', {}).get('items', []):
            # Extract author names
            authors = []
            for author in item.get('author', []):
                author_name = []
                if 'given' in author:
                    author_name.append(author['given'])
                if 'family' in author:
                    author_name.append(author['family'])
                if author_name:
                    authors.append(' '.join(author_name))
            
            # Extract published date
            published_date = None
            if 'published-print' in item and item['published-print'].get('date-parts'):
                published_date = item['published-print']['date-parts'][0]
            elif 'published-online' in item and item['published-online'].get('date-parts'):
                published_date = item['published-online']['date-parts'][0]
            
            year = published_date[0] if published_date and len(published_date) > 0 else None
            
            # Extract subjects
            subjects = item.get('subject', [])
            
            # Extract citation count
            citation_count = item.get('is-referenced-by-count', 0)
            
            # Create result object
            result = {
                'id': item.get('DOI', ''),
                'title': item.get('title', ['No title'])[0] if item.get('title') else 'No title',
                'author': ', '.join(authors),
                'year': year,
                'abstract': item.get('abstract', ''),
                'doi': item.get('DOI'),
                'subject': ', '.join(subjects) if subjects else None,
                'citations': citation_count,
                'source': 'crossref',
                'url': f"https://doi.org/{item.get('DOI')}" if item.get('DOI') else None
            }
            
            results.append(result)
        
        # Get total count
        total = data.get('message', {}).get('total-results', len(results))
        
        return results, total
    
    def _search_dblp(self, query: str, page: int, per_page: int) -> Tuple[List[Dict[str, Any]], int]:
        """Search DBLP API"""
        self._check_rate_limit('dblp')
        
        # DBLP uses h (max hits) and f (first) parameters
        first = (page - 1) * per_page
        
        # Prepare URL and parameters
        params = {
            'q': query,
            'format': 'json',
            'h': per_page,
            'f': first
        }
        
        # Make request
        response = requests.get(self.api_base_urls['dblp'], params=params)
        
        if response.status_code != 200:
            logging.error(f"DBLP API error: {response.status_code}")
            return [], 0
        
        # Parse JSON response
        try:
            data = response.json()
            
            # Check if data has the expected structure
            if 'result' not in data or 'hits' not in data['result']:
                logging.error("Unexpected DBLP API response structure")
                return [], 0
            
            # Parse hits
            hits = data['result']['hits']
            hit_list = hits.get('hit', []) if hits else []
            
            results = []
            for hit in hit_list:
                info = hit.get('info', {})
                
                # Extract authors
                authors = []
                if 'authors' in info and 'author' in info['authors']:
                    author_list = info['authors']['author']
                    if isinstance(author_list, list):
                        for author in author_list:
                            if isinstance(author, dict) and 'text' in author:
                                authors.append(author['text'])
                            elif isinstance(author, str):
                                authors.append(author)
                    elif isinstance(author_list, dict) and 'text' in author_list:
                        authors.append(author_list['text'])
                
                # Create result object
                result = {
                    'id': hit.get('@id', ''),
                    'title': info.get('title', 'No title'),
                    'author': ', '.join(authors),
                    'year': info.get('year'),
                    'abstract': '',  # DBLP doesn't provide abstracts
                    'doi': info.get('doi'),
                    'subject': info.get('type'),
                    'citations': 0,  # DBLP doesn't provide citation counts
                    'source': 'dblp',
                    'url': info.get('url')
                }
                
                results.append(result)
            
            # Get total count
            total = int(hits.get('@total', 0)) if hits else 0
            
            return results, total
            
        except Exception as e:
            logging.error(f"Error parsing DBLP response: {str(e)}")
            return [], 0
    
    def _search_openlibrary(self, query: str, page: int, per_page: int) -> Tuple[List[Dict[str, Any]], int]:
        """Search Open Library API"""
        self._check_rate_limit('openlibrary')
        
        # Open Library uses page and limit parameters
        offset = (page - 1) * per_page
        
        # Prepare URL and parameters
        params = {
            'q': query,
            'page': page,
            'limit': per_page
        }
        
        # Make request
        response = requests.get(self.api_base_urls['openlibrary'], params=params)
        
        if response.status_code != 200:
            logging.error(f"Open Library API error: {response.status_code}")
            return [], 0
        
        # Parse JSON response
        try:
            data = response.json()
            
            results = []
            for doc in data.get('docs', []):
                # Extract authors
                authors = doc.get('author_name', [])
                
                # Extract subject
                subjects = doc.get('subject', [])
                
                # Create result object
                result = {
                    'id': doc.get('key', '').replace('/works/', ''),
                    'title': doc.get('title', 'No title'),
                    'author': ', '.join(authors) if authors else 'Unknown',
                    'year': doc.get('first_publish_year'),
                    'abstract': '',  # Open Library doesn't provide abstracts
                    'doi': None,  # Open Library doesn't provide DOIs
                    'subject': ', '.join(subjects[:5]) if subjects else None,  # Limit to 5 subjects
                    'citations': 0,  # Open Library doesn't provide citation counts
                    'source': 'openlibrary',
                    'url': f"https://openlibrary.org{doc.get('key')}" if doc.get('key') else None
                }
                
                results.append(result)
            
            # Get total count
            total = data.get('numFound', len(results))
            
            return results, total
            
        except Exception as e:
            logging.error(f"Error parsing Open Library response: {str(e)}")
            return [], 0
    
    def _search_gutendex(self, query: str, page: int, per_page: int) -> Tuple[List[Dict[str, Any]], int]:
        """Search Gutendex API (Project Gutenberg)"""
        self._check_rate_limit('gutendex')
        
        # Gutendex uses page and per_page parameters
        params = {
            'search': query,
            'page': page,
            'mime_type': 'text'  # Get books with text content
        }
        
        # Make request
        response = requests.get(self.api_base_urls['gutendex'], params=params)
        
        if response.status_code != 200:
            logging.error(f"Gutendex API error: {response.status_code}")
            return [], 0
        
        # Parse JSON response
        try:
            data = response.json()
            
            results = []
            for book in data.get('results', []):
                # Extract authors
                authors = []
                for author in book.get('authors', []):
                    name = author.get('name')
                    if name:
                        authors.append(name)
                
                # Extract subjects
                subjects = book.get('subjects', [])
                
                # Create result object
                result = {
                    'id': str(book.get('id', '')),
                    'title': book.get('title', 'No title'),
                    'author': ', '.join(authors) if authors else 'Unknown',
                    'year': None,  # Gutendex doesn't reliably provide publication years
                    'abstract': '',  # Gutendex doesn't provide abstracts
                    'doi': None,  # Gutendex doesn't provide DOIs
                    'subject': ', '.join(subjects[:5]) if subjects else None,  # Limit to 5 subjects
                    'citations': 0,  # Gutendex doesn't provide citation counts
                    'source': 'gutendex',
                    'url': book.get('formats', {}).get('text/html')
                }
                
                results.append(result)
            
            # Get total count
            total = data.get('count', len(results))
            
            return results, total
            
        except Exception as e:
            logging.error(f"Error parsing Gutendex response: {str(e)}")
            return [], 0
    
    def _search_gbif(self, query: str, page: int, per_page: int) -> Tuple[List[Dict[str, Any]], int]:
        """Search Global Biodiversity Information Facility (GBIF) API"""
        self._check_rate_limit('gbif')
        
        # GBIF uses offset and limit parameters
        offset = (page - 1) * per_page
        
        # Prepare URL and parameters
        params = {
            'q': query,
            'offset': offset,
            'limit': per_page
        }
        
        # Make request
        response = requests.get(self.api_base_urls['gbif'], params=params)
        
        if response.status_code != 200:
            logging.error(f"GBIF API error: {response.status_code}")
            return [], 0
        
        # Parse JSON response
        try:
            data = response.json()
            
            results = []
            for item in data.get('results', []):
                # Extract authors if available
                authors = []
                for author in item.get('authors', []):
                    if isinstance(author, str):
                        authors.append(author)
                    elif isinstance(author, dict) and 'name' in author:
                        authors.append(author['name'])
                
                # Create result object
                result = {
                    'id': str(item.get('id', '')),
                    'title': item.get('title', 'No title'),
                    'author': ', '.join(authors) if authors else 'Unknown',
                    'year': item.get('year'),
                    'abstract': item.get('abstract', ''),
                    'doi': item.get('identifiers', {}).get('doi'),
                    'subject': item.get('topics'),
                    'citations': 0,  # GBIF doesn't provide citation counts
                    'source': 'gbif',
                    'url': item.get('websites', [None])[0] if item.get('websites') else None
                }
                
                results.append(result)
            
            # Get total count
            total = data.get('count', len(results))
            
            return results, total
            
        except Exception as e:
            logging.error(f"Error parsing GBIF response: {str(e)}")
            return [], 0
    
    # Individual methods for fetching publication details
    def _get_arxiv_details(self, pub_id: str) -> Optional[Dict[str, Any]]:
        """Get publication details from arXiv"""
        self._check_rate_limit('arxiv')
        
        # Prepare URL and parameters
        params = {
            'id_list': pub_id
        }
        
        # Make request
        response = requests.get(self.api_base_urls['arxiv'], params=params)
        
        if response.status_code != 200:
            return None
        
        # Parse XML response
        try:
            root = ET.fromstring(response.content)
            
            # Get namespace from the root element
            ns = {'atom': 'http://www.w3.org/2005/Atom'}
            
            # Find the entry
            entry = root.find('.//atom:entry', ns)
            
            if entry is None:
                return None
            
            # Extract data
            title_elem = entry.find('./atom:title', ns)
            title = title_elem.text if title_elem is not None else "No title"
            
            authors = []
            for author_elem in entry.findall('./atom:author/atom:name', ns):
                if author_elem.text:
                    authors.append(author_elem.text)
            
            published_elem = entry.find('./atom:published', ns)
            published = published_elem.text if published_elem is not None else ""
            year = published.split('-')[0] if published and '-' in published else ""
            
            summary_elem = entry.find('./atom:summary', ns)
            abstract = summary_elem.text if summary_elem is not None else ""
            
            categories = []
            for category_elem in entry.findall('./atom:category', ns):
                term = category_elem.get('term')
                if term:
                    categories.append(term)
            
            # Create result object
            result = {
                'id': pub_id,
                'title': title,
                'author': ', '.join(authors),
                'year': year,
                'abstract': abstract,
                'doi': None,
                'subject': ', '.join(categories) if categories else None,
                'citations': 0,
                'source': 'arxiv',
                'url': f"https://arxiv.org/abs/{pub_id}"
            }
            
            return result
            
        except Exception as e:
            logging.error(f"Error parsing arXiv details: {str(e)}")
            return None
    
    def _get_openalex_details(self, pub_id: str) -> Optional[Dict[str, Any]]:
        """Get publication details from OpenAlex"""
        self._check_rate_limit('openalex')
        
        # Make request
        url = f"{self.api_base_urls['openalex']}/works/W{pub_id}"
        response = requests.get(url)
        
        if response.status_code != 200:
            return None
        
        # Parse JSON response
        work = response.json()
        
        # Extract author names
        authors = []
        for author in work.get('authorships', []):
            author_name = author.get('author', {}).get('display_name')
            if author_name:
                authors.append(author_name)
        
        # Extract subjects/concepts
        subjects = []
        for concept in work.get('concepts', []):
            subject_name = concept.get('display_name')
            if subject_name:
                subjects.append(subject_name)
        
        # Create result object
        result = {
            'id': pub_id,
            'title': work.get('title'),
            'author': ', '.join(authors),
            'year': work.get('publication_year'),
            'abstract': work.get('abstract'),
            'doi': work.get('doi'),
            'subject': ', '.join(subjects) if subjects else None,
            'citations': work.get('cited_by_count', 0),
            'source': 'openalex',
            'url': work.get('doi') or work.get('id')
        }
        
        return result
    
    def _get_crossref_details(self, pub_id: str) -> Optional[Dict[str, Any]]:
        """Get publication details from Crossref"""
        self._check_rate_limit('crossref')
        
        # Make request
        url = f"{self.api_base_urls['crossref']}/{pub_id}"
        response = requests.get(url)
        
        if response.status_code != 200:
            return None
        
        # Parse JSON response
        data = response.json()
        
        # Check if data has the expected structure
        if 'message' not in data:
            return None
        
        item = data['message']
        
        # Extract author names
        authors = []
        for author in item.get('author', []):
            author_name = []
            if 'given' in author:
                author_name.append(author['given'])
            if 'family' in author:
                author_name.append(author['family'])
            if author_name:
                authors.append(' '.join(author_name))
        
        # Extract published date
        published_date = None
        if 'published-print' in item and item['published-print'].get('date-parts'):
            published_date = item['published-print']['date-parts'][0]
        elif 'published-online' in item and item['published-online'].get('date-parts'):
            published_date = item['published-online']['date-parts'][0]
        
        year = published_date[0] if published_date and len(published_date) > 0 else None
        
        # Extract subjects
        subjects = item.get('subject', [])
        
        # Extract citation count
        citation_count = item.get('is-referenced-by-count', 0)
        
        # Create result object
        result = {
            'id': pub_id,
            'title': item.get('title', ['No title'])[0] if item.get('title') else 'No title',
            'author': ', '.join(authors),
            'year': year,
            'abstract': item.get('abstract', ''),
            'doi': pub_id,
            'subject': ', '.join(subjects) if subjects else None,
            'citations': citation_count,
            'source': 'crossref',
            'url': f"https://doi.org/{pub_id}" if pub_id else None
        }
        
        return result
    
    def _get_dblp_details(self, pub_id: str) -> Optional[Dict[str, Any]]:
        """Get publication details from DBLP"""
        # For DBLP, we need to convert the ID to a URL
        url = f"https://dblp.org/rec/{pub_id}.xml"
        
        self._check_rate_limit('dblp')
        
        # Make request
        response = requests.get(url)
        
        if response.status_code != 200:
            return None
        
        # Parse XML response
        try:
            root = ET.fromstring(response.content)
            
            # Find publication type
            for pub_type in ['article', 'inproceedings', 'book', 'incollection', 'proceedings', 'phdthesis', 'mastersthesis']:
                pub_elem = root.find(f'.//{pub_type}')
                if pub_elem is not None:
                    break
            
            if pub_elem is None:
                return None
            
            # Extract title
            title_elem = pub_elem.find('.//title')
            title = title_elem.text if title_elem is not None else "No title"
            
            # Extract authors
            authors = []
            for author_elem in pub_elem.findall('.//author'):
                if author_elem.text:
                    authors.append(author_elem.text)
            
            # Extract year
            year_elem = pub_elem.find('.//year')
            year = year_elem.text if year_elem is not None else None
            
            # Extract DOI
            doi_elem = pub_elem.find('.//ee[@type="doi"]')
            doi = doi_elem.text.replace('https://doi.org/', '') if doi_elem is not None else None
            
            # Create result object
            result = {
                'id': pub_id,
                'title': title,
                'author': ', '.join(authors),
                'year': year,
                'abstract': '',  # DBLP doesn't provide abstracts
                'doi': doi,
                'subject': pub_type,  # Use publication type as subject
                'citations': 0,  # DBLP doesn't provide citation counts
                'source': 'dblp',
                'url': f"https://dblp.org/rec/{pub_id}.html"
            }
            
            return result
            
        except Exception as e:
            logging.error(f"Error parsing DBLP details: {str(e)}")
            return None
    
    def _get_openlibrary_details(self, pub_id: str) -> Optional[Dict[str, Any]]:
        """Get publication details from Open Library"""
        # Construct URL for Open Library work
        url = f"https://openlibrary.org/works/{pub_id}.json"
        
        self._check_rate_limit('openlibrary')
        
        # Make request
        response = requests.get(url)
        
        if response.status_code != 200:
            return None
        
        # Parse JSON response
        try:
            data = response.json()
            
            # Extract title
            title = data.get('title', 'No title')
            
            # Extract authors (requires additional API calls)
            authors = []
            for author_key in data.get('authors', []):
                if isinstance(author_key, dict) and 'author' in author_key:
                    author_url = f"https://openlibrary.org{author_key['author']['key']}.json"
                    author_response = requests.get(author_url)
                    if author_response.status_code == 200:
                        author_data = author_response.json()
                        authors.append(author_data.get('name', 'Unknown'))
            
            # Extract subjects
            subjects = data.get('subjects', [])
            
            # Extract first publication date
            first_publish_date = data.get('first_publish_date')
            year = first_publish_date.split(',')[-1].strip() if first_publish_date else None
            
            # Create result object
            result = {
                'id': pub_id,
                'title': title,
                'author': ', '.join(authors) if authors else 'Unknown',
                'year': year,
                'abstract': data.get('description', {}).get('value', '') if isinstance(data.get('description'), dict) else str(data.get('description', '')),
                'doi': None,  # Open Library doesn't provide DOIs
                'subject': ', '.join(subjects[:5]) if subjects else None,  # Limit to 5 subjects
                'citations': 0,  # Open Library doesn't provide citation counts
                'source': 'openlibrary',
                'url': f"https://openlibrary.org/works/{pub_id}"
            }
            
            return result
            
        except Exception as e:
            logging.error(f"Error parsing Open Library details: {str(e)}")
            return None
    
    def _get_gutendex_details(self, pub_id: str) -> Optional[Dict[str, Any]]:
        """Get publication details from Gutendex (Project Gutenberg)"""
        # Construct URL for Gutendex book
        url = f"{self.api_base_urls['gutendex']}/{pub_id}"
        
        self._check_rate_limit('gutendex')
        
        # Make request
        response = requests.get(url)
        
        if response.status_code != 200:
            return None
        
        # Parse JSON response
        try:
            book = response.json()
            
            # Extract authors
            authors = []
            for author in book.get('authors', []):
                name = author.get('name')
                if name:
                    authors.append(name)
            
            # Extract subjects
            subjects = book.get('subjects', [])
            
            # Create result object
            result = {
                'id': pub_id,
                'title': book.get('title', 'No title'),
                'author': ', '.join(authors) if authors else 'Unknown',
                'year': None,  # Gutendex doesn't reliably provide publication years
                'abstract': '',  # Gutendex doesn't provide abstracts
                'doi': None,  # Gutendex doesn't provide DOIs
                'subject': ', '.join(subjects[:5]) if subjects else None,  # Limit to 5 subjects
                'citations': 0,  # Gutendex doesn't provide citation counts
                'source': 'gutendex',
                'url': book.get('formats', {}).get('text/html')
            }
            
            return result
            
        except Exception as e:
            logging.error(f"Error parsing Gutendex details: {str(e)}")
            return None
    
    def _get_gbif_details(self, pub_id: str) -> Optional[Dict[str, Any]]:
        """Get publication details from GBIF"""
        # Construct URL for GBIF literature record
        url = f"{self.api_base_urls['gbif']}/{pub_id}"
        
        self._check_rate_limit('gbif')
        
        # Make request
        response = requests.get(url)
        
        if response.status_code != 200:
            return None
        
        # Parse JSON response
        try:
            item = response.json()
            
            # Extract authors if available
            authors = []
            for author in item.get('authors', []):
                if isinstance(author, str):
                    authors.append(author)
                elif isinstance(author, dict) and 'name' in author:
                    authors.append(author['name'])
            
            # Create result object
            result = {
                'id': pub_id,
                'title': item.get('title', 'No title'),
                'author': ', '.join(authors) if authors else 'Unknown',
                'year': item.get('year'),
                'abstract': item.get('abstract', ''),
                'doi': item.get('identifiers', {}).get('doi'),
                'subject': item.get('topics'),
                'citations': 0,  # GBIF doesn't provide citation counts
                'source': 'gbif',
                'url': item.get('websites', [None])[0] if item.get('websites') else None
            }
            
            return result
            
        except Exception as e:
            logging.error(f"Error parsing GBIF details: {str(e)}")
            return None