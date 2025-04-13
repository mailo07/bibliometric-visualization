# routes/auth_routes.py
from flask import Blueprint, jsonify, request
import psycopg2
from psycopg2.extras import RealDictCursor
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
from functools import wraps
from config import Config

auth_bp = Blueprint('auth', __name__)

DB_CONFIG = {
    "dbname": Config.DB_NAME,
    "user": Config.DB_USER,
    "password": Config.DB_PASSWORD,
    "host": Config.DB_HOST,
    "port": Config.DB_PORT
}

def get_db_connection():
    """Create a connection to the PostgreSQL database"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except psycopg2.Error as e:
        print(f"Database connection error: {e}")
        return None

def init_db():
    """Initialize database with users table if it doesn't exist"""
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    bio TEXT,
                    profile_image VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """)
                conn.commit()
                print("Database initialized successfully")
        except psycopg2.Error as e:
            print(f"Database initialization error: {e}")
        finally:
            conn.close()
    else:
        print("Failed to initialize database")

# Initialize the database when the blueprint is registered
init_db()

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            data = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
            conn = get_db_connection()
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT id FROM users WHERE id = %s", (data['user_id'],))
                current_user = cur.fetchone()
        except Exception as e:
            print(f"Token verification error: {e}")
            return jsonify({'message': 'Token is invalid!'}), 401
        finally:
            conn.close()
        return f(current_user, *args, **kwargs)
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    
    # Extract and clean ALL user data
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()
    bio = data.get('bio', '').strip()
    profile_image = data.get('profile_image', '').strip()
    
    # Validate required fields
    if not username or not email or not password:
        return jsonify({"message": "All fields are required"}), 400
    
    # Validate password length
    if len(password) < 8:
        return jsonify({"message": "Password must be at least 8 characters long"}), 400
    
    # Hash the password using the same method as used when checking
    # We're explicitly using pbkdf2:sha256 method for consistency
    try:
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
        print(f"Registration: Generated password hash: {hashed_password[:30]}...")
    except Exception as e:
        print(f"Password hashing error: {e}")
        return jsonify({"message": "Error processing password"}), 500
    
    # Connect to the database
    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Database connection error"}), 500
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check if username already exists
            cur.execute("SELECT id FROM users WHERE username = %s", (username,))
            if cur.fetchone():
                return jsonify({"message": "Username already exists"}), 409
            
            # Check if email already exists
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cur.fetchone():
                return jsonify({"message": "Email already exists"}), 409
            
            # Insert new user
            cur.execute(
                """
                INSERT INTO users (username, email, password, bio, profile_image)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, username, email, bio, created_at
                """,
                (username, email, hashed_password, bio, profile_image)
            )
            
            new_user = cur.fetchone()
            conn.commit()
            
            print(f"User registered successfully: {username}")
            
            return jsonify({
                "message": "Registration successful",
                "user": dict(new_user)
            }), 201
            
    except psycopg2.Error as e:
        conn.rollback()
        print(f"Database error: {e}")
        return jsonify({"message": "Registration failed due to database error"}), 500
    finally:
        conn.close()

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Username and password required"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Database connection error"}), 500

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get user with properly formatted column names
            cur.execute("""SELECT id, username, email, password, bio, profile_image 
                           FROM users WHERE username = %s""", (username,))
            user = cur.fetchone()

            if not user:
                print(f"No user found with username: {username}")
                return jsonify({"message": "Invalid credentials"}), 401

            # Debug print - consider removing in production
            print(f"Found user: {user['username']}")
            
            # Verify password
            try:
                password_valid = check_password_hash(user['password'], password)
                print(f"Password valid: {password_valid}")
                
                if not password_valid:
                    # IMPORTANT: Do not bypass password check
                    return jsonify({"message": "Invalid credentials"}), 401
            except Exception as pw_error:
                print(f"Password checking error: {pw_error}")
                return jsonify({"message": "Password verification error"}), 500

            # Generate JWT token
            try:
                token_payload = {
                    'user_id': user['id'],
                    'exp': datetime.utcnow() + timedelta(days=1)
                }
                
                token = jwt.encode(
                    token_payload, 
                    Config.SECRET_KEY, 
                    algorithm='HS256'
                )
                
                # Convert bytes to string if necessary (for PyJWT < 2.0)
                if isinstance(token, bytes):
                    token = token.decode('utf-8')
                    
                print(f"Token generated successfully: {token[:10]}...")
            except Exception as token_error:
                print(f"Token generation error: {token_error}")
                return jsonify({"message": "Authentication error"}), 500

            user_data = {
                "id": user['id'],
                "username": user['username'],
                "email": user['email'],
                "bio": user['bio'] if user['bio'] else "",
                "profile_image": user['profile_image'] if user['profile_image'] else "",
                "token": token
            }

            return jsonify({
                "message": "Login successful",
                "user": user_data
            }), 200

    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({"message": f"Login failed: {str(e)}"}), 500
    finally:
        conn.close()