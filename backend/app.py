from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from utils.db_utils import fetch_all  # Import db functions
import os  # Import the os module

app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# --- Serve the React App ---
@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')
# --- Fallback route for React Router ---
@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')
# --- API Endpoints for data retrieval ---
@app.route('/api/cleaned_bibliometric_data', methods=['GET'])
def get_cleaned_bibliometric_data():
    """Returns all data from the cleaned_bibliometric_data table."""
    data = fetch_all("cleaned_bibliometric_data")
    if data:
        data_list = []
        for item in data:
            item_dict = {
                "id": item[0],
                "author": item[1],
                "title": item[2],
                "doi": item[3],
                "year": item[4]
            }
            data_list.append(item_dict)
        return jsonify(data_list)
    else:
        return jsonify({"error": "Could not retrieve data"}), 500

@app.route('/api/crossref_data_multiple_subjects', methods=['GET'])
def get_crossref_data_multiple_subjects():
    """Returns all data from the crossref_data_multiple_subjects table."""
    data = fetch_all("crossref_data_multiple_subjects")
    if data:
        data_list = []
        for item in data:
            item_dict = {
                "id": item[0],
                "subject": item[1],
                "title": item[2],
                "authors": item[3],
                "year": item[4],
                "citation_count": item[5],
                "cited_by": item[6],
                "research_method": item[7],
                "doi": item[8]
            }
            data_list.append(item_dict)
        return jsonify(data_list)
    else:
        return jsonify({"error": "Could not retrieve data"}), 500

@app.route('/api/google_scholar_data', methods=['GET'])
def get_google_scholar_data():
    """Returns all data from the google_scholar_data table."""
    data = fetch_all("google_scholar_data")
    if data:
        data_list = []
        for item in data:
            item_dict = {
                "id": item[0],
                "author_name": item[1],
                "title": item[2],
                "year": item[3],
                "cited_by": item[4],
                "subject_of_study": item[5],
                "research_method": item[6]
            }
            data_list.append(item_dict)
        return jsonify(data_list)
    else:
        return jsonify({"error": "Could not retrieve data"}), 500

@app.route('/api/openalex_data', methods=['GET'])
def get_openalex_data():
    """Returns all data from the openalex_data table."""
    data = fetch_all("openalex_data")
    if data:
        data_list = []
        for item in data:
            item_dict = {
                "id": item[0],
                "subject": item[1],
                "title": item[2],
                "year": item[3],
                "citations": item[4],
                "research_method": item[5],
                "doi": item[6]
            }
            data_list.append(item_dict)
        return jsonify(data_list)
    else:
        return jsonify({"error": "Could not retrieve data"}), 500

@app.route('/api/scopus_data', methods=['GET'])
def get_scopus_data():
    """Returns all data from the scopus_data table."""
    data = fetch_all("scopus_data")
    if data:
        data_list = []
        for item in data:
            item_dict = {
                "id": item[0],
                "book_title": item[1],
                "p_isbn": item[2],
                "e_isbn": item[3],
                "publication_year": item[4],
                "publisher": item[5],
                "asjc": item[6],
                "scopus_id": item[7],
                "scopus_load_date": item[8]
            }
            data_list.append(item_dict)
        return jsonify(data_list)
    else:
        return jsonify({"error": "Could not retrieve data"}), 500

@app.route('/api/scopus_data_sept', methods=['GET'])
def get_scopus_data_sept():
    """Returns all data from the scopus_data_sept table."""
    data = fetch_all("scopus_data_sept")
    if data:
        data_list = []
        for item in data:
            item_dict = {
                "id": item[0],
                "book_title": item[1],
                "p_isbn": item[2],
                "e_isbn": item[3],
                "publication_year": item[4],
                "publisher": item[5],
                "asjc": item[6],
                "scopus_id": item[7],
                "scopus_load_date": item[8]
            }
            data_list.append(item_dict)
        return jsonify(data_list)
    else:
        return jsonify({"error": "Could not retrieve data"}), 500

@app.route('/api/search', methods=['GET'])
def api_search():
    """Performs the database search and returns the results as JSON."""
    query = request.args.get('query')
    if not query:
        return jsonify({"error": "No query provided"}), 400  # Bad Request

    # Temporarily simplify the response
    results = [{
        "title": "Test Title",
        "author": "Test Author",
        "published": "Test Published",
        "journal": "Test Journal",
        "identifiers": "Test Identifiers"
    }]
    return jsonify(results)

# Add more API endpoints for other tables as needed

if __name__ == '__main__':
    app.run(debug=True, port=5000)