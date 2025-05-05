# services/database.py
import logging
from contextlib import contextmanager
import psycopg2
from psycopg2.extras import RealDictCursor
from config import Config

class DatabaseService:
    def __init__(self):
        # Use individual connection parameters instead of a connection string
        self.db_host = Config.DB_HOST
        self.db_port = Config.DB_PORT
        self.db_name = Config.DB_NAME
        self.db_user = Config.DB_USER
        self.db_password = Config.DB_PASSWORD
        
    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        conn = None
        try:
            # Connect using individual parameters
            conn = psycopg2.connect(
                host=self.db_host,
                port=self.db_port,
                dbname=self.db_name,
                user=self.db_user,
                password=self.db_password,
                connect_timeout=Config.DB_CONNECT_TIMEOUT
            )
            yield conn
        except Exception as e:
            logging.error(f"Database connection error: {str(e)}")
            if conn:
                conn.rollback()
            raise
        finally:
            if conn:
                conn.close()
    
    def execute_query(self, query, params=None):
        """Execute a query and return results as dictionaries"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                cursor.execute(query, params)
                if query.strip().upper().startswith(('SELECT', 'WITH')):
                    results = cursor.fetchall()
                    return results
                else:
                    conn.commit()
                    return True
        except Exception as e:
            logging.error(f"Database query error: {str(e)}")
            logging.error(f"Failed query: {query}")
            if params:
                logging.error(f"Query parameters: {params}")
            raise
    
    def search_publications(self, query, page=1, per_page=20, filters=None):
        """
        Search across all database tables with properly aliased columns
        """
        if not query:
            return []
        
        results = []
        offset = (page - 1) * per_page
        
        # Calculate per_page for each table to get balanced results
        table_count = 6  # Number of tables we're searching
        individual_table_limit = max(per_page // table_count, 10)
        
        logging.info(f"Searching for '{query}' with page={page}, per_page={per_page}, individual_table_limit={individual_table_limit}")
        
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                
                # Search openalex_data table
                openalex_results = self._search_openalex(cursor, query, filters, individual_table_limit)
                logging.info(f"Found {len(openalex_results)} results from openalex_data")
                results.extend(openalex_results)
                
                # Search crossref_data_multiple_subjects table
                crossref_results = self._search_crossref(cursor, query, filters, individual_table_limit)
                logging.info(f"Found {len(crossref_results)} results from crossref_data_multiple_subjects")
                results.extend(crossref_results)
                
                # Search bibliometric_data table
                bibliometric_results = self._search_bibliometric(cursor, query, filters, individual_table_limit)
                logging.info(f"Found {len(bibliometric_results)} results from bibliometric_data")
                results.extend(bibliometric_results)
                
                # Search google_scholar_data table
                google_scholar_results = self._search_google_scholar(cursor, query, filters, individual_table_limit)
                logging.info(f"Found {len(google_scholar_results)} results from google_scholar_data")
                results.extend(google_scholar_results)
                
                # Search cleaned_bibliometric_data table
                cleaned_results = self._search_cleaned(cursor, query, filters, individual_table_limit)
                logging.info(f"Found {len(cleaned_results)} results from cleaned_bibliometric_data")
                results.extend(cleaned_results)
                
                # Search scopus tables
                scopus_results = self._search_scopus(cursor, query, filters, individual_table_limit)
                logging.info(f"Found {len(scopus_results)} results from scopus")
                results.extend(scopus_results)
                
                # Try external_api_data table if it exists
                try:
                    external_api_results = self._search_external_api_data(cursor, query, filters, individual_table_limit)
                    logging.info(f"Found {len(external_api_results)} results from external_api_data")
                    results.extend(external_api_results)
                except Exception as e:
                    logging.warning(f"Error searching external_api_data table: {str(e)}")
                
                # Sort and paginate the combined results manually
                # Sort by citations
                results.sort(key=lambda x: int(x.get('citations', 0) or 0), reverse=True)
                
                # Apply pagination
                total_results = len(results)
                results = results[offset:offset + per_page]
                
                logging.info(f"Returning {len(results)} results (total: {total_results})")
                return results, total_results
                
        except Exception as e:
            logging.error(f"Database search error: {str(e)}")
            return [], 0
    
    def _search_openalex(self, cursor, query, filters, limit):
        """Search in the openalex_data table"""
        try:
            exact_phrase = f"%{query}%"
            params = [exact_phrase, exact_phrase, exact_phrase, limit]
            
            # Build additional filter conditions
            filter_conditions = []
            if filters:
                if filters.get('year_from'):
                    filter_conditions.append(f"CAST(year AS INTEGER) >= {int(filters['year_from'])}")
                if filters.get('year_to'):
                    filter_conditions.append(f"CAST(year AS INTEGER) <= {int(filters['year_to'])}")
                if filters.get('min_citations'):
                    filter_conditions.append(f"citations >= {int(filters['min_citations'])}")
                if filters.get('authorFilter'):
                    filter_conditions.append(f"author ILIKE '%{filters['authorFilter']}%'")
                if filters.get('titleFilter'):
                    filter_conditions.append(f"title ILIKE '%{filters['titleFilter']}%'")
                if filters.get('journalFilter'):
                    filter_conditions.append(f"journal ILIKE '%{filters['journalFilter']}%'")
            
            # Combine filter conditions into SQL
            additional_filters = ""
            if filter_conditions:
                additional_filters = "AND " + " AND ".join(filter_conditions)
            
            query_sql = f"""
                SELECT 
                    id, 
                    title, 
                    author, 
                    year as published, 
                    journal, 
                    COALESCE(citations, 0) as citations, 
                    'openalex_data' as source,
                    doi,
                    subject
                FROM openalex_data
                WHERE 
                    (
                        title ILIKE %s 
                        OR author ILIKE %s 
                        OR subject ILIKE %s
                    )
                    {additional_filters}
                ORDER BY citations DESC NULLS LAST
                LIMIT %s
            """
            
            cursor.execute(query_sql, params)
            return cursor.fetchall()
        except Exception as e:
            logging.error(f"OpenAlex search error: {str(e)}")
            return []
    
    def _search_crossref(self, cursor, query, filters, limit):
        """Search in the crossref_data_multiple_subjects table"""
        try:
            exact_phrase = f"%{query}%"
            params = [exact_phrase, exact_phrase, exact_phrase, limit]
            
            # Build additional filter conditions
            filter_conditions = []
            if filters:
                if filters.get('year_from'):
                    filter_conditions.append(f"CAST(year AS INTEGER) >= {int(filters['year_from'])}")
                if filters.get('year_to'):
                    filter_conditions.append(f"CAST(year AS INTEGER) <= {int(filters['year_to'])}")
                if filters.get('min_citations'):
                    filter_conditions.append(f"citation_count >= {int(filters['min_citations'])}")
                if filters.get('authorFilter'):
                    filter_conditions.append(f"authors ILIKE '%{filters['authorFilter']}%'")
                if filters.get('titleFilter'):
                    filter_conditions.append(f"title ILIKE '%{filters['titleFilter']}%'")
                if filters.get('journalFilter'):
                    filter_conditions.append(f"subject ILIKE '%{filters['journalFilter']}%'")
            
            # Combine filter conditions into SQL
            additional_filters = ""
            if filter_conditions:
                additional_filters = "AND " + " AND ".join(filter_conditions)
            
            query_sql = f"""
                SELECT 
                    id, 
                    title, 
                    authors as author, 
                    year as published, 
                    subject as journal, 
                    COALESCE(citation_count, 0) as citations, 
                    'crossref_data_multiple_subjects' as source,
                    doi,
                    subject
                FROM crossref_data_multiple_subjects
                WHERE 
                    (
                        title ILIKE %s 
                        OR authors ILIKE %s 
                        OR subject ILIKE %s
                    )
                    {additional_filters}
                ORDER BY citation_count DESC NULLS LAST
                LIMIT %s
            """
            
            cursor.execute(query_sql, params)
            return cursor.fetchall()
        except Exception as e:
            logging.error(f"Crossref search error: {str(e)}")
            return []
    
    def _search_bibliometric(self, cursor, query, filters, limit):
        """Search in the bibliometric_data table"""
        try:
            exact_phrase = f"%{query}%"
            params = [exact_phrase, exact_phrase, exact_phrase, limit]
            
            # Build additional filter conditions
            filter_conditions = []
            if filters:
                if filters.get('year_from'):
                    filter_conditions.append(f"CAST(year AS INTEGER) >= {int(filters['year_from'])}")
                if filters.get('year_to'):
                    filter_conditions.append(f"CAST(year AS INTEGER) <= {int(filters['year_to'])}")
                if filters.get('min_citations'):
                    filter_conditions.append(f"cited_by >= {int(filters['min_citations'])}")
                if filters.get('authorFilter'):
                    filter_conditions.append(f"author_name ILIKE '%{filters['authorFilter']}%'")
                if filters.get('titleFilter'):
                    filter_conditions.append(f"title ILIKE '%{filters['titleFilter']}%'")
                if filters.get('journalFilter'):
                    filter_conditions.append(f"subject ILIKE '%{filters['journalFilter']}%'")
            
            # Combine filter conditions into SQL
            additional_filters = ""
            if filter_conditions:
                additional_filters = "AND " + " AND ".join(filter_conditions)
            
            query_sql = f"""
                SELECT 
                    id, 
                    title, 
                    author_name as author, 
                    year as published, 
                    subject as journal, 
                    COALESCE(cited_by, 0) as citations, 
                    'bibliometric_data' as source,
                    doi,
                    subject
                FROM bibliometric_data
                WHERE 
                    (
                        title ILIKE %s 
                        OR author_name ILIKE %s 
                        OR subject ILIKE %s
                    )
                    {additional_filters}
                ORDER BY cited_by DESC NULLS LAST
                LIMIT %s
            """
            
            cursor.execute(query_sql, params)
            return cursor.fetchall()
        except Exception as e:
            logging.error(f"Bibliometric search error: {str(e)}")
            return []
    
    def _search_google_scholar(self, cursor, query, filters, limit):
        """Search in the google_scholar_data table"""
        try:
            exact_phrase = f"%{query}%"
            params = [exact_phrase, exact_phrase, exact_phrase, limit]
            
            # Build additional filter conditions
            filter_conditions = []
            if filters:
                if filters.get('year_from'):
                    filter_conditions.append(f"CAST(year AS INTEGER) >= {int(filters['year_from'])}")
                if filters.get('year_to'):
                    filter_conditions.append(f"CAST(year AS INTEGER) <= {int(filters['year_to'])}")
                if filters.get('min_citations'):
                    filter_conditions.append(f"cited_by >= {int(filters['min_citations'])}")
                if filters.get('authorFilter'):
                    filter_conditions.append(f"author_name ILIKE '%{filters['authorFilter']}%'")
                if filters.get('titleFilter'):
                    filter_conditions.append(f"title ILIKE '%{filters['titleFilter']}%'")
                if filters.get('journalFilter'):
                    filter_conditions.append(f"subject_of_study ILIKE '%{filters['journalFilter']}%'")
            
            # Combine filter conditions into SQL
            additional_filters = ""
            if filter_conditions:
                additional_filters = "AND " + " AND ".join(filter_conditions)
            
            query_sql = f"""
                SELECT 
                    id, 
                    title, 
                    author_name as author, 
                    year as published, 
                    subject_of_study as journal, 
                    COALESCE(cited_by, 0) as citations, 
                    'google_scholar_data' as source,
                    '' as doi,
                    subject_of_study as subject
                FROM google_scholar_data
                WHERE 
                    (
                        title ILIKE %s 
                        OR author_name ILIKE %s 
                        OR subject_of_study ILIKE %s
                    )
                    {additional_filters}
                ORDER BY cited_by DESC NULLS LAST
                LIMIT %s
            """
            
            cursor.execute(query_sql, params)
            return cursor.fetchall()
        except Exception as e:
            logging.error(f"Google Scholar search error: {str(e)}")
            return []
    
    def _search_cleaned(self, cursor, query, filters, limit):
        """Search in the cleaned_bibliometric_data table"""
        try:
            exact_phrase = f"%{query}%"
            params = [exact_phrase, exact_phrase, limit]
            
            # Build additional filter conditions
            filter_conditions = []
            if filters:
                if filters.get('year_from'):
                    filter_conditions.append(f"CAST(year AS INTEGER) >= {int(filters['year_from'])}")
                if filters.get('year_to'):
                    filter_conditions.append(f"CAST(year AS INTEGER) <= {int(filters['year_to'])}")
                if filters.get('authorFilter'):
                    filter_conditions.append(f"author ILIKE '%{filters['authorFilter']}%'")
                if filters.get('titleFilter'):
                    filter_conditions.append(f"title ILIKE '%{filters['titleFilter']}%'")
            
            # Combine filter conditions into SQL
            additional_filters = ""
            if filter_conditions:
                additional_filters = "AND " + " AND ".join(filter_conditions)
            
            query_sql = f"""
                SELECT 
                    id, 
                    title, 
                    author, 
                    year as published, 
                    'Journal' as journal, 
                    0 as citations, 
                    'cleaned_bibliometric_data' as source,
                    doi,
                    '' as subject
                FROM cleaned_bibliometric_data
                WHERE 
                    (
                        title ILIKE %s 
                        OR author ILIKE %s
                    )
                    {additional_filters}
                LIMIT %s
            """
            
            cursor.execute(query_sql, params)
            return cursor.fetchall()
        except Exception as e:
            logging.error(f"Cleaned bibliometric search error: {str(e)}")
            return []
    
    def _search_scopus(self, cursor, query, filters, limit):
        """Search in the scopus_data table"""
        try:
            exact_phrase = f"%{query}%"
            params = [exact_phrase, exact_phrase, exact_phrase, limit,
                      exact_phrase, exact_phrase, exact_phrase, limit]
            
            # Build additional filter conditions
            filter_conditions = []
            if filters:
                if filters.get('year_from'):
                    filter_conditions.append(f"CAST(publication_year AS INTEGER) >= {int(filters['year_from'])}")
                if filters.get('year_to'):
                    filter_conditions.append(f"CAST(publication_year AS INTEGER) <= {int(filters['year_to'])}")
                if filters.get('authorFilter'):
                    filter_conditions.append(f"publisher ILIKE '%{filters['authorFilter']}%'")
                if filters.get('titleFilter'):
                    filter_conditions.append(f"book_title ILIKE '%{filters['titleFilter']}%'")
                if filters.get('journalFilter'):
                    filter_conditions.append(f"publisher ILIKE '%{filters['journalFilter']}%'")
            
            # Combine filter conditions into SQL
            additional_filters = ""
            if filter_conditions:
                additional_filters = "AND " + " AND ".join(filter_conditions)
            
            query_sql = f"""
                (SELECT 
                    id, 
                    book_title as title, 
                    publisher as author, 
                    publication_year as published, 
                    publisher as journal, 
                    0 as citations, 
                    'scopus_data' as source,
                    '' as doi,
                    asjc as subject
                FROM scopus_data
                WHERE 
                    (
                        book_title ILIKE %s 
                        OR publisher ILIKE %s 
                        OR asjc ILIKE %s
                    )
                    {additional_filters}
                LIMIT %s)
                
                UNION ALL
                
                (SELECT 
                    id, 
                    book_title as title, 
                    publisher as author, 
                    publication_year as published, 
                    publisher as journal, 
                    0 as citations, 
                    'scopus_data_sept' as source,
                    '' as doi,
                    asjc as subject
                FROM scopus_data_sept
                WHERE 
                    (
                        book_title ILIKE %s 
                        OR publisher ILIKE %s 
                        OR asjc ILIKE %s
                    )
                    {additional_filters}
                LIMIT %s)
            """
            
            cursor.execute(query_sql, params)
            return cursor.fetchall()
        except Exception as e:
            logging.error(f"Scopus search error: {str(e)}")
            return []
    
    def _search_external_api_data(self, cursor, query, filters, limit):
        """Search in the external_api_data table if it exists"""
        try:
            # First check if the table exists
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'external_api_data'
                )
            """)
            
            table_exists = cursor.fetchone()['exists']
            if not table_exists:
                logging.info("external_api_data table does not exist")
                return []
            
            exact_phrase = f"%{query}%"
            params = [exact_phrase, exact_phrase, exact_phrase, limit]
            
            # Build additional filter conditions
            filter_conditions = []
            if filters:
                if filters.get('year_from'):
                    filter_conditions.append(f"CAST(year AS INTEGER) >= {int(filters['year_from'])}")
                if filters.get('year_to'):
                    filter_conditions.append(f"CAST(year AS INTEGER) <= {int(filters['year_to'])}")
                if filters.get('min_citations'):
                    filter_conditions.append(f"citations >= {int(filters['min_citations'])}")
                if filters.get('authorFilter'):
                    filter_conditions.append(f"authors ILIKE '%{filters['authorFilter']}%'")
                if filters.get('titleFilter'):
                    filter_conditions.append(f"title ILIKE '%{filters['titleFilter']}%'")
                if filters.get('journalFilter'):
                    filter_conditions.append(f"journal ILIKE '%{filters['journalFilter']}%'")
            
            # Combine filter conditions into SQL
            additional_filters = ""
            if filter_conditions:
                additional_filters = "AND " + " AND ".join(filter_conditions)
            
            query_sql = f"""
                SELECT 
                    external_id as id, 
                    title, 
                    authors as author, 
                    year as published, 
                    journal, 
                    COALESCE(citations, 0) as citations, 
                    'external_' || source as source,
                    doi,
                    '' as subject
                FROM external_api_data
                WHERE 
                    (
                        title ILIKE %s 
                        OR authors ILIKE %s 
                        OR doi ILIKE %s
                    )
                    {additional_filters}
                ORDER BY citations DESC NULLS LAST
                LIMIT %s
            """
            
            cursor.execute(query_sql, params)
            return cursor.fetchall()
        except Exception as e:
            logging.error(f"External API data search error: {str(e)}")
            return []
            
    def get_publication_by_id(self, paper_id, source=None):
        """
        Get a publication by ID, searching across all available tables
        """
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                
                # Try different tables based on source
                if not source or source.lower() in ['openalex_data', 'openalex', 'all']:
                    cursor.execute("""
                        SELECT 
                            id, 
                            title, 
                            author, 
                            year as published, 
                            journal, 
                            citations,
                            doi,
                            subject,
                            'openalex_data' as source
                        FROM openalex_data
                        WHERE id = %s OR title = %s
                        LIMIT 1
                    """, (paper_id, paper_id))
                    
                    result = cursor.fetchone()
                    if result:
                        return dict(result)
                
                if not source or source.lower() in ['crossref_data_multiple_subjects', 'crossref', 'all']:
                    cursor.execute("""
                        SELECT 
                            id, 
                            title, 
                            authors as author, 
                            year as published, 
                            subject as journal, 
                            citation_count as citations,
                            doi,
                            subject,
                            'crossref_data_multiple_subjects' as source
                        FROM crossref_data_multiple_subjects
                        WHERE id = %s OR title = %s
                        LIMIT 1
                    """, (paper_id, paper_id))
                    
                    result = cursor.fetchone()
                    if result:
                        return dict(result)
                
                if not source or source.lower() in ['bibliometric_data', 'bibliometric', 'all']:
                    cursor.execute("""
                        SELECT 
                            id, 
                            title, 
                            author_name as author, 
                            year as published, 
                            subject as journal, 
                            cited_by as citations,
                            doi,
                            subject,
                            'bibliometric_data' as source
                        FROM bibliometric_data
                        WHERE id = %s OR title = %s
                        LIMIT 1
                    """, (paper_id, paper_id))
                    
                    result = cursor.fetchone()
                    if result:
                        return dict(result)
                
                if not source or source.lower() in ['google_scholar_data', 'google_scholar', 'all']:
                    cursor.execute("""
                        SELECT 
                            id, 
                            title, 
                            author_name as author, 
                            year as published, 
                            subject_of_study as journal, 
                            cited_by as citations,
                            '' as doi,
                            subject_of_study as subject,
                            'google_scholar_data' as source
                        FROM google_scholar_data
                        WHERE id = %s OR title = %s
                        LIMIT 1
                    """, (paper_id, paper_id))
                    
                    result = cursor.fetchone()
                    if result:
                        return dict(result)
                
                if not source or source.lower() in ['cleaned_bibliometric_data', 'cleaned', 'all']:
                    cursor.execute("""
                        SELECT 
                            id, 
                            title, 
                            author, 
                            year as published, 
                            'Journal' as journal, 
                            0 as citations,
                            doi,
                            '' as subject,
                            'cleaned_bibliometric_data' as source
                        FROM cleaned_bibliometric_data
                        WHERE id = %s OR title = %s
                        LIMIT 1
                    """, (paper_id, paper_id))
                    
                    result = cursor.fetchone()
                    if result:
                        return dict(result)
                
                if not source or source.lower() in ['scopus_data', 'scopus', 'all']:
                    cursor.execute("""
                        SELECT 
                            id, 
                            book_title as title, 
                            publisher as author, 
                            publication_year as published, 
                            publisher as journal, 
                            0 as citations,
                            '' as doi,
                            asjc as subject,
                            'scopus_data' as source
                        FROM scopus_data
                        WHERE id = %s OR book_title = %s
                        LIMIT 1
                    """, (paper_id, paper_id))
                    
                    result = cursor.fetchone()
                    if result:
                        return dict(result)
                
                if not source or source.lower() in ['scopus_data_sept', 'scopus_sept', 'all']:
                    cursor.execute("""
                        SELECT 
                            id, 
                            book_title as title, 
                            publisher as author, 
                            publication_year as published, 
                            publisher as journal, 
                            0 as citations,
                            '' as doi,
                            asjc as subject,
                            'scopus_data_sept' as source
                        FROM scopus_data_sept
                        WHERE id = %s OR book_title = %s
                        LIMIT 1
                    """, (paper_id, paper_id))
                    
                    result = cursor.fetchone()
                    if result:
                        return dict(result)
                
                # Try external_api_data table
                try:
                    if not source or "external" in str(source).lower() or source.lower() in ['all']:
                        cursor.execute("""
                            SELECT 
                                external_id as id, 
                                title, 
                                authors as author, 
                                year as published, 
                                journal, 
                                citations,
                                doi,
                                '' as subject,
                                'external_' || source as source
                            FROM external_api_data
                            WHERE external_id = %s OR title = %s
                            LIMIT 1
                        """, (paper_id, paper_id))
                        
                        result = cursor.fetchone()
                        if result:
                            return dict(result)
                except Exception as e:
                    logging.warning(f"Error searching external_api_data table: {str(e)}")
                
                return None
        except Exception as e:
            logging.error(f"Error getting publication by ID: {str(e)}")
            return None