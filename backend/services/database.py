import psycopg2
from psycopg2 import sql
from psycopg2.extras import DictCursor
from config import Config

import time

class DatabaseService:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseService, cls).__new__(cls)
            cls._instance._init_db_connection()
        return cls._instance
    
    def _init_db_connection(self):
        try:
            self.conn = psycopg2.connect(
                host=Config.DB_HOST,
                port=Config.DB_PORT,
                dbname=Config.DB_NAME,
                user=Config.DB_USER,
                password=Config.DB_PASSWORD
            )
            self.conn.autocommit = True
        except psycopg2.Error as e:
            print(f"Error connecting to database: {e}")
            self.conn = None
    
    def reconnect(self):
        try:
            if hasattr(self, 'conn') and self.conn:
                self.conn.close()
        except:
            pass
        self._init_db_connection()
    
    def execute_query(self, query, params=None, fetch=True):
        max_retries = 3
        for attempt in range(max_retries):
            try:
                if not hasattr(self, 'conn') or not self.conn:
                    self.reconnect()
                    if not self.conn:
                        raise Exception("Database connection failed")
                
                with self.conn.cursor(cursor_factory=DictCursor) as cursor:
                    cursor.execute(query, params or ())
                    if fetch:
                        return cursor.fetchall()
                    return None
            except psycopg2.InterfaceError as e:
                if attempt == max_retries - 1:
                    raise e
                self.reconnect()
                time.sleep(1)
            except psycopg2.Error as e:
                print(f"Database error: {e}")
                raise e
    
    def search_across_sources(self, query, page=1, per_page=10, filters=None):
        if filters is None:
            filters = {}
        
        offset = (page - 1) * per_page
        
        # Base query with proper column names for your schema
        base_query = """
            (SELECT id, author, title, doi, year, NULL AS citations, 'bibliometric' AS source
            FROM cleaned_bibliometric_data
            WHERE to_tsvector('english', title) @@ plainto_tsquery('english', %(query)s))
            
            UNION ALL
            
            (SELECT id, authors AS author, title, doi, year, citation_count AS citations, 'crossref' AS source
            FROM crossref_data_multiple_subjects
            WHERE to_tsvector('english', title) @@ plainto_tsquery('english', %(query)s))
            
            UNION ALL
            
            (SELECT id, author_name AS author, title, NULL AS doi, year, cited_by AS citations, 'google_scholar' AS source
            FROM google_scholar_data
            WHERE to_tsvector('english', title) @@ plainto_tsquery('english', %(query)s))
            
            UNION ALL
            
            (SELECT id, NULL AS author, title, doi, year, citations, 'openalex' AS source
            FROM openalex_data
            WHERE to_tsvector('english', title) @@ plainto_tsquery('english', %(query)s))
        """
        
        # Apply filters
        where_clauses = []
        params = {'query': query}
        
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
            where_clauses.append("citations >= %(min_citations)s")
            params['min_citations'] = filters['min_citations']
        
        try:
            # Build final query with proper grouping
            final_query = f"""
                SELECT * FROM (
                    {base_query}
                ) AS combined_results
                {'WHERE ' + ' AND '.join(where_clauses) if where_clauses else ''}
                ORDER BY citations DESC NULLS LAST
                LIMIT %(limit)s OFFSET %(offset)s
            """
            
            params['limit'] = per_page
            params['offset'] = offset
            
            # Get count
            count_query = f"""
                SELECT COUNT(*) FROM (
                    {base_query}
                ) AS combined_results
                {'WHERE ' + ' AND '.join(where_clauses) if where_clauses else ''}
            """
            
            # Get total count
            total = self.execute_query(count_query, params)[0][0]
            
            # Get paginated results
            results = self.execute_query(final_query, params)
            
            # Format results
            formatted_results = []
            for row in results:
                formatted_results.append({
                    'id': row['id'],
                    'title': row['title'],
                    'author': row['author'] if row['author'] else 'Unknown',
                    'year': row['year'],
                    'citation_count': row['citations'] if row['citations'] else 0,
                    'source': row['source'],
                    'doi': row['doi'],
                    'published': str(row['year']) if row['year'] else None,
                    'identifiers': row['doi'] if row['doi'] else row['id']
                })
            
            return {
                'results': formatted_results,
                'total': total
            }
        except Exception as e:
            print(f"Error in search_across_sources: {e}")
            return {
                'results': [],
                'total': 0
            }

# Keep all existing utility functions unchanged
def fetch_all(table_name):
    """Fetches all rows from a given table."""
    db = DatabaseService()
    query = sql.SQL("SELECT * FROM {}").format(sql.Identifier(table_name))
    return db.execute_query(query)

def fetch_filtered(table_name, filters=None):
    """Fetches filtered data from a table based on provided filters."""
    if filters is None:
        return fetch_all(table_name)
    
    db = DatabaseService()
    where_clauses = []
    params = {}
    
    for field, value in filters.items():
        if value is not None:
            where_clauses.append(sql.SQL("{} = %s").format(sql.Identifier(field)))
            params[field] = value
    
    if not where_clauses:
        return fetch_all(table_name)
    
    query = sql.SQL("SELECT * FROM {} WHERE {}").format(
        sql.Identifier(table_name),
        sql.SQL(" AND ").join(where_clauses)
    )
    
    return db.execute_query(query, list(params.values()))