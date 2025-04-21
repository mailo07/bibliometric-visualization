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

# Set up logging
logger = logging.getLogger(__name__)

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get the current user's profile information"""
    try:
        logger.info("Profile route accessed")
        # Get the user ID from the JWT token
        current_user_id = get_jwt_identity()
        logger.info(f"User ID from token: {current_user_id}")
        
        # Query the user from the database
        user = User.query.get(current_user_id)
        
        if not user:
            logger.error(f"User with ID {current_user_id} not found")
            return jsonify({'error': 'User not found'}), 404
        
        # Return the user profile data
        return jsonify({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'full_name': user.full_name,
            'bio': user.bio,
            'location': user.location,
            'profile_picture': user.profile_picture
        }), 200
    
    except Exception as e:
        logger.error(f"Error in get_profile: {str(e)}")
        return jsonify({'error': str(e)}), 500

@profile_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update the current user's profile information"""
    try:
        # Get the user ID from the JWT token
        current_user_id = get_jwt_identity()
        logger.info(f"Updating profile for user {current_user_id}")
        
        # Query the user from the database
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get the request data
        data = request.json
        logger.info(f"Update data: {data}")
        
        # Update user fields if they exist in the request
        if 'fullName' in data:
            user.full_name = data['fullName']
        
        if 'email' in data:
            # Check if email is already taken
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user and existing_user.id != current_user_id:
                return jsonify({'error': 'Email already in use'}), 422
            user.email = data['email']
        
        if 'username' in data:
            # Check if username is already taken
            existing_user = User.query.filter_by(username=data['username']).first()
            if existing_user and existing_user.id != current_user_id:
                return jsonify({'error': 'Username already in use'}), 422
            user.username = data['username']
        
        if 'bio' in data:
            user.bio = data['bio']
        
        if 'location' in data:
            user.location = data['location']
        
        # Save changes to database
        db.session.commit()
        logger.info(f"Profile updated for user {current_user_id}")
        
        # Return the updated user profile
        return jsonify({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'full_name': user.full_name,
            'bio': user.bio,
            'location': user.location,
            'profile_picture': user.profile_picture
        }), 200
    
    except Exception as e:
        logger.error(f"Error in update_profile: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@profile_bp.route('/profile/picture', methods=['POST'])
@jwt_required()
def update_profile_picture():
    """Update the user's profile picture"""
    try:
        # Get the user ID from the JWT token
        current_user_id = get_jwt_identity()
        logger.info(f"Updating profile picture for user {current_user_id}")
        
        # Query the user from the database
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if a file was uploaded
        if 'profilePicture' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['profilePicture']
        
        # If the user does not select a file, the browser submits an
        # empty file without a filename.
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Check if file is allowed
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
        if not '.' in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Generate a secure filename
        filename = secure_filename(file.filename)
        # Add a unique identifier to avoid filename collisions
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        
        # Delete old profile picture if it exists
        if user.profile_picture:
            try:
                old_file_path = os.path.join(Config.UPLOAD_FOLDER, user.profile_picture)
                if os.path.exists(old_file_path):
                    os.remove(old_file_path)
            except Exception as e:
                # Log the error but continue with the update
                logger.error(f"Error removing old profile picture: {str(e)}")
        
        # Save the new file
        file_path = os.path.join(Config.UPLOAD_FOLDER, unique_filename)
        file.save(file_path)
        logger.info(f"Saved new profile picture: {unique_filename}")
        
        # Update the user's profile picture in the database
        user.profile_picture = unique_filename
        db.session.commit()
        
        return jsonify({
            'message': 'Profile picture updated successfully',
            'profile_picture': unique_filename
        }), 200
    
    except Exception as e:
        logger.error(f"Error in update_profile_picture: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@profile_bp.route('/password', methods=['PUT'])
@jwt_required()
def change_password():
    """Change the user's password"""
    try:
        # Get the user ID from the JWT token
        current_user_id = get_jwt_identity()
        logger.info(f"Changing password for user {current_user_id}")
        
        # Query the user from the database
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get the request data
        data = request.json
        
        # Validate the request data
        if not data or 'currentPassword' not in data or 'newPassword' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if the current password is correct
        if not check_password_hash(user.password_hash, data['currentPassword']):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Validate the new password
        if len(data['newPassword']) < 8:
            return jsonify({'error': 'Password must be at least 8 characters long'}), 400
        
        # Update the password
        user.password_hash = generate_password_hash(data['newPassword'])
        db.session.commit()
        logger.info(f"Password updated for user {current_user_id}")
        
        return jsonify({'message': 'Password updated successfully'}), 200
    
    except Exception as e:
        logger.error(f"Error in change_password: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500