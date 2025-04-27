from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from extensions import db
import os
from werkzeug.utils import secure_filename
from config import Config
from werkzeug.security import check_password_hash, generate_password_hash
import uuid
import logging
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

# Configure logging with more details
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get the current user's profile information"""
    try:
        current_user_id = get_jwt_identity()
        logger.info(f"Fetching profile for user ID: {current_user_id}")
        
        user = User.query.get(current_user_id)
        
        if not user:
            logger.error(f"User not found: {current_user_id}")
            return jsonify({'error': 'User not found'}), 404
        
        # Prepare response data
        response_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'full_name': user.full_name,
            'bio': user.bio,
            'location': user.location,
            'profile_picture': user.profile_picture,
            'member_since': user.member_since.isoformat() if user.member_since else None,
            'occupation': user.occupation
        }
        logger.info(f"Returning profile data for user {user.username}")
        
        return jsonify(response_data), 200
    
    except Exception as e:
        logger.error(f"Error in get_profile: {str(e)}", exc_info=True)
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@profile_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update the current user's profile information"""
    try:
        current_user_id = get_jwt_identity()
        logger.info(f"Updating profile for user ID: {current_user_id}")
        
        user = User.query.get(current_user_id)
        
        if not user:
            logger.error(f"User not found for update: {current_user_id}")
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        if not data:
            logger.warning(f"No data provided for profile update: {current_user_id}")
            return jsonify({'error': 'No data provided'}), 400

        # Field updates with validation
        updates = {}
        # Handle both camelCase (frontend) and snake_case (backend) field names
        if 'fullName' in data or 'full_name' in data:
            updates['full_name'] = data.get('fullName') or data.get('full_name')
        if 'email' in data:
            updates['email'] = data['email']
        if 'username' in data:
            updates['username'] = data['username']
        if 'bio' in data:
            updates['bio'] = data['bio']
        if 'location' in data:
            updates['location'] = data['location']
        if 'occupation' in data:
            updates['occupation'] = data['occupation']

        logger.info(f"Profile update fields: {', '.join(updates.keys())}")

        # Validate email/username uniqueness
        if 'email' in updates and updates['email'] != user.email:
            if User.query.filter(User.email == updates['email'], User.id != user.id).first():
                logger.warning(f"Email already in use: {updates['email']}")
                return jsonify({'error': 'Email already in use', 'field': 'email'}), 409
                
        if 'username' in updates and updates['username'] != user.username:
            if User.query.filter(User.username == updates['username'], User.id != user.id).first():
                logger.warning(f"Username already in use: {updates['username']}")
                return jsonify({'error': 'Username already in use', 'field': 'username'}), 409

        if not updates:
            logger.info(f"No changes detected for user: {current_user_id}")
            return jsonify({'message': 'No changes detected'}), 200

        # Apply updates
        for key, value in updates.items():
            setattr(user, key, value)

        db.session.commit()
        logger.info(f"Profile updated successfully for user: {user.username}")
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
                'bio': user.bio,
                'location': user.location,
                'profile_picture': user.profile_picture,
                'occupation': user.occupation
            }
        }), 200
    
    except IntegrityError as e:
        db.session.rollback()
        logger.error(f"Integrity error in update_profile: {str(e)}")
        return jsonify({'error': 'Database integrity error: Duplicate entry or invalid data'}), 500
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Database error in update_profile: {str(e)}")
        return jsonify({'error': 'Database operation failed'}), 500
    except Exception as e:
        db.session.rollback()
        logger.error(f"Unexpected error in update_profile: {str(e)}", exc_info=True)
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@profile_bp.route('/profile/picture', methods=['POST'])
@jwt_required()
def update_profile_picture():
    """Update the user's profile picture"""
    try:
        current_user_id = get_jwt_identity()
        logger.info(f"Updating profile picture for user ID: {current_user_id}")
        
        user = User.query.get(current_user_id)
        
        if not user:
            logger.error(f"User not found for picture update: {current_user_id}")
            return jsonify({'error': 'User not found'}), 404
        
        if 'profilePicture' not in request.files:
            logger.warning("No profile picture file in request")
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['profilePicture']
        
        if file.filename == '':
            logger.warning("Empty filename in profile picture request")
            return jsonify({'error': 'No file selected'}), 400
        
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
        if not '.' in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
            logger.warning(f"Invalid file type for profile picture: {file.filename}")
            return jsonify({'error': 'File type not allowed. Please use JPG, PNG or GIF'}), 400
        
        # Ensure upload directory exists
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        
        # Generate unique filename
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        
        # Handle existing profile picture
        if user.profile_picture:
            try:
                old_file_path = os.path.join(Config.UPLOAD_FOLDER, user.profile_picture)
                if os.path.exists(old_file_path):
                    os.remove(old_file_path)
                    logger.info(f"Removed old profile picture: {user.profile_picture}")
            except Exception as e:
                logger.error(f"Error removing old profile picture: {str(e)}")
        
        # Save new picture
        file_path = os.path.join(Config.UPLOAD_FOLDER, unique_filename)
        file.save(file_path)
        logger.info(f"Saved new profile picture: {unique_filename}")
        
        user.profile_picture = unique_filename
        db.session.commit()
        
        return jsonify({
            'message': 'Profile picture updated successfully',
            'profile_picture': unique_filename
        }), 200
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error in update_profile_picture: {str(e)}", exc_info=True)
        return jsonify({'error': f'Failed to update profile picture: {str(e)}'}), 500

@profile_bp.route('/password', methods=['PUT'])
@jwt_required()
def change_password():
    """Change the user's password"""
    try:
        current_user_id = get_jwt_identity()
        logger.info(f"Password change request for user ID: {current_user_id}")
        
        user = User.query.get(current_user_id)
        
        if not user:
            logger.error(f"User not found for password change: {current_user_id}")
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        if not data or 'currentPassword' not in data or 'newPassword' not in data:
            logger.warning("Missing password fields in request")
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check current password
        if not check_password_hash(user.password_hash, data['currentPassword']):
            logger.warning(f"Incorrect current password for user: {user.username}")
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Validate new password
        if len(data['newPassword']) < 8:
            logger.warning("New password too short")
            return jsonify({'error': 'Password must be at least 8 characters long'}), 400
        
        # Update password
        user.password_hash = generate_password_hash(data['newPassword'])
        db.session.commit()
        logger.info(f"Password updated successfully for user: {user.username}")
        
        return jsonify({'message': 'Password updated successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error in change_password: {str(e)}", exc_info=True)
        return jsonify({'error': f'Failed to update password: {str(e)}'}), 500