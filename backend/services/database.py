# services/database_service.py
import logging
from contextlib import contextmanager
import psycopg2
from psycopg2.extras import RealDictCursor
from config import Config

class DatabaseService:
    def __init__(self):
        self.connection_string = Config.DATABASE_URL
    
    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        conn = None
        try:
            conn = psycopg2.connect(self.connection_string)
            yield conn
        except Exception as e:
            logging.error(f"Database connection error: {str(e)}")
            if conn:
                conn.rollback()
            raise
        finally:
            if conn:
                conn.close()
    
    def search_publications(self, query, page=1, per_page=20, filters=None):
        """
        Improved search across all database tables with better distribution
        """
        if not query:
            return []
        
        results = []
        offset = (page - 1) * per_page
        
        # Calculate per_page for each table to get balanced results
        # We'll query 3x more than needed to ensure we have enough from each source
        openalex_per_page = max(1, per_page // 3)
        crossref_per_page = max(1, per_page // 3)
        local_arxiv_per_page = max(1, per_page // 3)
        
        # Adjust if we want more total results
        openalex_per_page = min(50, openalex_per_page * 3)
        crossref_per_page = min(50, crossref_per_page * 3)
        local_arxiv_per_page = min(50, local_arxiv_per_page * 3)
        
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                
                # Search openalex table
                openalex_results = self._search_openalex(cursor, query, filters, openalex_per_page, offset)
                logging.info(f"Found {len(openalex_results)} results from openalex")
                results.extend(openalex_results)
                
                # Search crossref_data_multiple_subjects table
                crossref_results = self._search_crossref(cursor, query, filters, crossref_per_page, offset)
                logging.info(f"Found {len(crossref_results)} results from crossref")
                results.extend(crossref_results)
                
                # Search local arxiv table if it exists
                try:
                    arxiv_results = self._search_local_arxiv(cursor, query, filters, local_arxiv_per_page, offset)
                    logging.info(f"Found {len(arxiv_results)} results from local arxiv")
                    results.extend(arxiv_results)
                except Exception as e:
                    logging.warning(f"Error searching local arxiv table (it may not exist): {str(e)}")
                
                return results
                
        except Exception as e:
            logging.error(f"Database search error: {str(e)}")
            return []
    
    def _search_openalex(self, cursor, query, filters, per_page, offset):
        """Search in the openalex table"""
        try:
            # Build a more efficient search query with improved relevance ranking
            cursor.execute("""
                SELECT 
                    id, 
                    title, 
                    author, 
                    publication_year as published, 
                    journal, 
                    citation_count as citations, 
                    'openalex' as source
                FROM openalex
                WHERE 
                    (
                        title ILIKE %s 
                        OR author ILIKE %s 
                        OR journal ILIKE %s
                    )
                ORDER BY 
                    (CASE 
                        WHEN title ILIKE %s THEN 3
                        WHEN author ILIKE %s THEN 2
                        WHEN journal ILIKE %s THEN 1
                        ELSE 0
                    END) DESC,
                    citation_count DESC NULLS LAST
                LIMIT %s OFFSET %s
            """, (
                f"%{query}%", f"%{query}%", f"%{query}%", 
                f"%{query}%", f"%{query}%", f"%{query}%",
                per_page, offset
            ))
            
            return cursor.fetchall()
        except Exception as e:
            logging.error(f"OpenAlex search error: {str(e)}")
            return []
    
    def _search_crossref(self, cursor, query, filters, per_page, offset):
        """Search in the crossref_data_multiple_subjects table"""
        try:
            # Build a more efficient search query with improved relevance ranking
            cursor.execute("""
                SELECT 
                    id, 
                    title, 
                    author, 
                    published_date as published, 
                    publisher as journal, 
                    citation_count as citations, 
                    'crossref' as source
                FROM crossref_data_multiple_subjects
                WHERE 
                    (
                        title ILIKE %s 
                        OR author ILIKE %s 
                        OR publisher ILIKE %s 
                        OR subjects ILIKE %s
                    )
                ORDER BY 
                    (CASE 
                        WHEN title ILIKE %s THEN 4
                        WHEN subjects ILIKE %s THEN 3
                        WHEN author ILIKE %s THEN 2
                        WHEN publisher ILIKE %s THEN 1
                        ELSE 0
                    END) DESC,
                    citation_count DESC NULLS LAST
                LIMIT %s OFFSET %s
            """, (
                f"%{query}%", f"%{query}%", f"%{query}%", f"%{query}%",
                f"%{query}%", f"%{query}%", f"%{query}%", f"%{query}%",
                per_page, offset
            ))
            
            return cursor.fetchall()
        except Exception as e:
            logging.error(f"Crossref search error: {str(e)}")
            return []
    
    def _search_local_arxiv(self, cursor, query, filters, per_page, offset):
        """Search in the local arxiv table if it exists"""
        try:
            # First check if the table exists
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'arxiv_papers'
                )
            """)
            
            table_exists = cursor.fetchone()['exists']
            if not table_exists:
                logging.info("arxiv_papers table does not exist")
                return []
            
            # Build a search query for the arxiv_papers table
            cursor.execute("""
                SELECT 
                    id, 
                    title, 
                    authors as author, 
                    published_date as published, 
                    journal_ref as journal, 
                    0 as citations, 
                    'local_arxiv' as source
                FROM arxiv_papers
                WHERE 
                    title ILIKE %s 
                    OR authors ILIKE %s 
                    OR abstract ILIKE %s
                ORDER BY 
                    (CASE 
                        WHEN title ILIKE %s THEN 3
                        WHEN abstract ILIKE %s THEN 2
                        WHEN authors ILIKE %s THEN 1
                        ELSE 0
                    END) DESC
                LIMIT %s OFFSET %s
            """, (
                f"%{query}%", f"%{query}%", f"%{query}%",
                f"%{query}%", f"%{query}%", f"%{query}%",
                per_page, offset
            ))
            
            return cursor.fetchall()
        except Exception as e:
            logging.error(f"Local ArXiv search error: {str(e)}")
            return []
    
    def get_publication_by_id(self, paper_id, source=None):
        """
        Get a publication by ID, searching across all available tables
        """
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                
                # Try OpenAlex
                if not source or source.lower() in ['openalex', 'all']:
                    cursor.execute("""
                        SELECT 
                            id, 
                            title, 
                            author, 
                            publication_year as published, 
                            journal, 
                            citation_count as citations,
                            'openalex' as source
                        FROM openalex
                        WHERE id = %s OR title = %s
                        LIMIT 1
                    """, (paper_id, paper_id))
                    
                    result = cursor.fetchone()
                    if result:
                        return dict(result)
                
                # Try Crossref
                if not source or source.lower() in ['crossref', 'all']:
                    cursor.execute("""
                        SELECT 
                            id, 
                            title, 
                            author, 
                            published_date as published, 
                            publisher as journal, 
                            citation_count as citations,
                            subjects,
                            'crossref' as source
                        FROM crossref_data_multiple_subjects
                        WHERE id = %s OR title = %s
                        LIMIT 1
                    """, (paper_id, paper_id))
                    
                    result = cursor.fetchone()
                    if result:
                        return dict(result)
                
                # Try local ArXiv
                try:
                    if not source or source.lower() in ['arxiv', 'local_arxiv', 'all']:
                        cursor.execute("""
                            SELECT 
                                id, 
                                title, 
                                authors as author, 
                                published_date as published, 
                                journal_ref as journal, 
                                abstract,
                                0 as citations,
                                'local_arxiv' as source
                            FROM arxiv_papers
                            WHERE id = %s OR title = %s
                            LIMIT 1
                        """, (paper_id, paper_id))
                        
                        result = cursor.fetchone()
                        if result:
                            return dict(result)
                except Exception as e:
                    logging.warning(f"Error searching arxiv_papers table: {str(e)}")
                
                return None
        except Exception as e:
            logging.error(f"Error getting publication by ID: {str(e)}")
            return None