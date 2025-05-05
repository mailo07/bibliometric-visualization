#!/usr/bin/env python
# test_password_and_fix.py - A utility to test and fix password validation issues
import psycopg2
from psycopg2.extras import RealDictCursor
from werkzeug.security import generate_password_hash, check_password_hash
import argparse
import sys

def parse_args():
    parser = argparse.ArgumentParser(description="Test and fix password validation issues")
    parser.add_argument('--username', required=True, help='Username to test/fix')
    parser.add_argument('--password', required=True, help='Expected password')
    parser.add_argument('--fix', action='store_true', help='Fix the password if validation fails')
    parser.add_argument('--dbname', default='bibliometric_data', help='Database name')
    parser.add_argument('--dbuser', default='postgres', help='Database user')
    parser.add_argument('--dbpass', default='vivo18#', help='Database password')
    parser.add_argument('--dbhost', default='localhost', help='Database host')
    parser.add_argument('--dbport', default='8080', help='Database port')
    return parser.parse_args()

def get_connection(dbname, dbuser, dbpass, dbhost, dbport):
    """Create a connection to the database"""
    try:
        conn = psycopg2.connect(
            dbname=dbname,
            user=dbuser,
            password=dbpass,
            host=dbhost,
            port=dbport
        )
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

def test_password(conn, username, password):
    """Test if the provided password matches what's in the database"""
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get the user's stored password hash
            cur.execute("SELECT id, username, password FROM users WHERE username = %s", (username,))
            user = cur.fetchone()
            
            if not user:
                print(f"User '{username}' not found in database")
                return False, None
            
            stored_hash = user['password']
            print(f"User ID: {user['id']}")
            print(f"Stored hash: {stored_hash}")
            
            # Test direct validation
            is_valid = check_password_hash(stored_hash, password)
            print(f"Password validation result: {is_valid}")
            
            return is_valid, user['id']
    except Exception as e:
        print(f"Error testing password: {e}")
        return False, None

def fix_password(conn, user_id, username, password):
    """Fix the password hash for the user"""
    try:
        with conn.cursor() as cur:
            # Generate a new hash for the password
            new_hash = generate_password_hash(password)
            print(f"Generated new hash: {new_hash}")
            
            # Update the user's password
            cur.execute("UPDATE users SET password = %s WHERE id = %s", (new_hash, user_id))
            conn.commit()
            print(f"Password hash updated for user '{username}'")
            
            # Verify the fix worked
            print("\nVerifying fix...")
            is_valid, _ = test_password(conn, username, password)
            
            if is_valid:
                print("✅ Password fix verified successfully!")
            else:
                print("❌ Password fix failed verification!")
                
            return is_valid
    except Exception as e:
        conn.rollback()
        print(f"Error fixing password: {e}")
        return False

def main():
    args = parse_args()
    
    print("Password Validation Test and Fix Tool")
    print("====================================")
    print(f"Testing password for user: {args.username}")
    
    conn = get_connection(args.dbname, args.dbuser, args.dbpass, args.dbhost, args.dbport)
    
    try:
        is_valid, user_id = test_password(conn, args.username, args.password)
        
        if not is_valid:
            print("\nPassword validation failed!")
            
            if args.fix:
                print("Attempting to fix password...")
                fix_password(conn, user_id, args.username, args.password)
            else:
                print("Run with --fix option to update the password hash")
        else:
            print("\nPassword validation successful!")
    finally:
        conn.close()

if __name__ == "__main__":
    main()