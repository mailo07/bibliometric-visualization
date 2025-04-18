import psycopg2
from psycopg2 import sql, OperationalError
from psycopg2.extras import DictCursor
from config import Config
import logging
import time
from typing import Optional, List, Dict, Any

class DatabaseService:
    _instance = None
    MAX_RETRIES = 3
    RETRY_DELAY = 1
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseService, cls).__new__(cls)
            cls._instance._init_db_connection()
        return cls._instance
    
    def _init_db_connection(self):
        """Initialize database connection with retries"""
        for attempt in range(self.MAX_RETRIES):
            try:
                self.conn = psycopg2.connect(
                    host=Config.DB_HOST,
                    port=Config.DB_PORT,
                    dbname="bibliometric_data",
                    user="postgres",
                    password="vivo18#",
                    connect_timeout=5
                )
                self.conn.autocommit = True
                
                # Verify connection
                with self.conn.cursor() as cursor:
                    cursor.execute("SELECT 1")
                
                logging.info("✅ Database connection established")
                return
                
            except OperationalError as e:
                logging.error(f"⚠️ Connection attempt {attempt + 1} failed: {str(e)}")
                if attempt < self.MAX_RETRIES - 1:
                    time.sleep(self.RETRY_DELAY * (attempt + 1))
                    continue
                raise RuntimeError(f"Failed to connect to database after {self.MAX_RETRIES} attempts")
    
    def execute_query(self, query, params=None, fetch=True) -> Optional[List[Dict[str, Any]]]:
        """Execute a query with automatic reconnection and error handling"""
        for attempt in range(self.MAX_RETRIES):
            try:
                if not self.conn or self.conn.closed:
                    self._init_db_connection()
                
                with self.conn.cursor(cursor_factory=DictCursor) as cursor:
                    logging.debug(f"Executing: {cursor.mogrify(query, params)}")
                    cursor.execute(query, params or ())
                    
                    if fetch:
                        results = cursor.fetchall()
                        logging.debug(f"Found {len(results)} rows")
                        return [dict(row) for row in results]
                    return None
                    
            except psycopg2.InterfaceError as e:
                logging.error(f"Connection error (attempt {attempt + 1}): {str(e)}")
                if attempt == self.MAX_RETRIES - 1:
                    raise
                self._init_db_connection()
                time.sleep(self.RETRY_DELAY)
            except psycopg2.Error as e:
                logging.error(f"Query failed: {str(e)}")
                raise
    
    def search_across_sources(self, query: str, page: int = 1, per_page: int = 10, 
                            filters: Optional[Dict] = None) -> Dict[str, Any]:
        """Search across all bibliometric sources with proper pagination"""
        if not query or not query.strip():
            return {'results': [], 'total': 0}
        
        filters = filters or {}
        offset = (page - 1) * per_page
        
        # Base query matching your actual schema
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
        
        # Apply filters
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
            results = self.execute_query(
                base_query.format(filter_clause=filter_clause),
                params
            ) or []
            
            # Get total count (separate query for accurate pagination)
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
            
            total = self.execute_query(
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
            logging.error(f"Search failed: {str(e)}")
            return {'results': [], 'total': 0}
    
    def fetch_by_id(self, table_name: str, id_value: Any, id_column: str = "id") -> Optional[Dict[str, Any]]:
        """Fetch a single record by ID"""
        try:
            query = sql.SQL("SELECT * FROM {} WHERE {} = %s").format(
                sql.Identifier(table_name),
                sql.Identifier(id_column)
            )
            result = self.execute_query(query, (id_value,))
            return result[0] if result else None
        except Exception as e:
            logging.error(f"Error fetching by ID: {str(e)}")
            return None