from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from routes.auth_routes import auth_bp
from routes.admin_routes import admin_bp
from routes.data_routes import data_bp
from routes.search_routes import search_bp
from services.cache import cache_service
import logging
import os

app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')
CORS(app)

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

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)