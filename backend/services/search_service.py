from psycopg2 import sql
from services.database import DatabaseService
from typing import Dict, Any, Optional, List

class SearchService:
    """Service for handling search-related database operations"""
    
    def __init__(self):
        self.db = DatabaseService()
    
    def search_publications(self, query: str, page: int = 1, per_page: int = 10, 
                           filters: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Search across all bibliometric sources with pagination and filtering
        
        Args:
            query: Search text
            page: Page number (starting from 1)
            per_page: Number of results per page
            filters: Optional dictionary of filters to apply
                    Supported filters: year_from, year_to, source, min_citations
                    
        Returns:
            Dictionary with results, pagination info, and total count
        """
        if not query or not query.strip():
            return {'results': [], 'total': 0, 'page': page, 'per_page': per_page}
        
        filters = filters or {}
        offset = (page - 1) * per_page
        
        # Base query for unified search across all sources
        base_query = """
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
            {filter_clause}
            ORDER BY year DESC NULLS LAST
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
            {filter_clause}
            ORDER BY citation_count DESC NULLS LAST
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
            {filter_clause}
            ORDER BY cited_by DESC NULLS LAST
            LIMIT %(limit)s OFFSET %(offset)s)
        """
        
        params = {
            'query': query,
            'limit': per_page,
            'offset': offset
        }
        
        # Build filter clauses
        where_clauses = []
        if filters.get('year_from'):
            where_clauses.append("year >= %(year_from)s")
            params['year_from'] = filters['year_from']
        if filters.get('year_to'):
            where_clauses.append("year <= %(year_to)s")
            params['year_to'] = filters['year_to']
        if filters.get('source'):
            where_clauses.append("source = %(source)s")
            params['source'] = filters['source']
        if filters.get('min_citations'):
            where_clauses.append("(citations >= %(min_citations)s OR citation_count >= %(min_citations)s OR cited_by >= %(min_citations)s)")
            params['min_citations'] = filters['min_citations']
        
        filter_clause = ' AND '.join(where_clauses)
        filter_clause = f"AND {filter_clause}" if filter_clause else ""
        
        try:
            # Get paginated results
            results = self.db.execute_query(
                base_query.format(filter_clause=filter_clause),
                params
            ) or []
            
            # Get total count for accurate pagination
            count_query = """
                SELECT COUNT(*) FROM (
                    SELECT 1 FROM bibliometric_data
                    WHERE to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(author_name, '')) 
                          @@ plainto_tsquery('english', %(query)s)
                    {filter_clause}
                    
                    UNION ALL
                    
                    SELECT 1 FROM crossref_data_multiple_subjects
                    WHERE to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(authors, '')) 
                          @@ plainto_tsquery('english', %(query)s)
                    {filter_clause}
                    
                    UNION ALL
                    
                    SELECT 1 FROM google_scholar_data
                    WHERE to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(author_name, '')) 
                          @@ plainto_tsquery('english', %(query)s)
                    {filter_clause}
                ) AS combined_results
            """
            
            total = self.db.execute_query(
                count_query.format(filter_clause=filter_clause),
                {'query': query, **{k: v for k, v in params.items() 
                                  if k in ['year_from', 'year_to', 'source', 'min_citations']}}
            )[0]['count']
            
            return {
                'results': results,
                'total': total,
                'page': page,
                'per_page': per_page
            }
            
        except Exception as e:
            import logging
            logging.error(f"Search failed: {str(e)}")
            return {'results': [], 'total': 0, 'page': page, 'per_page': per_page}
    
    def get_publication_details(self, publication_id: str, source: str) -> Optional[Dict[str, Any]]:
        """
        Fetch detailed information about a specific publication
        
        Args:
            publication_id: The ID of the publication
            source: Source database ('bibliometric', 'crossref', or 'google_scholar')
            
        Returns:
            Publication details or None if not found
        """
        table_mapping = {
            'bibliometric': 'bibliometric_data',
            'crossref': 'crossref_data_multiple_subjects',
            'google_scholar': 'google_scholar_data'
        }
        
        if source not in table_mapping:
            return None
            
        try:
            query = sql.SQL("SELECT * FROM {} WHERE id = %s").format(
                sql.Identifier(table_mapping[source])
            )
            result = self.db.execute_query(query, (publication_id,))
            return result[0] if result else None
        except Exception as e:
            import logging
            logging.error(f"Error fetching publication details: {str(e)}")
            return None
            
    def get_citation_trends(self, publication_id: str, source: str) -> List[Dict[str, Any]]:
        """
        Get citation trends over time for a specific publication
        
        Args:
            publication_id: The ID of the publication
            source: Source database ('bibliometric', 'crossref', or 'google_scholar')
            
        Returns:
            List of citation counts by year
        """
        # This would need to be implemented based on your actual data schema
        # For now, returning a placeholder implementation
        return []