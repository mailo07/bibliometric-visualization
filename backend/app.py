from flask import Flask, send_from_directory
from flask_cors import CORS
from routes.auth_routes import auth_bp
from routes.admin_routes import admin_bp
from routes.data_routes import data_bp
from routes.search_routes import search_bp
from routes.profile_routes import profile_bp  # Import the profile blueprint
from services.cache import cache_service
import logging
import os
from flask_jwt_extended import JWTManager
from config import Config
from extensions import db


app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')
app.config.from_object(Config)

# Configure CORS
CORS(app)

# Configure JWT
app.config["JWT_SECRET_KEY"] = Config.SECRET_KEY  # Using SECRET_KEY since JWT_SECRET_KEY isn't defined
app.config["JWT_TOKEN_LOCATION"] = ["headers"]  # Look for tokens in headers
app.config["JWT_HEADER_NAME"] = "Authorization"  # Default header name
app.config["JWT_HEADER_TYPE"] = "Bearer"  # Default header type

# Initialize extensions
jwt = JWTManager(app)
db.init_app(app)
jwt.init_app(app)

CORS(app, resources={r"/*": {"origins": "*"}})

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize cache service
cache_service.init_app(app)

# Initialize search routes cache
from routes.search_routes import init_search_cache
init_search_cache(app)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(data_bp, url_prefix='/api')
app.register_blueprint(search_bp, url_prefix='/api')
app.register_blueprint(profile_bp, url_prefix='/api')  # Register with proper prefix

# Create uploads directory if it doesn't exist
os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

# Serve uploaded files
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(Config.UPLOAD_FOLDER, filename)

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)