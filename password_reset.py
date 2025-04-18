import psycopg2
from werkzeug.security import generate_password_hash

# Update these to match your database configuration
DB_CONFIG = {
    "dbname": "bibliometric_data",  # Update this to match your actual database name
    "user": "postgres",          # Update with your DB username
    "password": "vivo18#",      # Update with your DB password
    "host": "localhost",
    "port": "8080"
}

def reset_all_passwords():
    """Emergency fix: Reset all user passwords to a known state with proper hashes"""
    print("WARNING: This will reset ALL user passwords in the system.")
    print("This should only be used if you're having widespread authentication issues.")
    confirm = input("Are you absolutely sure you want to continue? (type 'YES' to confirm): ")
    
    if confirm != "YES":
        print("Operation cancelled.")
        return
    
    try:
        # Connect to the database
        print("Connecting to database...")
        conn = psycopg2.connect(**DB_CONFIG)
        
        with conn.cursor() as cur:
            # Get all users
            cur.execute("SELECT id, username FROM users")
            users = cur.fetchall()
            
            if not users:
                print("No users found in the database.")
                return
                
            print(f"Found {len(users)} users.")
            print("Resetting passwords...")
            
            success_count = 0
            for user_id, username in users:
                # Create a temporary password based on username (user will need to change later)
                temp_password = f"Reset_{username}_2025"
                hashed_password = generate_password_hash(temp_password, method='pbkdf2:sha256')
                
                # Update the password
                cur.execute(
                    "UPDATE users SET password = %s WHERE id = %s",
                    (hashed_password, user_id)
                )
                
                print(f"  ✓ Reset user: {username} (ID: {user_id})")
                print(f"    New password: {temp_password}")
                success_count += 1
            
            # Commit all changes
            conn.commit()
            print(f"\n✅ Successfully reset {success_count} passwords.")
            print("IMPORTANT: Users will need to log in with their new temporary passwords.")
            print("Format of temporary passwords: Reset_username_2025")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if conn:
            conn.close()

def reset_specific_user():
    """Reset a specific user's password with proper hash generation"""
    username = input("Enter username to reset: ")
    new_password = input("Enter new password (min 8 characters): ")
    
    if len(new_password) < 8:
        print("Password must be at least 8 characters long.")
        return
    
    try:
        # Connect to the database
        conn = psycopg2.connect(**DB_CONFIG)
        
        with conn.cursor() as cur:
            # Generate proper password hash
            hashed_password = generate_password_hash(new_password, method='pbkdf2:sha256')
            
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
            print(f"\nNew hash stored: {stored_hash}")
            print(f"Hash length: {len(stored_hash)}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    print("One-Time Password Reset Tool")
    print("===========================")
    print("1. Reset specific user")
    print("2. Reset ALL users (emergency only)")
    
    choice = input("\nEnter choice (1-2): ")
    
    if choice == "1":
        reset_specific_user()
    elif choice == "2":
        reset_all_passwords()
    else:
        print("Invalid choice")