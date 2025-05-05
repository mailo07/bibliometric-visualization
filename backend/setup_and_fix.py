#!/usr/bin/env python
# setup_and_fix.py - Configure and fix BiblioKnow authentication and database issues

import os
import sys
import argparse
import psycopg2
from psycopg2.extras import RealDictCursor
from werkzeug.security import generate_password_hash, check_password_hash
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("BiblioKnow-Setup")

# Database configuration
DB_CONFIG = {
    "dbname": "bibliometric_data",
    "user": "postgres",
    "password": "vivo18#",
    "host": "localhost",
    "port": "8080"
}

# Default admin user info
DEFAULT_ADMIN = {
    "username": "admin",
    "password": "admin123",
    "email": "admin@biblioknow.com",
    "full_name": "Admin User",
    "bio": "System administrator",
    "role": "admin"
}

def parse_args():
    parser = argparse.ArgumentParser(description="Setup and fix BiblioKnow application")
    parser.add_argument('--action', choices=['check', 'fix-auth', 'setup-db', 'fix-all'], 
                       default='fix-all', help='Action to perform')
    parser.add_argument('--username', help='Username to check/fix')
    parser.add_argument('--password', help='Password to use for the user')
    return parser.parse_args()

def get_connection():
    """Create database connection with detailed error handling"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except psycopg2.OperationalError as e:
        logger.error(f"Database connection error: {e}")
        logger.error("Please check your database credentials and ensure the database server is running.")
        return None
    except Exception as e:
        logger.error(f"Unexpected error connecting to database: {e}")
        return None

def check_database_connection():
    """Check if database connection is working"""
    try:
        conn = get_connection()
        if conn:
            logger.info("✅ Database connection successful")
            conn.close()
            return True
        else:
            logger.error("❌ Failed to connect to database")
            return False
    except Exception as e:
        logger.error(f"❌ Database connection test failed: {e}")
        return False

def check_users_table():
    """Check if users table exists and has proper structure"""
    conn = get_connection()
    if not conn:
        return False
    
    try:
        with conn.cursor() as cur:
            # Check if users table exists
            cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'users'
                );
            """)
            table_exists = cur.fetchone()[0]
            
            if not table_exists:
                logger.error("❌ Users table does not exist")
                return False
            
            # Check password column length
            cur.execute("""
                SELECT character_maximum_length 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'password';
            """)
            password_length = cur.fetchone()[0]
            
            if password_length is None:
                logger.error("❌ Password column not found in users table")
                return False
            
            if password_length < 255:
                logger.warning(f"⚠️ Password column length ({password_length}) may be too small")
                logger.warning("Recommended: ALTER TABLE users ALTER COLUMN password TYPE VARCHAR(255);")
                return False
            
            logger.info("✅ Users table exists with proper structure")
            return True
    except Exception as e:
        logger.error(f"❌ Error checking users table: {e}")
        return False
    finally:
        conn.close()

def fix_users_table():
    """Fix users table structure if needed"""
    conn = get_connection()
    if not conn:
        return False
    
    try:
        with conn.cursor() as cur:
            # Check if users table exists
            cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'users'
                );
            """)
            table_exists = cur.fetchone()[0]
            
            if not table_exists:
                logger.info("Creating users table...")
                cur.execute("""
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(80) UNIQUE NOT NULL,
                    email VARCHAR(120) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    full_name VARCHAR(120),
                    bio TEXT,
                    location VARCHAR(120),
                    profile_picture VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP,
                    last_activity TIMESTAMP,
                    last_activity_type VARCHAR(50),
                    last_ip_address VARCHAR(45),
                    is_suspended BOOLEAN DEFAULT FALSE,
                    role VARCHAR(50) DEFAULT 'user',
                    occupation VARCHAR(120),
                    member_since TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """)
                conn.commit()
                logger.info("✅ Users table created successfully")
                return True
            
            # Check password column length
            cur.execute("""
                SELECT character_maximum_length 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'password';
            """)
            password_length = cur.fetchone()[0]
            
            if password_length < 255:
                logger.info("Altering password column length...")
                cur.execute("""
                ALTER TABLE users ALTER COLUMN password TYPE VARCHAR(255);
                """)
                conn.commit()
                logger.info("✅ Password column altered successfully")
            
            return True
    except Exception as e:
        conn.rollback()
        logger.error(f"❌ Error fixing users table: {e}")
        return False
    finally:
        conn.close()

def check_user_exists(username):
    """Check if a user exists in the database"""
    conn = get_connection()
    if not conn:
        return False
    
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE username = %s", (username,))
            result = cur.fetchone()
            return result is not None
    except Exception as e:
        logger.error(f"❌ Error checking user existence: {e}")
        return False
    finally:
        conn.close()

def create_user(user_data):
    """Create a new user in the database"""
    conn = get_connection()
    if not conn:
        return False
    
    try:
        with conn.cursor() as cur:
            # Hash the password using pbkdf2:sha256 method explicitly
            password_hash = generate_password_hash(user_data['password'], method='pbkdf2:sha256')
            
            # Insert the user
            cur.execute("""
            INSERT INTO users (username, email, password, full_name, bio, role)
            VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                user_data['username'],
                user_data['email'],
                password_hash,
                user_data.get('full_name', ''),
                user_data.get('bio', ''),
                user_data.get('role', 'user')
            ))
            
            conn.commit()
            logger.info(f"✅ User '{user_data['username']}' created successfully")
            return True
    except Exception as e:
        conn.rollback()
        logger.error(f"❌ Error creating user: {e}")
        return False
    finally:
        conn.close()

