import psycopg2

# Database credentials
DB_NAME = "bibliometric_data"
DB_USER = "postgres"
DB_PASS = "vivo18#"
DB_HOST = "localhost"  # Change this if your database is hosted elsewhere
DB_PORT = "8080"

def connect_to_db():
    """Connects to the PostgreSQL database."""
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            host=DB_HOST,
            port=DB_PORT
        )
        return conn
    except psycopg2.Error as e:
        print(f"Error connecting to database: {e}")
        return None

def fetch_all(table_name):
    """Fetches all rows from a given table."""
    conn = connect_to_db()
    if conn is None:
        return None
    try:
        cur = conn.cursor()
        query = f"SELECT * FROM {table_name};"
        cur.execute(query)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return rows
    except psycopg2.Error as e:
        print(f"Error fetching data from {table_name}: {e}")
        return None

def insert_data(table_name, data):
    """Inserts data into a given table."""
    conn = connect_to_db()
    if conn is None:
        return None
    try:
        cur = conn.cursor()
        columns = ', '.join(data.keys())
        values = ', '.join(['%s'] * len(data))
        query = f"INSERT INTO {table_name} ({columns}) VALUES ({values});"
        cur.execute(query, list(data.values()))
        conn.commit()
        cur.close()
        conn.close()
        return True
    except psycopg2.Error as e:
        print(f"Error inserting data into {table_name}: {e}")
        return False

def fetch_by_id(table_name, id_value):
    """Fetches a row from a table based on its ID."""
    conn = connect_to_db()
    if conn is None:
        return None
    try:
        cur = conn.cursor()
        id_column = "id"  # Assuming 'id' is the primary key column name
        query = f"SELECT * FROM {table_name} WHERE {id_column} = %s;"
        cur.execute(query, (id_value,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        return row
    except psycopg2.Error as e:
        print(f"Error fetching data from {table_name}: {e}")
        return None

def fetch_filtered(query, params):
    """Executes a custom SQL query with parameters and returns the results."""
    conn = connect_to_db()
    if conn is None:
        return []
    try:
        cur = conn.cursor()
        cur.execute(query, params)  # DO NOT use % here
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return rows
    except psycopg2.Error as e:
        print(f"Error executing filtered query: {e}")
        return []
