# services/database.py
import psycopg2
import psycopg2.extras
import os
import logging
from config import Config

class DatabaseService:
    """Service for handling database operations"""
    
    def __init__(self):
        self.conn = None
        self.connect()
    
    def connect(self):
        """Establishes connection to database"""
        try:
            # Use configuration from Config object, not hardcoded ports
            self.conn = psycopg2.connect(
                host=Config.DB_HOST,
                database=Config.DB_NAME,
                user=Config.DB_USER,
                password=Config.DB_PASSWORD,
                port=Config.DB_PORT  # Using the configured port, not hardcoded value
            )
            logging.info("✅ Database connection established successfully")
        except Exception as e:
            logging.error(f"❌ Database connection failed: {e}")
            self.conn = None
    
    def ensure_connection(self):
        """Ensures database connection is active"""
        if self.conn is None or self.conn.closed:
            self.connect()
        
        if self.conn is None:
            raise Exception("Could not establish database connection")
    
    def execute_query(self, query, params=None):
        """Execute a query and return results as dictionary"""
        self.ensure_connection()
        
        try:
            with self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                cursor.execute(query, params)
                
                # For SELECT queries
                if query.strip().upper().startswith(('SELECT', 'WITH')):
                    return cursor.fetchall()
                
                # For INSERT/UPDATE/DELETE
                self.conn.commit()
                return cursor.rowcount
        except Exception as e:
            self.conn.rollback()
            logging.error(f"Query execution error: {e}")
            logging.error(f"Query: {query}")
            logging.error(f"Params: {params}")
            raise
    
    def insert_record(self, table, data):
        """Insert a record into a table"""
        columns = list(data.keys())
        values = list(data.values())
        
        placeholders = [f"%({col})s" for col in columns]
        
        query = f"""
            INSERT INTO {table} ({', '.join(columns)})
            VALUES ({', '.join(placeholders)})
            RETURNING id
        """
        
        result = self.execute_query(query, data)
        return result[0]['id'] if result else None
    
    def update_record(self, table, id_column, record_id, data):
        """Update a record in a table"""
        set_clause = ', '.join([f"{col} = %({col})s" for col in data.keys()])
        
        query = f"""
            UPDATE {table}
            SET {set_clause}
            WHERE {id_column} = %(record_id)s
        """
        
        params = {**data, 'record_id': record_id}
        return self.execute_query(query, params)
    
    def delete_record(self, table, id_column, record_id):
        """Delete a record from a table"""
        query = f"""
            DELETE FROM {table}
            WHERE {id_column} = %s
        """
        
        return self.execute_query(query, (record_id,))
    
    def get_record_by_id(self, table, id_column, record_id):
        """Get a record by its ID"""
        query = f"""
            SELECT *
            FROM {table}
            WHERE {id_column} = %s
        """
        
        result = self.execute_query(query, (record_id,))
        return result[0] if result else None
    
    def close(self):
        """Close the database connection"""
        if self.conn is not None:
            self.conn.close()
            self.conn = None