# search_service.py (updated)
from services.database import DatabaseService
from services.external_apis import ExternalAPIService
from typing import Dict, Any, Optional, List, Union
import logging

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
            return {'results': [], 'total': 0, 'page': page, 'per_page': per_page}
        
        try:
            # Get database results first
            db_results = self._search_database(query, page, per_page, filters)
            
            # If database search failed, initialize empty results
            if not db_results:
                db_results = {'results': [], 'total': 0}
            
            results = db_results.get('results', [])
            total = db_results.get('total', 0)
            
            # Return early if we don't need to include external API results
            if not include_external:
                return {
                    'results': results,
                    'total': total,
                    'page': page,
                    'per_page': per_page,
                    'external_apis_used': False
                }
            
            # Get external API results if requested
            external_results = []
            try:
                # Call each external API and add results
                for source in ['openlibrary', 'dblp', 'arxiv', 'zotero']:
                    api_results, _ = getattr(self.api, f'search_{source}')(query, page, per_page)
                    for result in api_results:
                        result['source'] = f"external_{source}"
                    external_results.extend(api_results)
            except Exception as e:
                logging.error(f"Error fetching external API results: {str(e)}")
            
            # Combine results
            all_results = results + external_results
            
            return {
                'results': all_results,
                'total': total + len(external_results),
                'page': page,
                'per_page': per_page,
                'external_apis_used': True
            }
            
        except Exception as e:
            logging.error(f"Search failed: {str(e)}")
            return {
                'results': [],
                'total': 0,
                'page': page,
                'per_page': per_page,
                'external_apis_used': include_external
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
            
            return {
                'results': results or [],
                'total': total,
                'page': page,
                'per_page': per_page
            }
            
        except Exception as e:
            logging.error(f"Database search failed: {str(e)}")
            return {'results': [], 'total': 0}
    
    def get_publication_details(self, publication_id: str, source: str) -> Optional[Dict[str, Any]]:
        """
        Fetch detailed information about a specific publication
        """
        try:
            if source.startswith('external_'):
                # External API source
                external_source = source.split('_', 1)[1]
                return self.api.get_paper_details(external_source, publication_id)
            
            # Database source - determine the correct table
            table_mapping = {
                'bibliometric': 'bibliometric_data',
                'crossref': 'crossref_data_multiple_subjects',
                'google_scholar': 'google_scholar_data',
                'openalex': 'openalex_data',
                'scopus': 'scopus_data'
            }
            
            if source not in table_mapping:
                logging.error(f"Unknown source: {source}")
                return None
                
            query = f"SELECT * FROM {table_mapping[source]} WHERE id = %s"
            result = self.db.execute_query(query, (publication_id,))
            
            return result[0] if result else None
        
        except Exception as e:
            logging.error(f"Error fetching publication details: {str(e)}")
            return None