def fix_user_password(username, password):
    """Fix a user's password hash"""
    conn = get_connection()
    if not conn:
        return False
    
    try:
        with conn.cursor() as cur:
            # Generate proper hash - use method parameter to ensure correct format
            hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
            
            # Update the user's password
            cur.execute(
                "UPDATE users SET password = %s WHERE username = %s RETURNING id",
                (hashed_password, username)
            )
            
            result = cur.fetchone()
            if not result:
                logger.error(f"❌ User '{username}' not found")
                conn.rollback()
                return False
            
            conn.commit()
            logger.info(f"✅ Password hash updated for user '{username}'")
            
            # Verify the update
            cur.execute("SELECT password FROM users WHERE username = %s", (username,))
            stored_hash = cur.fetchone()[0]
            
            is_valid = check_password_hash(stored_hash, password)
            if is_valid:
                logger.info(f"✅ Password verification successful for user '{username}'")
                return True
            else:
                logger.error(f"❌ Password verification failed for user '{username}'")
                return False
    except Exception as e:
        conn.rollback()
        logger.error(f"❌ Error fixing user password: {e}")
        return False
    finally:
        conn.close()

def fix_search_db_indices():
    """Create indices for improved search performance"""
    conn = get_connection()
    if not conn:
        return False
    
    try:
        with conn.cursor() as cur:
            # Check for GIN indices
            cur.execute("""
                SELECT indexname FROM pg_indexes 
                WHERE tablename = 'bibliometric_data' AND indexname = 'idx_bibliometric_data_text_search';
            """)
            index_exists = cur.fetchone()
            
            if not index_exists:
                logger.info("Creating search indices for bibliometric_data...")
                try:
                    # Create GIN index for full text search
                    cur.execute("""
                    CREATE INDEX idx_bibliometric_data_text_search 
                    ON bibliometric_data 
                    USING gin(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(author_name, '')));
                    """)
                    logger.info("✅ Created search index for bibliometric_data")
                except Exception as e:
                    logger.warning(f"⚠️ Could not create index: {e}")
            
            # Check for crossref data indices
            cur.execute("""
                SELECT indexname FROM pg_indexes 
                WHERE tablename = 'crossref_data_multiple_subjects' AND indexname = 'idx_crossref_data_text_search';
            """)
            index_exists = cur.fetchone()
            
            if not index_exists:
                logger.info("Creating search indices for crossref_data_multiple_subjects...")
                try:
                    # Create GIN index for full text search
                    cur.execute("""
                    CREATE INDEX idx_crossref_data_text_search 
                    ON crossref_data_multiple_subjects 
                    USING gin(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(authors, '')));
                    """)
                    logger.info("✅ Created search index for crossref_data_multiple_subjects")
                except Exception as e:
                    logger.warning(f"⚠️ Could not create index: {e}")
            
            # Check for google scholar indices
            cur.execute("""
                SELECT indexname FROM pg_indexes 
                WHERE tablename = 'google_scholar_data' AND indexname = 'idx_google_scholar_data_text_search';
            """)
            index_exists = cur.fetchone()
            
            if not index_exists:
                logger.info("Creating search indices for google_scholar_data...")
                try:
                    # Create GIN index for full text search
                    cur.execute("""
                    CREATE INDEX idx_google_scholar_data_text_search 
                    ON google_scholar_data 
                    USING gin(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(author_name, '')));
                    """)
                    logger.info("✅ Created search index for google_scholar_data")
                except Exception as e:
                    logger.warning(f"⚠️ Could not create index: {e}")
            
            conn.commit()
            logger.info("✅ Search indices created or verified")
            return True
    except Exception as e:
        conn.rollback()
        logger.error(f"❌ Error creating search indices: {e}")
        return False
    finally:
        conn.close()

