import csv
from utils.db_utils import connect_to_db, insert_data  # Import db functions

def load_data_from_csv(file_path, table_name):
    """Loads data from a CSV file into a PostgreSQL table."""
    conn = connect_to_db()
    if conn is None:
        return False

    try:
        cur = conn.cursor()
        with open(file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            if reader.fieldnames is None:
                print(f"Error: No header found in CSV file: {file_path}")
                return False
            
            # Convert column names to lowercase to match database columns (optional)
            columns = [col.lower() for col in reader.fieldnames]
            
            for row in reader:
                # Create a dictionary with lowercase keys
                data = {columns[i]: row[reader.fieldnames[i]] for i in range(len(columns))}

                if insert_data(table_name, data):
                    print(f"Inserted row into {table_name}")
                else:
                    print(f"Failed to insert row into {table_name}")

        conn.commit()
        cur.close()
        conn.close()
        return True

    except FileNotFoundError:
        print(f"Error: File not found at {file_path}")
        return False
    except Exception as e:
        print(f"Error loading data from CSV: {e}")
        return False


if __name__ == '__main__':
    # Example usage:
    # Replace with your actual file paths and table names
    csv_file_path = "data/cleaned_bibliometric_data.csv"  # Example file
    table_name = "cleaned_bibliometric_data"  # Example table

    if load_data_from_csv(csv_file_path, table_name):
        print("Data loading complete!")
    else:
        print("Data loading failed.")