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
        conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT)
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

# Example usage (you can remove this later)
if __name__ == '__main__':
    # Test connection
    connection = connect_to_db()
    if connection:
        print("Database connection successful!")
        connection.close()

    # Example: Fetch all authors
    authors = fetch_all("authors")
    if authors:
        print("\nAll Authors:")
        for author in authors:
            print(author)

    # Example: Insert a new author
    new_author = {
        "name": "Jane Doe",
        "affiliation": "Example University",
        "publication_count": "10",
        "citations": "100",
        "h_index": "5",
        "keywords": ["keyword1", "keyword2"]
    }
    if insert_data("authors", new_author):
        print("\nNew author inserted successfully!")

    # Example: Fetch author by ID (assuming you know the ID)
    author_id = 1  # Replace with an actual author ID
    author = fetch_by_id("authors", author_id)
    if author:
        print(f"\nAuthor with ID {author_id}:")
        print(author)