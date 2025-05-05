#!/usr/bin/env python
# quick_password_reset.py - Simple script to reset a password for a specific user
import psycopg2
from werkzeug.security import generate_password_hash

# Database connection parameters - update if needed
DB_CONFIG = {
    "dbname": "bibliometric_data",
    "user": "postgres",
    "password": "vivo18#",
    "host": "localhost",
    "port": "8080"
}

def reset_user_password(username, new_password):
    """Reset password for a specific user"""
    print(f"Resetting password for user: {username}")
    
    try:
        # Connect to the database
        print("Connecting to database...")
        conn = psycopg2.connect(**DB_CONFIG)
        
        with conn.cursor() as cur:
            # Generate proper password hash
            hashed_password = generate_password_hash(new_password)
            print(f"Generated hash: {hashed_password[:50]}...")
            
            # Update the password
            cur.execute(
                "UPDATE users SET password = %s WHERE username = %s RETURNING id",
                (hashed_password, username)
            )
            result = cur.fetchone()
            
            if not result:
                print(f"User '{username}' not found in database.")
                return
                
            # Commit the change
            conn.commit()
            print(f"\n✅ Successfully reset password for '{username}'.")
            print(f"New password: {new_password}")
            
            # Verify the hash
            cur.execute("SELECT password FROM users WHERE username = %s", (username,))
            stored_hash = cur.fetchone()[0]
            print(f"\nNew hash stored: {stored_hash[:50]}...")
            print(f"Hash length: {len(stored_hash)}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    username = input("Enter username: ")
    new_password = input("Enter new password (min 8 characters): ")
    
    if len(new_password) < 8:
        print("Password must be at least 8 characters long.")
    else:
        reset_user_password(username, new_password)