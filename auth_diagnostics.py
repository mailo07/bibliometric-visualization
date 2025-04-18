# auth_diagnostics.py
# Run this script to diagnose authentication issues in your Flask app

import psycopg2
from psycopg2.extras import RealDictCursor
from werkzeug.security import generate_password_hash, check_password_hash
import os
import sys
import argparse

def parse_arguments():
    parser = argparse.ArgumentParser(description='Diagnose authentication issues in Flask app')
    parser.add_argument('--host', default='localhost', help='Database host')
    parser.add_argument('--port', default='8080', help='Database port')
    parser.add_argument('--dbname', required=True, help='Database name')
    parser.add_argument('--user', required=True, help='Database user')
    parser.add_argument('--password', required=True, help='Database password')
    parser.add_argument('--username', required=True, help='Username to test')
    parser.add_argument('--test-password', required=True, help='Password to test')
    return parser.parse_args()

def get_db_connection(host, port, dbname, user, password):
    """Create database connection"""
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            dbname=dbname,
            user=user,
            password=password
        )
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def check_table_structure(conn):
    """Verify users table structure"""
    try:
        with conn.cursor() as cur:
            # Get table structure
            cur.execute("""
                SELECT column_name, data_type, character_maximum_length
                FROM information_schema.columns
                WHERE table_name = 'users'
                ORDER BY ordinal_position;
            """)
            columns = cur.fetchall()
            
            print("\n=== TABLE STRUCTURE ===")
            for col in columns:
                print(f"Column: {col[0]}, Type: {col[1]}, Max Length: {col[2]}")
            
            # Check password column specifically
            cur.execute("""
                SELECT character_maximum_length 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'password';
            """)
            password_length = cur.fetchone()
            
            if password_length and password_length[0] is not None:
                if password_length[0] < 100:
                    print(f"\n⚠️ WARNING: password column length ({password_length[0]}) may be too small!")
                    print("Werkzeug password hashes can be up to 100+ characters.")
                    print("Recommended: ALTER TABLE users ALTER COLUMN password TYPE VARCHAR(255);")
            
            return True
    except Exception as e:
        print(f"Error checking table structure: {e}")
        return False

def check_user_password(conn, username, test_password):
    """Check password hash for a specific user"""
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get user record
            cur.execute("SELECT id, username, password FROM users WHERE username = %s", (username,))
            user = cur.fetchone()
            
            if not user:
                print(f"\n❌ User '{username}' not found in database!")
                return False
            
            print("\n=== USER PASSWORD CHECK ===")
            print(f"Username: {user['username']}")
            
            # Check if password hash exists
            stored_hash = user['password']
            if not stored_hash:
                print("❌ Password hash is empty or NULL in database!")
                return False
            
            print(f"Stored hash: {stored_hash[:20]}...")
            print(f"Full hash length: {len(stored_hash)} characters")
            
            # Check hash format
            if not stored_hash.startswith(('pbkdf2:', 'sha256:', 'scrypt:')):
                print("❌ Invalid hash format! Does not start with expected algorithm prefix.")
                return False
            
            # Attempt verification
            try:
                is_valid = check_password_hash(stored_hash, test_password)
                print(f"Password verification result: {'✅ SUCCESS' if is_valid else '❌ FAILED'}")
                return is_valid
            except Exception as e:
                print(f"❌ Error during password verification: {e}")
                return False
                
    except Exception as e:
        print(f"Error checking user password: {e}")
        return False

def test_password_hashing(test_password):
    """Test password hashing consistency"""
    print("\n=== PASSWORD HASHING TEST ===")
    
    # Create a hash
    hash1 = generate_password_hash(test_password, method='pbkdf2:sha256')
    print(f"Generated hash 1: {hash1[:20]}... (length: {len(hash1)})")
    
    # Create another hash for the same password
    hash2 = generate_password_hash(test_password, method='pbkdf2:sha256')
    print(f"Generated hash 2: {hash2[:20]}... (length: {len(hash2)})")
    
    # Direct comparison (will be different due to salt)
    print(f"Direct hash comparison: {'Same' if hash1 == hash2 else 'Different (expected)'}")
    
    # Proper verification
    verify1 = check_password_hash(hash1, test_password)
    verify2 = check_password_hash(hash2, test_password)
    print(f"Verification of hash 1: {'✅ SUCCESS' if verify1 else '❌ FAILED'}")
    print(f"Verification of hash 2: {'✅ SUCCESS' if verify2 else '❌ FAILED'}")
    
    # Cross-verification (should not match)
    wrong_password = test_password + "123"
    verify_wrong = check_password_hash(hash1, wrong_password)
    print(f"Verification with wrong password: {'❌ INCORRECT MATCH' if verify_wrong else '✅ CORRECTLY REJECTED'}")
    
    return verify1 and verify2 and not verify_wrong

def fix_password_hash(conn, username, password):
    """Fix password hash for user"""
    try:
        with conn.cursor() as cur:
            # Generate a proper hash
            new_hash = generate_password_hash(password, method='pbkdf2:sha256')
            print(f"\n=== FIXING PASSWORD HASH ===")
            print(f"New hash: {new_hash[:20]}...")
            
            # Update database
            cur.execute(
                "UPDATE users SET password = %s WHERE username = %s RETURNING id",
                (new_hash, username)
            )
            
            if cur.rowcount == 0:
                print(f"❌ Failed to update user '{username}'!")
                return False
                
            conn.commit()
            print(f"✅ Password hash updated successfully for user '{username}'!")
            return True
    except Exception as e:
        conn.rollback()
        print(f"❌ Error fixing password hash: {e}")
        return False

def main():
    args = parse_arguments()
    
    print("=== AUTHENTICATION DIAGNOSTICS ===")
    print(f"Testing user: {args.username}")
    
    # Connect to database
    conn = get_db_connection(
        args.host, args.port, args.dbname, args.user, args.password
    )
    
    if not conn:
        print("Failed to connect to database. Exiting.")
        sys.exit(1)
    
    try:
        # Check table structure
        if not check_table_structure(conn):
            print("Failed to check table structure. Continuing with other tests.")
        
        # Test password hashing functionality
        if not test_password_hashing(args.test_password):
            print("\n❌ Password hashing functionality test failed!")
        
        # Check user password
        password_valid = check_user_password(conn, args.username, args.test_password)
        
        if not password_valid:
            print("\nWould you like to fix the password hash? (y/n)")
            choice = input().lower()
            if choice == 'y':
                fix_password_hash(conn, args.username, args.test_password)
                
                # Verify fix
                print("\n=== VERIFYING FIX ===")
                if check_user_password(conn, args.username, args.test_password):
                    print("\n✅ Authentication issue resolved!")
                else:
                    print("\n❌ Authentication issue persists! Further debugging required.")
        else:
            print("\n✅ Password verification successful!")
    finally:
        conn.close()
        
    print("\n=== DIAGNOSTICS COMPLETE ===")

if __name__ == "__main__":
    main()