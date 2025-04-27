import psycopg2
from psycopg2 import OperationalError
from psycopg2.extras import DictCursor
from config import Config
import logging
import time
from typing import Optional, List, Dict, Any

class DatabaseService:
    """
    Core database service that handles connection management and query execution.
    Implemented as a singleton to maintain a single connection pool.
    """
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
        """
        Execute a query with automatic reconnection and error handling
        
        Args:
            query: SQL query to execute (can be string or psycopg2.sql.Composed)
            params: Parameters for the query
            fetch: Whether to fetch and return results
            
        Returns:
            List of dictionaries containing query results, or None if fetch=False
        """
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
    
    def begin_transaction(self):
        """Begin a database transaction"""
        if not self.conn or self.conn.closed:
            self._init_db_connection()
        
        # Temporarily disable autocommit to start a transaction
        old_autocommit = self.conn.autocommit
        self.conn.autocommit = False
        return old_autocommit
    
    def commit_transaction(self):
        """Commit the current transaction"""
        if self.conn and not self.conn.closed:
            self.conn.commit()
            self.conn.autocommit = True
    
    def rollback_transaction(self):
        """Rollback the current transaction"""
        if self.conn and not self.conn.closed:
            self.conn.rollback()
            self.conn.autocommit = True
    
    def execute_transaction(self, queries):
        """
        Execute multiple queries in a single transaction
        
        Args:
            queries: List of (query, params) tuples
            
        Returns:
            True if successful, False otherwise
        """
        try:
            old_autocommit = self.begin_transaction()
            
            for query, params in queries:
                self.execute_query(query, params, fetch=False)
                
            self.commit_transaction()
            return True
            
        except Exception as e:
            self.rollback_transaction()
            logging.error(f"Transaction failed: {str(e)}")
            return False
        finally:
            # Restore previous autocommit setting
            if self.conn and not self.conn.closed:
                self.conn.autocommit = old_autocommit