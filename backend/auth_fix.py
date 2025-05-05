#!/usr/bin/env python
# auth_fix.py - Fix authentication issues in the database

import sys
import argparse
import psycopg2
from psycopg2.extras import RealDictCursor
from werkzeug.security import generate_password_hash, check_password_hash

# Database configuration
DB_CONFIG = {
    "dbname": "bibliometric_data",
    "user": "postgres",
    "password": "vivo18#",
    "host": "localhost",
    "port": "8080"
}

def parse_args():
    parser = argparse.ArgumentParser(description="Fix authentication issues in the database")
    parser.add_argument('--action', choices=['check', 'fix', 'test'], default='check',
                        help='Action to perform: check issues, fix issues, or test authentication')
    parser.add_argument('--username', required=True, help='Username to check/fix')
    parser.add_argument('--password', help='Password for testing authentication')
    parser.add_argument('--new-password', help='New password for fixing account')
    return parser.parse_args()

def get_connection():
    """Create database connection with detailed error handling"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except psycopg2.OperationalError as e:
        print(f"Database connection error: {e}")
        print("Please check your database credentials and ensure the database server is running.")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error connecting to database: {e}")
        sys.exit(1)

def fix_user_password(username, password):
    """Fix a user's password hash"""
    conn = get_connection()
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
                print(f"❌ User '{username}' not found")
                conn.rollback()
                return False
            
            conn.commit()
            print(f"✅ Password hash updated for user '{username}'")
            
            # Verify the update
            cur.execute("SELECT password FROM users WHERE username = %s", (username,))
            stored_hash = cur.fetchone()[0]
            
            is_valid = check_password_hash(stored_hash, password)
            if is_valid:
                print(f"✅ Password verification successful for user '{username}'")
                return True
            else:
                print(f"❌ Password verification failed for user '{username}'")
                return False
    except Exception as e:
        conn.rollback()
        print(f"❌ Error fixing user password: {e}")
        return False
    finally:
        conn.close()

def main():
    args = parse_args()
    
    if args.action == 'fix':
        if not args.new_password:
            print("Please provide a new password with --new-password")
            return
        fix_user_password(args.username, args.new_password)
    else:
        print("Please use --action=fix to update a user's password")

if __name__ == "__main__":
    main()