from psycopg2 import sql
from services.database import DatabaseService

def fetch_all(table_name):
    """Fetches all rows from a given table."""
    db = DatabaseService()
    query = sql.SQL("SELECT * FROM {}").format(sql.Identifier(table_name))
    return db.execute_query(query)

def fetch_filtered(table_name, filters=None):
    """Fetches filtered data from a table based on provided filters."""
    if filters is None:
        return fetch_all(table_name)
    
    db = DatabaseService()
    where_clauses = []
    params = {}
    
    for field, value in filters.items():
        if value is not None:
            where_clauses.append(sql.SQL("{} = %s").format(sql.Identifier(field)))
            params[field] = value
    
    if not where_clauses:
        return fetch_all(table_name)
    
    query = sql.SQL("SELECT * FROM {} WHERE {}").format(
        sql.Identifier(table_name),
        sql.SQL(" AND ").join(where_clauses)
    )
    
    return db.execute_query(query, list(params.values()))

def insert_data(table_name, data):
    """Inserts data into a given table."""
    db = DatabaseService()
    try:
        columns = data.keys()
        values = list(data.values())
        
        query = sql.SQL("INSERT INTO {} ({}) VALUES ({})").format(
            sql.Identifier(table_name),
            sql.SQL(', ').join(map(sql.Identifier, columns)),
            sql.SQL(', ').join(sql.Placeholder() * len(values))
        )
        
        db.execute_query(query, values, fetch=False)
        return True
    except Exception as e:
        print(f"Error inserting data into {table_name}: {e}")
        return False

def fetch_by_id(table_name, id_value, id_column="id"):
    """Fetches a row from a table based on its ID."""
    db = DatabaseService()
    try:
        query = sql.SQL("SELECT * FROM {} WHERE {} = %s").format(
            sql.Identifier(table_name),
            sql.Identifier(id_column)
        )
        result = db.execute_query(query, (id_value,))
        return result[0] if result else None
    except Exception as e:
        print(f"Error fetching data from {table_name}: {e}")
        return None

def execute_custom_query(query, params=None):
    """Executes a custom SQL query with parameters and returns the results."""
    db = DatabaseService()
    try:
        return db.execute_query(query, params or [])
    except Exception as e:
        print(f"Error executing custom query: {e}")
        return []