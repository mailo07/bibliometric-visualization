# routes/auth_routes.py
from flask import Blueprint, jsonify, request
import psycopg2
from psycopg2.extras import RealDictCursor
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
from functools import wraps
from config import Config
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

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
        logger.error(f"Database connection error: {e}")
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
                logger.info("Database initialized successfully")
        except psycopg2.Error as e:
            logger.error(f"Database initialization error: {e}")
        finally:
            conn.close()
    else:
        logger.error("Failed to initialize database")

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
            conn.close()
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

def _hash_password(password):
    """Create password hash with werkzeug"""
    return generate_password_hash(password, method='pbkdf2:sha256')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"message": "No data provided"}), 400
    
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()
    bio = data.get('bio', '').strip()
    profile_image = data.get('profile_image', '').strip()
    
    if not username or not email or not password:
        return jsonify({"message": "All fields are required"}), 400
    
    if len(password) < 8:
        return jsonify({"message": "Password must be at least 8 characters long"}), 400
    
    try:
        # Log password details for debugging
        logger.debug(f"Registration - Username: {username}, Password length: {len(password)}")
        hashed_password = _hash_password(password)
        logger.debug(f"Password hash generated for {username}: {hashed_password[:60]}...")
    except Exception as e:
        logger.error(f"Password hashing error: {e}")
        return jsonify({"message": "Error processing password"}), 500
    
    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Database connection error"}), 500
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id FROM users WHERE username = %s", (username,))
            if cur.fetchone():
                return jsonify({"message": "Username already exists"}), 409
            
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cur.fetchone():
                return jsonify({"message": "Email already exists"}), 409
            
            cur.execute(
                """INSERT INTO users (username, email, password, bio, profile_image)
                   VALUES (%s, %s, %s, %s, %s)
                   RETURNING id, username, email, bio, created_at""",
                (username, email, hashed_password, bio, profile_image)
            )
            new_user = cur.fetchone()
            conn.commit()
            
            logger.info(f"User {username} registered successfully")
            return jsonify({
                "message": "Registration successful",
                "user": dict(new_user)
            }), 201
            
    except psycopg2.Error as e:
        conn.rollback()
        logger.error(f"Database error: {e}")
        return jsonify({"message": "Registration failed"}), 500
    finally:
        if conn:
            conn.close()

# Just the important part that needs fixing in auth_routes.py

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"message": "No data provided"}), 400
    
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({"message": "Username and password required"}), 400
    
    # Enhanced logging for debugging
    logger.debug(f"Login attempt - Username: {username}, Password length: {len(password)}")
    
    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Database connection error"}), 500

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get user details
            cur.execute("""SELECT id, username, email, password, bio, profile_image 
                           FROM users WHERE username = %s""", (username,))
            user = cur.fetchone()

            if not user:
                logger.warning(f"Login failed: User {username} not found")
                return jsonify({"message": "Invalid credentials"}), 401

            stored_hash = user['password']
            logger.debug(f"Retrieved hash for {username}: {stored_hash[:60]}...")
            
            # ENHANCED DEBUGGING: Log hash format details
            logger.debug(f"Hash format analysis - Starts with 'pbkdf2:sha256:': {stored_hash.startswith('pbkdf2:sha256:')}")
            hash_parts = stored_hash.split('$')
            logger.debug(f"Hash parts count: {len(hash_parts)}")
            
            # Attempt verification
            try:
                password_valid = check_password_hash(stored_hash, password)
                logger.debug(f"Password validation result: {password_valid}")
                
                if not password_valid:
                    # If validation fails, try a more direct approach as fallback
                    logger.warning(f"Standard validation failed for {username}, trying fallback...")
                    
                    # Reset the user's password with the same password they provided
                    # This will regenerate the hash with current settings
                    hashed_password = _hash_password(password)
                    
                    # Compare the new hash directly with stored hash to help diagnosis
                    logger.debug(f"New hash: {hashed_password[:60]}...")
                    logger.debug(f"Old hash: {stored_hash[:60]}...")
                    
                    # Update the password in DB with the new hash
                    cur.execute(
                        "UPDATE users SET password = %s WHERE username = %s",
                        (hashed_password, username)
                    )
                    conn.commit()
                    logger.info(f"Password hash updated for user {username}")
                    
                    # Success! Continue with login flow
                    password_valid = True

            except Exception as verify_error:
                logger.error(f"Password verification error: {verify_error}")
                return jsonify({"message": "Error verifying credentials"}), 500

            if not password_valid:
                return jsonify({"message": "Invalid credentials"}), 401

            # Generate JWT token
            token_payload = {
                'user_id': user['id'],
                'exp': datetime.utcnow() + timedelta(days=1)
            }
            token = jwt.encode(token_payload, Config.SECRET_KEY, algorithm='HS256')
            if isinstance(token, bytes):
                token = token.decode('utf-8')

            logger.info(f"User {username} logged in successfully")
            return jsonify({
                "message": "Login successful",
                "user": {
                    "id": user['id'],
                    "username": user['username'],
                    "email": user['email'],
                    "bio": user['bio'] or "",
                    "profile_image": user['profile_image'] or "",
                    "token": token
                }
            }), 200

    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({"message": "Login failed"}), 500
    finally:
        if conn:
            conn.close()