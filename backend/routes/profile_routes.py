from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
from werkzeug.utils import secure_filename
from werkzeug.security import check_password_hash, generate_password_hash
import uuid
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
import traceback
from config import Config

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

profile_bp = Blueprint('profile', __name__)

def get_db_connection():
    """Create a connection to the PostgreSQL database"""
    try:
        conn = psycopg2.connect(
            dbname=Config.DB_NAME,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            host=Config.DB_HOST,
            port=Config.DB_PORT
        )
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        return None

@profile_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get the current user's profile information"""
    try:
        current_user_id = get_jwt_identity()
        logger.debug(f"Fetching profile for user ID: {current_user_id}")
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
            
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT id, username, email, bio, profile_image, created_at
                    FROM users 
                    WHERE id = %s
                """, (current_user_id,))
                
                user = cur.fetchone()
                
                if not user:
                    logger.error(f"User not found: {current_user_id}")
                    return jsonify({'error': 'User not found'}), 404
                
                # Prepare response data - map DB columns to frontend expectations
                # Include placeholders for fields that don't exist in your schema
                response_data = {
                    'id': user['id'],
                    'username': user['username'],
                    'email': user['email'],
                    'full_name': "",  # Not in your schema
                    'bio': user['bio'] or "",
                    'location': "",  # Not in your schema
                    'profile_picture': user['profile_image'] or "",
                    'member_since': user['created_at'].isoformat() if user['created_at'] else None,
                    'occupation': ""  # Not in your schema
                }
                
                logger.debug(f"Returning profile data for user {user['username']}")
                return jsonify(response_data), 200
                
        except Exception as e:
            logger.error(f"Database query error: {e}")
            logger.error(traceback.format_exc())
            return jsonify({'error': f'Database error: {str(e)}'}), 500
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Error in get_profile: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@profile_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update the current user's profile information"""
    try:
        current_user_id = get_jwt_identity()
        logger.debug(f"Updating profile for user ID: {current_user_id}")
        
        # Get the request data
        data = request.get_json()
        if not data:
            logger.warning(f"No data provided for profile update: {current_user_id}")
            return jsonify({'error': 'No data provided'}), 400

        # Log the received data for debugging
        logger.debug(f"Profile update request data: {data}")
        
        # Connect to the database
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
            
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # First, check if the user exists and get their current data
                cur.execute(
                    "SELECT id, username, email, bio, profile_image FROM users WHERE id = %s",
                    (current_user_id,)
                )
                user = cur.fetchone()
                
                if not user:
                    logger.error(f"User not found for update: {current_user_id}")
                    return jsonify({'error': 'User not found'}), 404
                
                logger.debug(f"Current user data: {user}")
                
                # Track what fields can be updated based on your actual schema
                valid_fields = ['username', 'email', 'bio']
                update_fields = []
                values = []
                
                # Analyze and prepare the update data
                if 'username' in data or 'userName' in data:
                    new_username = data.get('username', data.get('userName', user['username']))
                    # Check if username changed and if it's already taken
                    if new_username != user['username']:
                        cur.execute("SELECT id FROM users WHERE username = %s AND id != %s", 
                                  (new_username, current_user_id))
                        if cur.fetchone():
                            return jsonify({'error': 'Username already exists'}), 409
                    update_fields.append("username = %s")
                    values.append(new_username)
                
                if 'email' in data:
                    new_email = data.get('email')
                    # Check if email changed and if it's already taken
                    if new_email != user['email']:
                        cur.execute("SELECT id FROM users WHERE email = %s AND id != %s", 
                                  (new_email, current_user_id))
                        if cur.fetchone():
                            return jsonify({'error': 'Email already exists'}), 409
                    update_fields.append("email = %s")
                    values.append(new_email)
                
                if 'bio' in data:
                    update_fields.append("bio = %s")
                    values.append(data.get('bio', ''))
                
                # Handle other fields that might come from frontend but aren't in your schema
                for field in ['full_name', 'fullName', 'location', 'occupation']:
                    if field in data:
                        logger.debug(f"Ignoring field {field} as it's not in the schema")
                
                # Check if there are any fields to update
                if not update_fields:
                    logger.info("No fields to update")
                    return jsonify({
                        'message': 'No changes detected',
                        'user': {
                            'id': user['id'],
                            'username': user['username'],
                            'email': user['email'],
                            'bio': user['bio'] or "",
                            'profile_picture': user['profile_image'] or "",
                            'full_name': "",  # Placeholder for frontend
                            'location': "",    # Placeholder for frontend
                            'occupation': ""   # Placeholder for frontend
                        }
                    }), 200
                
                # Construct and execute the update query
                query = f"""
                    UPDATE users
                    SET {', '.join(update_fields)}
                    WHERE id = %s
                    RETURNING id, username, email, bio, profile_image
                """
                values.append(current_user_id)
                
                logger.debug(f"Update query: {query}")
                logger.debug(f"Update values: {values}")
                
                cur.execute(query, values)
                updated_user = cur.fetchone()
                conn.commit()
                
                if not updated_user:
                    logger.error("Update failed - no rows returned")
                    return jsonify({'error': 'Failed to update profile'}), 500
                
                # Prepare the response
                response_data = {
                    'message': 'Profile updated successfully',
                    'user': {
                        'id': updated_user['id'],
                        'username': updated_user['username'],
                        'email': updated_user['email'],
                        'bio': updated_user['bio'] or "",
                        'profile_picture': updated_user['profile_image'] or "",
                        'full_name': "",  # Placeholder for frontend
                        'location': "",    # Placeholder for frontend
                        'occupation': ""   # Placeholder for frontend
                    }
                }
                
                logger.debug(f"Profile update successful for {updated_user['username']}")
                return jsonify(response_data), 200
                
        except Exception as e:
            conn.rollback()
            logger.error(f"Database error in update_profile: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({'error': f'Database error: {str(e)}'}), 500
        finally:
            conn.close()
    except Exception as e:
        logger.error(f"Error in update_profile: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@profile_bp.route('/profile/picture', methods=['POST'])
@jwt_required()
def update_profile_picture():
    """Update the user's profile picture"""
    try:
        current_user_id = get_jwt_identity()
        logger.debug(f"Updating profile picture for user ID: {current_user_id}")
        
        # Check if the post request has the file part
        logger.debug(f"Request files: {request.files}")
        
        # Handle both 'profilePicture' and 'profile_picture' field names
        file = None
        if 'profilePicture' in request.files:
            file = request.files['profilePicture']
        elif 'profile_picture' in request.files:
            file = request.files['profile_picture']
        else:
            logger.warning("No profile picture file in request")
            return jsonify({'error': 'No file uploaded'}), 400
        
        if file.filename == '':
            logger.warning("Empty filename in profile picture request")
            return jsonify({'error': 'No file selected'}), 400
        
        logger.debug(f"Received file: {file.filename}")
        
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
        if not '.' in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
            logger.warning(f"Invalid file type for profile picture: {file.filename}")
            return jsonify({'error': 'File type not allowed. Please use JPG, PNG or GIF'}), 400
        
        # Ensure upload directory exists
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        
        # Generate unique filename
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
            
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Check if user exists
                cur.execute("SELECT id, profile_image FROM users WHERE id = %s", (current_user_id,))
                user = cur.fetchone()
                
                if not user:
                    logger.error(f"User not found for picture update: {current_user_id}")
                    return jsonify({'error': 'User not found'}), 404
                
                # Handle existing profile picture
                if user['profile_image']:
                    try:
                        old_file_path = os.path.join(Config.UPLOAD_FOLDER, user['profile_image'])
                        if os.path.exists(old_file_path):
                            os.remove(old_file_path)
                            logger.info(f"Removed old profile picture: {user['profile_image']}")
                    except Exception as e:
                        logger.error(f"Error removing old profile picture: {str(e)}")
                
                # Save new picture
                file_path = os.path.join(Config.UPLOAD_FOLDER, unique_filename)
                file.save(file_path)
                logger.info(f"Saved new profile picture: {unique_filename}")
                
                # Update database with new profile image
                cur.execute(
                    "UPDATE users SET profile_image = %s WHERE id = %s",
                    (unique_filename, current_user_id)
                )
                conn.commit()
                
                return jsonify({
                    'message': 'Profile picture updated successfully',
                    'profile_picture': unique_filename
                }), 200
                
        except Exception as e:
            conn.rollback()
            logger.error(f"Database error in update_profile_picture: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({'error': f'Database operation failed: {str(e)}'}), 500
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Error in update_profile_picture: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': f'Failed to update profile picture: {str(e)}'}), 500

@profile_bp.route('/password', methods=['PUT'])
@jwt_required()
def change_password():
    """Change the user's password"""
    try:
        current_user_id = get_jwt_identity()
        logger.debug(f"Password change request for user ID: {current_user_id}")
        
        data = request.get_json()
        logger.debug(f"Password change request data: {data}")
        
        if not data or 'currentPassword' not in data or 'newPassword' not in data:
            logger.warning("Missing password fields in request")
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Validate new password
        if len(data['newPassword']) < 8:
            logger.warning("New password too short")
            return jsonify({'error': 'Password must be at least 8 characters long'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
            
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Get current user
                cur.execute("SELECT id, username, password FROM users WHERE id = %s", (current_user_id,))
                user = cur.fetchone()
                
                if not user:
                    logger.error(f"User not found for password change: {current_user_id}")
                    return jsonify({'error': 'User not found'}), 404
                
                # Check current password
                is_valid = check_password_hash(user['password'], data['currentPassword'])
                logger.debug(f"Current password validation: {is_valid}")
                
                if not is_valid:
                    logger.warning(f"Incorrect current password for user: {user['username']}")
                    return jsonify({'error': 'Current password is incorrect'}), 401
                
                # Update password
                hashed_password = generate_password_hash(data['newPassword'])
                cur.execute(
                    "UPDATE users SET password = %s WHERE id = %s",
                    (hashed_password, current_user_id)
                )
                conn.commit()
                
                logger.info(f"Password updated successfully for user: {user['username']}")
                return jsonify({'message': 'Password updated successfully'}), 200
                
        except Exception as e:
            conn.rollback()
            logger.error(f"Database error in change_password: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({'error': f'Database operation failed: {str(e)}'}), 500
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Error in change_password: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': f'Failed to update password: {str(e)}'}), 500