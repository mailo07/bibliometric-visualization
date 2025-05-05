# tools/optimize_db.py

import logging
import psycopg2
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def optimize_database():
    """
    Create indexes to optimize database search performance
    """
    connection_string = os.getenv("DATABASE_URL")
    
    try:
        conn = psycopg2.connect(connection_string)
        cursor = conn.cursor()
        
        logger.info("Creating indexes for better search performance...")
        
        # OpenAlex table indexes
        logger.info("Creating indexes for OpenAlex table...")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_openalex_title ON openalex USING gin(title gin_trgm_ops);
            CREATE INDEX IF NOT EXISTS idx_openalex_author ON openalex USING gin(author gin_trgm_ops);
            CREATE INDEX IF NOT EXISTS idx_openalex_journal ON openalex USING gin(journal gin_trgm_ops);
            CREATE INDEX IF NOT EXISTS idx_openalex_citation_count ON openalex(citation_count);
        """)
        
        # Crossref table indexes
        logger.info("Creating indexes for Crossref table...")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_crossref_title ON crossref_data_multiple_subjects USING gin(title gin_trgm_ops);
            CREATE INDEX IF NOT EXISTS idx_crossref_author ON crossref_data_multiple_subjects USING gin(author gin_trgm_ops);
            CREATE INDEX IF NOT EXISTS idx_crossref_publisher ON crossref_data_multiple_subjects USING gin(publisher gin_trgm_ops);
            CREATE INDEX IF NOT EXISTS idx_crossref_subjects ON crossref_data_multiple_subjects USING gin(subjects gin_trgm_ops);
            CREATE INDEX IF NOT EXISTS idx_crossref_citation_count ON crossref_data_multiple_subjects(citation_count);
        """)
        
        # Arxiv table indexes (if it exists)
        try:
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_arxiv_title ON arxiv_papers USING gin(title gin_trgm_ops);
                CREATE INDEX IF NOT EXISTS idx_arxiv_authors ON arxiv_papers USING gin(authors gin_trgm_ops);
                CREATE INDEX IF NOT EXISTS idx_arxiv_abstract ON arxiv_papers USING gin(abstract gin_trgm_ops);
            """)
            logger.info("Created indexes for ArXiv table")
        except Exception as e:
            logger.warning(f"Could not create ArXiv indexes: {str(e)}")
        
        conn.commit()
        logger.info("✅ Database optimization complete!")
        
    except Exception as e:
        logger.error(f"Database optimization failed: {str(e)}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    # Before running this script, make sure the extension is installed
    # Execute this SQL on your database:
    # CREATE EXTENSION IF NOT EXISTS pg_trgm;
    optimize_database()