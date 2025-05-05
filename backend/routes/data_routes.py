# routes/data_routes.py
from flask import Blueprint, jsonify
from utils.db_utils import fetch_all

data_bp = Blueprint('data', __name__)

@data_bp.route('/cleaned_bibliometric_data', methods=['GET'])
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

@data_bp.route('/crossref_data_multiple_subjects', methods=['GET'])
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

@data_bp.route('/google_scholar_data', methods=['GET'])
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

@data_bp.route('/openalex_data', methods=['GET'])
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

@data_bp.route('/scopus_data', methods=['GET'])
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

@data_bp.route('/scopus_data_sept', methods=['GET'])
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