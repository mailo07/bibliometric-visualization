# tools/db_monitor.py

import logging
import psycopg2
from psycopg2.extras import RealDictCursor
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_database_tables():
    """
    Check all database tables and print stats
    """
    connection_string = os.getenv("DATABASE_URL")
    
    try:
        conn = psycopg2.connect(connection_string)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get list of tables
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        
        tables = cursor.fetchall()
        logger.info(f"Found {len(tables)} tables in database")
        
        for table in tables:
            table_name = table['table_name']
            
            # Get row count
            cursor.execute(f"SELECT COUNT(*) as count FROM {table_name}")
            count = cursor.fetchone()['count']
            
            # Get column names
            cursor.execute(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = '{table_name}'
            """)
            columns = [col['column_name'] for col in cursor.fetchall()]
            
            logger.info(f"Table: {table_name}, Rows: {count}, Columns: {', '.join(columns)}")
            
            # Sample data
            if count > 0:
                cursor.execute(f"SELECT * FROM {table_name} LIMIT 1")
                sample = cursor.fetchone()
                logger.info(f"Sample data: {sample}")
                
        # Test specific queries
        test_query = "Computer Science"
        logger.info(f"Testing search query: '{test_query}'")
        
        # Test openalex table
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM openalex 
            WHERE title ILIKE %s OR author ILIKE %s OR journal ILIKE %s
        """, (f"%{test_query}%", f"%{test_query}%", f"%{test_query}%"))
        count = cursor.fetchone()['count']
        logger.info(f"OpenAlex search results: {count}")
        
        # Test crossref table
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM crossref_data_multiple_subjects 
            WHERE title ILIKE %s OR author ILIKE %s OR publisher ILIKE %s OR subjects ILIKE %s
        """, (f"%{test_query}%", f"%{test_query}%", f"%{test_query}%", f"%{test_query}%"))
        count = cursor.fetchone()['count']
        logger.info(f"Crossref search results: {count}")
        
    except Exception as e:
        logger.error(f"Database check failed: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    check_database_tables()