def setup_database():
    """Verify database structure and create indices for search"""
    # First fix users table
    if not fix_users_table():
        logger.error("❌ Failed to fix users table")
        return False
    
    # Create search indices for better performance
    if not fix_search_db_indices():
        logger.warning("⚠️ Failed to create search indices, but proceeding")
    
    # Create admin user if needed
    if not check_user_exists(DEFAULT_ADMIN['username']):
        logger.info(f"Creating admin user '{DEFAULT_ADMIN['username']}'...")
        if not create_user(DEFAULT_ADMIN):
            logger.error("❌ Failed to create admin user")
            return False
        logger.info("✅ Created admin user")
    else:
        logger.info(f"Admin user '{DEFAULT_ADMIN['username']}' already exists")
    
    logger.info("✅ Database setup completed")
    return True

def fix_auth_issues(username=None, password=None):
    """Fix authentication issues for a specific user or admin"""
    # Fix users table first
    if not fix_users_table():
        logger.error("❌ Failed to fix users table. Aborting.")
        return False
    
    # If username is provided, fix that specific user
    if username:
        if not check_user_exists(username):
            logger.warning(f"⚠️ User '{username}' does not exist")
            
            # Create the user if password is provided
            if password:
                user_data = {
                    'username': username,
                    'password': password,
                    'email': f"{username}@biblioknow.com",
                    'role': 'user'
                }
                
                if create_user(user_data):
                    logger.info(f"✅ User '{username}' created successfully")
                    return True
                else:
                    logger.error(f"❌ Failed to create user '{username}'")
                    return False
        else:
            # Fix the user's password
            if password:
                if fix_user_password(username, password):
                    logger.info(f"✅ Fixed password for user '{username}'")
                    return True
                else:
                    logger.error(f"❌ Failed to fix password for user '{username}'")
                    return False
            else:
                logger.warning("⚠️ No password provided for user fix")
                return False
    
    # Create or fix admin user
    if not check_user_exists(DEFAULT_ADMIN['username']):
        logger.info(f"Creating admin user '{DEFAULT_ADMIN['username']}'...")
        if create_user(DEFAULT_ADMIN):
            logger.info(f"✅ Admin user '{DEFAULT_ADMIN['username']}' created successfully")
            return True
        else:
            logger.error(f"❌ Failed to create admin user")
            return False
    else:
        # Fix admin password
        logger.info(f"Fixing admin user password...")
        if fix_user_password(DEFAULT_ADMIN['username'], DEFAULT_ADMIN['password']):
            logger.info(f"✅ Admin user password fixed successfully")
            return True
        else:
            logger.error(f"❌ Failed to fix admin user password")
            return False

def main():
    args = parse_args()
    
    logger.info("=== BIBLIOKNOW SETUP AND FIX TOOL ===")
    
    if args.action == 'check':
        logger.info("=== CHECKING SYSTEM CONFIGURATION ===")
        check_database_connection()
        check_users_table()
    
    elif args.action == 'fix-auth':
        logger.info("=== FIXING AUTHENTICATION ISSUES ===")
        fix_auth_issues(args.username, args.password)
    
    elif args.action == 'setup-db':
        logger.info("=== SETTING UP DATABASE ===")
        setup_database()
    
    elif args.action == 'fix-all':
        logger.info("=== FULL SYSTEM REPAIR ===")
        
        # Check database connection
        if not check_database_connection():
            logger.error("❌ Cannot proceed without database connection.")
            return
        
        # Setup database
        setup_database()
        
        # Fix authentication
        fix_auth_issues(args.username, args.password)
    
    logger.info("=== SETUP COMPLETE ===")

if __name__ == "__main__":
    main()