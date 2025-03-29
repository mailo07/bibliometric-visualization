from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from utils.db_utils import fetch_all, fetch_filtered  # Import db functions
import os

app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')
CORS(app)

# --- Serve the React App ---
@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

# --- Fallback route for React Router ---
@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')

# --- API Endpoints for static data retrieval ---
@app.route('/api/cleaned_bibliometric_data', methods=['GET'])
def get_cleaned_bibliometric_data():
    data = fetch_all("cleaned_bibliometric_data")
    if data:
        return jsonify([{
            "id": item[0],
            "author": item[1],
            "title": item[2],
            "doi": item[3],
            "year": item[4]
        } for item in data])
    return jsonify({"error": "Could not retrieve data"}), 500

@app.route('/api/crossref_data_multiple_subjects', methods=['GET'])
def get_crossref_data_multiple_subjects():
    data = fetch_all("crossref_data_multiple_subjects")
    if data:
        return jsonify([{
            "id": item[0],
            "subject": item[1],
            "title": item[2],
            "authors": item[3],
            "year": item[4],
            "citation_count": item[5],
            "cited_by": item[6],
            "research_method": item[7],
            "doi": item[8]
        } for item in data])
    return jsonify({"error": "Could not retrieve data"}), 500

@app.route('/api/google_scholar_data', methods=['GET'])
def get_google_scholar_data():
    data = fetch_all("google_scholar_data")
    if data:
        return jsonify([{
            "id": item[0],
            "author_name": item[1],
            "title": item[2],
            "year": item[3],
            "cited_by": item[4],
            "subject_of_study": item[5],
            "research_method": item[6]
        } for item in data])
    return jsonify({"error": "Could not retrieve data"}), 500

@app.route('/api/openalex_data', methods=['GET'])
def get_openalex_data():
    data = fetch_all("openalex_data")
    if data:
        return jsonify([{
            "id": item[0],
            "subject": item[1],
            "title": item[2],
            "year": item[3],
            "citations": item[4],
            "research_method": item[5],
            "doi": item[6]
        } for item in data])
    return jsonify({"error": "Could not retrieve data"}), 500

@app.route('/api/scopus_data', methods=['GET'])
def get_scopus_data():
    data = fetch_all("scopus_data")
    if data:
        return jsonify([{
            "id": item[0],
            "book_title": item[1],
            "p_isbn": item[2],
            "e_isbn": item[3],
            "publication_year": item[4],
            "publisher": item[5],
            "asjc": item[6],
            "scopus_id": item[7],
            "scopus_load_date": item[8]
        } for item in data])
    return jsonify({"error": "Could not retrieve data"}), 500

@app.route('/api/scopus_data_sept', methods=['GET'])
def get_scopus_data_sept():
    data = fetch_all("scopus_data_sept")
    if data:
        return jsonify([{
            "id": item[0],
            "book_title": item[1],
            "p_isbn": item[2],
            "e_isbn": item[3],
            "publication_year": item[4],
            "publisher": item[5],
            "asjc": item[6],
            "scopus_id": item[7],
            "scopus_load_date": item[8]
        } for item in data])
    return jsonify({"error": "Could not retrieve data"}), 500
# --- Search API across 5 major tables ---
@app.route('/api/search', methods=['GET'])
def api_search():
    query = request.args.get('query')
    if not query:
        return jsonify({"error": "No query provided"}), 400

    sql = '''
        SELECT 'cleaned' AS source, id, author, title, year, doi, NULL AS extra1, NULL AS extra2
        FROM cleaned_bibliometric_data
        WHERE title ILIKE %s OR author ILIKE %s
        UNION
        SELECT 'crossref' AS source, id, authors AS author, title, year, doi, subject AS extra1, research_method AS extra2
        FROM crossref_data_multiple_subjects
        WHERE title ILIKE %s OR authors ILIKE %s
        UNION
        SELECT 'google_scholar' AS source, id, author_name, title, year, NULL, subject_of_study AS extra1, research_method AS extra2
        FROM google_scholar_data
        WHERE title ILIKE %s OR author_name ILIKE %s
        UNION
        SELECT 'openalex' AS source, id, NULL, title, year, doi, subject AS extra1, research_method AS extra2
        FROM openalex_data
        WHERE title ILIKE %s
        UNION
        SELECT 'scopus' AS source, id, publisher, book_title, publication_year, NULL, p_isbn AS extra1, e_isbn AS extra2
        FROM scopus_data
        WHERE book_title ILIKE %s OR publisher ILIKE %s
    '''

    like = f"%{query}%"
    values = [like] * 9  # ✅ Corrected: match exactly 9 %s

    results = fetch_filtered(sql, values)

    formatted = []
    for row in results:
        formatted.append({
            "title": row[3],
            "author": row[2] or "N/A",
            "published": row[4],
            "journal": row[6] or "N/A",
            "identifiers": row[5] or "N/A",
            "source": row[0]
        })

    return jsonify(formatted)
 


# --- Run the Flask App ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)
