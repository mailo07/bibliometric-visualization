# search_service.py
from services.database import DatabaseService
from services.external_apis import ExternalAPIService
from typing import Dict, Any, Optional, List
import logging
from datetime import datetime
from collections import defaultdict
import uuid

class SearchService:
    """Service for handling search-related operations across database and external APIs"""
    
    def __init__(self):
        self.db = DatabaseService()
        self.api = ExternalAPIService()
    
    def search_publications(self, query: str, page: int = 1, per_page: int = 10, 
                           filters: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Search for publications across all sources with pagination and filtering
        
        Args:
            query: Search text
            page: Page number (starting from 1)
            per_page: Number of results per page
            filters: Optional dictionary of filters
            
        Returns:
            Dictionary with combined results and pagination info
        """
        filters = filters or {}
        include_external = filters.get('include_external', 'false').lower() == 'true'
        
        if not query or not query.strip():
            return {
                'results': [],
                'total': 0,
                'page': page,
                'per_page': per_page,
                'metrics': self._get_empty_metrics(),
                'external_apis_used': include_external
            }
        
        try:
            # Get database results first
            db_results = self._search_database(query, page, per_page, filters)
            processed_db = self._process_results(db_results.get('results', []), 'database')
            
            # Get external API results if requested
            external_results = []
            if include_external:
                api_sources = ['openlibrary', 'dblp', 'arxiv', 'zotero']
                for source in api_sources:
                    try:
                        api_res, _ = getattr(self.api, f'search_{source}')(query, page, per_page)
                        external_results.extend(self._process_results(api_res, f'external_{source}'))
                    except Exception as e:
                        logging.error(f"Error fetching from {source}: {str(e)}")
            
            # Combine and paginate results
            all_results = processed_db + external_results
            total_results = len(processed_db) + len(external_results)
            
            # Calculate metrics
            metrics = self._calculate_metrics(all_results)
            
            return {
                'results': all_results,
                'total': total_results,
                'page': page,
                'per_page': per_page,
                'metrics': metrics,
                'external_apis_used': include_external
            }
            
        except Exception as e:
            logging.error(f"Search failed: {str(e)}")
            return {
                'results': [],
                'total': 0,
                'metrics': self._get_empty_metrics(),
                'external_apis_used': include_external
            }
    
    def _process_results(self, results, source):
        """Standardize result format"""
        processed = []
        for item in results:
            processed.append({
                'id': item.get('id', str(uuid.uuid4())),
                'title': item.get('title', 'Untitled'),
                'author': ', '.join(item['authors']) if isinstance(item.get('authors'), list) 
                         else item.get('author', 'Unknown'),
                'year': item.get('year', ''),
                'journal': item.get('journal') or item.get('source', ''),
                'citations': int(item.get('citations', 0)),
                'doi': item.get('doi', ''),
                'abstract': item.get('abstract', ''),
                'source': source
            })
        return processed
    
    def _calculate_metrics(self, results):
        """Generate comprehensive metrics"""
        if not results:
            return self._get_empty_metrics()
        
        metrics = {
            'scholarlyWorks': len(results),
            'worksCited': sum(item.get('citations', 0) for item in results),
            'frequentlyCited': sum(1 for item in results if item.get('citations', 0) > 10),
            'citation_trends': [],
            'top_authors': [],
            'publication_distribution': []
        }
        
        # Citation trends by year
        year_counts = defaultdict(int)
        for item in results:
            if item.get('year'):
                year = str(item['year'])[:4]
                if year.isdigit():
                    year_counts[year] += item.get('citations', 0)
        metrics['citation_trends'] = [{'year': k, 'citations': v} for k, v in sorted(year_counts.items())]
        
        # Top authors
        author_counts = defaultdict(int)
        for item in results:
            authors = item['author'].split(',') if isinstance(item.get('author'), str) else []
            for author in authors:
                author = author.strip()
                if author:
                    author_counts[author] += item.get('citations', 0)
        metrics['top_authors'] = sorted(
            [{'name': k, 'citations': v} for k, v in author_counts.items()],
            key=lambda x: x['citations'], reverse=True
        )[:5]
        
        # Publication distribution
        pub_counts = defaultdict(int)
        for item in results:
            pub = item.get('journal', 'Unknown')
            pub_counts[pub] += 1
        metrics['publication_distribution'] = sorted(
            [{'name': k, 'count': v} for k, v in pub_counts.items()],
            key=lambda x: x['count'], reverse=True
        )[:5]
        
        return metrics
    
    def _get_empty_metrics(self):
        """Return placeholder metrics when no results"""
        current_year = datetime.now().year
        return {
            'scholarlyWorks': 0,
            'worksCited': 0,
            'frequentlyCited': 0,
            'citation_trends': [{'year': str(y), 'citations': 0} for y in range(current_year-4, current_year+1)],
            'top_authors': [{'name': 'No data', 'citations': 0}],
            'publication_distribution': [{'name': 'No data', 'count': 0}]
        }
    
    def _search_database(self, query: str, page: int, per_page: int, 
                        filters: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Search across all database tables with pagination and filtering
        """
        filters = filters or {}
        offset = (page - 1) * per_page
        
        # Define the filter clauses
        filter_conditions = []
        filter_params = {'query': query, 'limit': per_page, 'offset': offset}
        
        if filters.get('year_from'):
            filter_conditions.append("year >= %(year_from)s")
            filter_params['year_from'] = filters['year_from']
        
        if filters.get('year_to'):
            filter_conditions.append("year <= %(year_to)s")
            filter_params['year_to'] = filters['year_to']
        
        if filters.get('min_citations'):
            filter_conditions.append("citations >= %(min_citations)s")
            filter_params['min_citations'] = filters['min_citations']
        
        # Source filtering differs by table
        source_filter = ""
        if filters.get('source'):
            source = filters['source']
            if source in ['bibliometric', 'crossref', 'google_scholar']:
                source_filter = f"AND source = '{source}'"
        
        # Combine filter conditions
        additional_filters = " AND ".join(filter_conditions)
        if additional_filters:
            additional_filters = f"AND {additional_filters}"
        
        # Build the unified search query
        search_query = f"""
            (SELECT 
                id, 
                COALESCE(author_name, 'Unknown') AS author, 
                COALESCE(title, 'Untitled') AS title, 
                doi, 
                year, 
                cited_by AS citations,
                'bibliometric' AS source
            FROM bibliometric_data
            WHERE to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(author_name, '')) 
                  @@ plainto_tsquery('english', %(query)s)
            {additional_filters}
            {source_filter if 'bibliometric' in source_filter else ''}
            LIMIT %(limit)s OFFSET %(offset)s)
            
            UNION ALL
            
            (SELECT 
                id, 
                COALESCE(authors, 'Unknown') AS author, 
                COALESCE(title, 'Untitled') AS title, 
                doi, 
                year, 
                citation_count AS citations,
                'crossref' AS source
            FROM crossref_data_multiple_subjects
            WHERE to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(authors, '')) 
                  @@ plainto_tsquery('english', %(query)s)
            {additional_filters}
            {source_filter if 'crossref' in source_filter else ''}
            LIMIT %(limit)s OFFSET %(offset)s)
            
            UNION ALL
            
            (SELECT 
                id, 
                COALESCE(author_name, 'Unknown') AS author, 
                COALESCE(title, 'Untitled') AS title, 
                NULL AS doi, 
                year, 
                cited_by AS citations,
                'google_scholar' AS source
            FROM google_scholar_data
            WHERE to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(author_name, '')) 
                  @@ plainto_tsquery('english', %(query)s)
            {additional_filters}
            {source_filter if 'google_scholar' in source_filter else ''}
            LIMIT %(limit)s OFFSET %(offset)s)
        """
        
        try:
            # Execute query with proper error handling
            results = self.db.execute_query(search_query, filter_params)
            
            # Count total results for pagination
            count_query = f"""
                SELECT COUNT(*) FROM (
                    SELECT 1 
                    FROM bibliometric_data
                    WHERE to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(author_name, '')) 
                          @@ plainto_tsquery('english', %(query)s)
                    {additional_filters}
                    {source_filter if 'bibliometric' in source_filter else ''}
                    
                    UNION ALL
                    
                    SELECT 1 
                    FROM crossref_data_multiple_subjects
                    WHERE to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(authors, '')) 
                          @@ plainto_tsquery('english', %(query)s)
                    {additional_filters}
                    {source_filter if 'crossref' in source_filter else ''}
                    
                    UNION ALL
                    
                    SELECT 1 
                    FROM google_scholar_data
                    WHERE to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(author_name, '')) 
                          @@ plainto_tsquery('english', %(query)s)
                    {additional_filters}
                    {source_filter if 'google_scholar' in source_filter else ''}
                ) AS total_count
            """
            
            count_result = self.db.execute_query(count_query, {'query': query, **{k: v for k, v in filter_params.items() 
                                                                               if k in ['year_from', 'year_to', 'min_citations']}})
            total = count_result[0]['count'] if count_result else 0
            
            logging.info(f"Database search found {len(results) if results else 0} results")
            
            return {
                'results': results or [],
                'total': total
            }
            
        except Exception as e:
            logging.error(f"Database search failed: {str(e)}")
            return {'results': [], 'total': 0}
    
    def get_publication_details(self, paper_id, source):
        """Get detailed information about a publication"""
        if source and source.startswith('external_'):
            # Handle external API paper details
            external_source = source.replace('external_', '')
            return self.api.get_paper_details(external_source, paper_id)
        else:
            # Handle database paper details
            if source == 'bibliometric':
                return self._get_bibliometric_details(paper_id)
            elif source == 'crossref':
                return self._get_crossref_details(paper_id)
            elif source == 'google_scholar':
                return self._get_google_scholar_details(paper_id)
            else:
                # Try to find the paper in any database table
                return self._get_paper_details_from_any_source(paper_id)
    
    def _get_bibliometric_details(self, paper_id):
        """Get paper details from bibliometric_data table"""
        query = """
            SELECT *
            FROM bibliometric_data
            WHERE id = %s
        """
        result = self.db.execute_query(query, (paper_id,))
        if result and len(result) > 0:
            return self._process_db_result(result[0])
        return None
    
    def _get_crossref_details(self, paper_id):
        """Get paper details from crossref_data_multiple_subjects table"""
        query = """
            SELECT *
            FROM crossref_data_multiple_subjects
            WHERE id = %s
        """
        result = self.db.execute_query(query, (paper_id,))
        if result and len(result) > 0:
            return self._process_db_result(result[0])
        return None
    
    def _get_google_scholar_details(self, paper_id):
        """Get paper details from google_scholar_data table"""
        query = """
            SELECT *
            FROM google_scholar_data
            WHERE id = %s
        """
        result = self.db.execute_query(query, (paper_id,))
        if result and len(result) > 0:
            return self._process_db_result(result[0])
        return None
    
    def _process_db_result(self, db_result):
        """Standardize database result format"""
        return {
            'id': db_result.get('id', ''),
            'title': db_result.get('title', 'Untitled'),
            'author': db_result.get('author', 'Unknown'),
            'year': db_result.get('year', ''),
            'journal': db_result.get('journal') or db_result.get('source', ''),
            'citations': int(db_result.get('citations', 0)),
            'doi': db_result.get('doi', ''),
            'source': db_result.get('source', 'database')
        }
    
    def _get_paper_details_from_any_source(self, paper_id):
        """Try to find paper details in any database table"""
        # Try bibliometric_data first
        result = self._get_bibliometric_details(paper_id)
        if result:
            return result
        
        # Try crossref_data_multiple_subjects
        result = self._get_crossref_details(paper_id)
        if result:
            return result
        
        # Try google_scholar_data
        result = self._get_google_scholar_details(paper_id)
        if result:
            return result
        
        return None