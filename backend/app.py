from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from utils.db_utils import fetch_all, fetch_filtered
import os
import psutil
import time
from datetime import datetime

app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')
CORS(app)

# ======================
# System Monitoring Endpoints (Real Data)
# ======================

@app.route('/api/admin/system-health', methods=['GET'])
def get_system_health():
    """Endpoint to fetch real system health metrics"""
    try:
        # CPU Metrics
        cpu_usage = psutil.cpu_percent(interval=1)
        cpu_freq = psutil.cpu_freq().current if hasattr(psutil, 'cpu_freq') else None
        
        # Memory Metrics
        memory = psutil.virtual_memory()
        swap = psutil.swap_memory()
        
        # Disk Metrics
        disk = psutil.disk_usage('/')
        disk_io = psutil.disk_io_counters()
        
        # Network Metrics
        net_io = psutil.net_io_counters()
        
        # System Info
        boot_time = datetime.fromtimestamp(psutil.boot_time())
        uptime = str(datetime.now() - boot_time).split('.')[0]
        process_count = len(psutil.pids())
        
        # Temperature (Linux only)
        cpu_temp = None
        if hasattr(psutil, 'sensors_temperatures'):
            try:
                temps = psutil.sensors_temperatures()
                if 'coretemp' in temps:
                    cpu_temp = temps['coretemp'][0].current
            except:
                pass

        # Status determination
        def get_status(value, warning, critical):
            return 'critical' if value >= critical else 'warning' if value >= warning else 'normal'

        return jsonify({
            'cpu': {
                'usage': cpu_usage,
                'cores': psutil.cpu_count(logical=False),
                'threads': psutil.cpu_count(logical=True),
                'frequency': cpu_freq,
                'temperature': cpu_temp,
                'status': get_status(cpu_usage, 70, 90)
            },
            'memory': {
                'total': memory.total,
                'available': memory.available,
                'used': memory.used,
                'percent': memory.percent,
                'swap_total': swap.total,
                'swap_used': swap.used,
                'status': get_status(memory.percent, 75, 90)
            },
            'disk': {
                'total': disk.total,
                'used': disk.used,
                'free': disk.free,
                'percent': disk.percent,
                'read_bytes': disk_io.read_bytes if disk_io else 0,
                'write_bytes': disk_io.write_bytes if disk_io else 0,
                'status': get_status(disk.percent, 80, 95)
            },
            'network': {
                'bytes_sent': net_io.bytes_sent,
                'bytes_recv': net_io.bytes_recv,
                'packets_sent': net_io.packets_sent,
                'packets_recv': net_io.packets_recv,
                'status': 'normal'  # Network status needs custom logic
            },
            'system': {
                'uptime': uptime,
                'processes': process_count,
                'boot_time': boot_time.isoformat(),
                'os': os.name,
                'platform': os.uname().sysname if hasattr(os, 'uname') else None
            },
            'timestamp': datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e), 'message': 'Failed to collect system metrics'}), 500

@app.route('/api/admin/activity-logs', methods=['GET'])
def get_activity_logs():
    """Endpoint to fetch real system activity logs"""
    try:
        logs = []
        # Get recent processes
        for proc in psutil.process_iter(['pid', 'name', 'username', 'create_time', 'status']):
            try:
                logs.append({
                    'event': f"Process {proc.info['name']} ({proc.info['pid']})",
                    'type': 'Info',
                    'service': proc.info['username'] or 'system',
                    'status': proc.info['status'],
                    'timestamp': proc.info['create_time']
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        
        # Get recent connections
        try:
            for conn in psutil.net_connections(kind='inet'):
                if conn.status == 'ESTABLISHED':
                    logs.append({
                        'event': f"Connection {conn.laddr.ip}:{conn.laddr.port} to {conn.raddr.ip}:{conn.raddr.port if conn.raddr else ''}",
                        'type': 'Network',
                        'service': conn.pid or 'system',
                        'status': conn.status,
                        'timestamp': time.time()
                    })
        except:
            pass
        
        # Sort by timestamp and limit to 50 most recent
        logs = sorted(logs, key=lambda x: x['timestamp'], reverse=True)[:50]
        
        return jsonify(logs), 200
    except Exception as e:
        return jsonify({'error': str(e), 'message': 'Failed to collect activity logs'}), 500

# ======================
# Original Endpoints (Completely Unchanged)
# ======================

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')

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
    values = [like] * 9

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

if __name__ == '__main__':
    app.run(debug=True, port=5000)