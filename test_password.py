# test_password.py
from werkzeug.security import generate_password_hash, check_password_hash
import hashlib
import psycopg2
from psycopg2.extras import RealDictCursor
import sys

# Database connection parameters - update these
DB_CONFIG = {
    "dbname": "bibliometric_data",  # Update to your actual database name
    "user": "postgres",
    "password": "vivo18#",
    "host": "localhost",
    "port": "8080"
}

def get_db_connection():
    """Create a connection to the PostgreSQL database"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except psycopg2.Error as e:
        print(f"Database connection error: {e}")
        return None

def test_password_workflow(username, password):
    """Test both password storage and verification"""
    print("=" * 50)
    print(f"Testing for user: {username}")
    print("=" * 50)
    
    # Step 1: Check if user exists and get stored password
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database")
        return
    
    try:
        # Get the current stored password hash
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT password FROM users WHERE username = %s", (username,))
            user = cur.fetchone()
            
            if not user:
                print(f"User {username} not found in database")
                return
            
            stored_hash = user['password']
            print(f"Stored password hash: {stored_hash}")
            
            # Test method 1: Direct verification (should work if single hash is used)
            print("\nMethod 1: Direct verification")
            is_valid_direct = check_password_hash(stored_hash, password)
            print(f"Direct password verification result: {is_valid_direct}")
            
            # Test method 2: SHA256 + verification (should work if double hash is used)
            print("\nMethod 2: SHA256 + verification")
            sha_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
            print(f"Generated SHA256 hash: {sha_hash}")
            is_valid_sha = check_password_hash(stored_hash, sha_hash)
            print(f"SHA256 password verification result: {is_valid_sha}")
            
            # For debugging - try recreating the hash
            print("\nDebug: Hash Generation")
            direct_hash = generate_password_hash(password, method='pbkdf2:sha256')
            print(f"New direct hash: {direct_hash}")
            
            sha_hash_again = hashlib.sha256(password.encode('utf-8')).hexdigest()
            double_hash = generate_password_hash(sha_hash_again, method='pbkdf2:sha256')
            print(f"New double hash: {double_hash}")
            
            # Compare values
            print("\nHash Equality Check")
            print(f"Stored hash == Direct hash?: {stored_hash == direct_hash}")
            print(f"Stored hash == Double hash?: {stored_hash == double_hash}")
            
            if is_valid_direct:
                print("\n✅ Single hash verification succeeded")
            elif is_valid_sha:
                print("\n✅ Double hash verification succeeded")
            else:
                print("\n❌ All verification methods failed")
                
    except Exception as e:
        print(f"Error during testing: {e}")
    finally:
        conn.close()

def reset_user_password(username, password, method="direct"):
    """Reset a user's password using specified method"""
    print("=" * 50)
    print(f"Resetting password for user: {username}")
    print("=" * 50)
    
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database")
        return
    
    try:
        # Generate password hash based on selected method
        if method == "direct":
            # Single hash method
            hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
            print(f"Generated direct hash: {hashed_password}")
        else:
            # Double hash method
            sha_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
            hashed_password = generate_password_hash(sha_hash, method='pbkdf2:sha256')
            print(f"Generated double hash: {hashed_password}")
        
        # Update the password in the database
        with conn.cursor() as cur:
            cur.execute("UPDATE users SET password = %s WHERE username = %s RETURNING id", 
                        (hashed_password, username))
            result = cur.fetchone()
            conn.commit()
            
            if result:
                print(f"✅ Password updated for user {username}")
            else:
                print(f"❌ User {username} not found")
                
    except Exception as e:
        print(f"Error during password reset: {e}")
        conn.rollback()
    finally:
        conn.close()

def print_help():
    print("Usage:")
    print("  python test_password.py test <username> <password>")
    print("  python test_password.py reset <username> <password> [direct|double]")
    print("\nExamples:")
    print("  python test_password.py test poppy02 password123")
    print("  python test_password.py reset poppy02 newpassword123 direct")

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in ("test", "reset"):
        print_help()
        sys.exit(1)
        
    command = sys.argv[1]
    
    if command == "test" and len(sys.argv) >= 4:
        test_password_workflow(sys.argv[2], sys.argv[3])
    elif command == "reset" and len(sys.argv) >= 4:
        method = "direct" if len(sys.argv) < 5 else sys.argv[4]
        reset_user_password(sys.argv[2], sys.argv[3], method)
    else:
        print_help()