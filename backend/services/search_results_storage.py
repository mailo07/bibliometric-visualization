# services/search_results_storage.py
import logging
import json
from services.database import DatabaseService

class SearchResultsStorage:
    """Service for storing and retrieving search results from external APIs"""
    
    def __init__(self):
        self.db = DatabaseService()
    
    def setup_storage_table(self):
        """Create the external_api_data table if it doesn't exist"""
        try:
            # SQL to create the external_api_data table
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS external_api_data (
                id SERIAL PRIMARY KEY,
                external_id VARCHAR(255) NOT NULL,
                title TEXT NOT NULL,
                authors TEXT,
                year INTEGER,
                journal VARCHAR(255),
                doi VARCHAR(255),
                citations INTEGER,
                abstract TEXT,
                source VARCHAR(50) NOT NULL,
                metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
            
            # Create indices for faster searches
            create_indices_sql = """
            CREATE INDEX IF NOT EXISTS idx_external_api_data_source_id ON external_api_data(source, external_id);
            CREATE INDEX IF NOT EXISTS idx_external_api_data_title ON external_api_data USING gin(to_tsvector('english', title));
            CREATE INDEX IF NOT EXISTS idx_external_api_data_authors ON external_api_data USING gin(to_tsvector('english', authors));
            """
            
            # Execute SQL
            self.db.execute_query(create_table_sql)
            self.db.execute_query(create_indices_sql)
            
            logging.info("✅ External API data storage table set up successfully")
            return True
        except Exception as e:
            logging.error(f"❌ Error setting up external API data storage: {e}")
            return False
    
    def save_results(self, results, source):
        """Save external API results to database for caching and analytics"""
        if not results:
            return False
        
        try:
            # Prepare data for batch insert
            values = []
            for result in results:
                # Convert authors list to string if needed
                authors = result.get('author', '')
                if isinstance(result.get('authors'), list) and not authors:
                    authors = ', '.join(result['authors'])
                elif isinstance(authors, list):
                    authors = ', '.join(authors)
                
                # Prepare metadata JSON
                metadata = {k: v for k, v in result.items() if k not in [
                    'id', 'title', 'author', 'authors', 'year', 'journal', 
                    'doi', 'citations', 'abstract', 'source'
                ]}
                
                values.append({
                    'external_id': str(result.get('id', '')),
                    'title': result.get('title', 'Untitled'),
                    'authors': authors,
                    'year': result.get('year') if result.get('year') and str(result.get('year')).isdigit() else None,
                    'journal': result.get('journal', '')[:255] if result.get('journal') else '',
                    'doi': result.get('doi', '')[:255] if result.get('doi') else '',
                    'citations': int(result.get('citations', 0)) if result.get('citations') is not None else 0,
                    'abstract': result.get('abstract', ''),
                    'source': source,
                    'metadata': json.dumps(metadata)
                })
            
            # Batch insert into database
            success_count = 0
            for value in values:
                try:
                    # Check if record already exists
                    query = """
                        SELECT id FROM external_api_data 
                        WHERE external_id = %(external_id)s AND source = %(source)s
                    """
                    result = self.db.execute_query(query, {
                        'external_id': value['external_id'],
                        'source': value['source']
                    })
                    
                    if result and len(result) > 0:
                        # Update existing record
                        query = """
                            UPDATE external_api_data SET
                            title = %(title)s,
                            authors = %(authors)s,
                            year = %(year)s,
                            journal = %(journal)s,
                            doi = %(doi)s,
                            citations = %(citations)s,
                            abstract = %(abstract)s,
                            metadata = %(metadata)s,
                            updated_at = CURRENT_TIMESTAMP
                            WHERE external_id = %(external_id)s AND source = %(source)s
                        """
                    else:
                        # Insert new record
                        query = """
                            INSERT INTO external_api_data
                            (external_id, title, authors, year, journal, doi, citations, abstract, source, metadata)
                            VALUES
                            (%(external_id)s, %(title)s, %(authors)s, %(year)s, %(journal)s, %(doi)s, %(citations)s, %(abstract)s, %(source)s, %(metadata)s)
                        """
                    
                    self.db.execute_query(query, value)
                    success_count += 1
                except Exception as e:
                    logging.error(f"Error saving result {value.get('external_id')}: {e}")
            
            logging.info(f"Saved {success_count}/{len(values)} results from {source} to database")
            return success_count > 0
        except Exception as e:
            logging.error(f"Error saving {source} results to database: {e}")
            return False
    
    def get_result_by_id(self, external_id, source):
        """Retrieve a specific result from the database"""
        try:
            query = """
                SELECT * FROM external_api_data
                WHERE external_id = %s AND source = %s
            """
            
            result = self.db.execute_query(query, (external_id, source))
            
            if result and len(result) > 0:
                # Convert row to dictionary
                row = result[0]
                
                # Parse metadata JSON
                metadata = {}
                if 'metadata' in row and row['metadata']:
                    try:
                        metadata = json.loads(row['metadata'])
                    except:
                        pass
                
                # Combine row data with metadata
                data = {**row}
                del data['metadata']  # Remove raw JSON field
                
                # Add metadata fields
                for key, value in metadata.items():
                    if key not in data:
                        data[key] = value
                
                return data
            
            return None
        except Exception as e:
            logging.error(f"Error retrieving result {external_id} from {source}: {e}")
            return None
    
    def search_results(self, query, source=None, limit=10, offset=0):
        """Search for results in the database"""
        try:
            # Build the query
            search_conditions = []
            params = {}
            
            # Format the search term for full-text search
            search_terms = ' & '.join([term + ':*' for term in query.split()])
            params['search_query'] = search_terms
            
            search_conditions.append("""
                to_tsvector('english', title || ' ' || COALESCE(authors, '')) @@ to_tsquery('english', %(search_query)s)
            """)
            
            # Add source filter if provided
            if source:
                search_conditions.append("source = %(source)s")
                params['source'] = source
            
            # Combine conditions
            where_clause = " AND ".join(search_conditions)
            
            # Construct full query
            query = f"""
                SELECT * FROM external_api_data
                WHERE {where_clause}
                ORDER BY citations DESC NULLS LAST
                LIMIT %(limit)s OFFSET %(offset)s
            """
            
            # Add pagination parameters
            params['limit'] = limit
            params['offset'] = offset
            
            # Execute query
            results = self.db.execute_query(query, params)
            
            # Count total results
            count_query = f"""
                SELECT COUNT(*) as total FROM external_api_data
                WHERE {where_clause}
            """
            
            count_result = self.db.execute_query(count_query, params)
            total = count_result[0]['total'] if count_result else 0
            
            # Process results
            processed_results = []
            for row in results:
                # Parse metadata JSON
                metadata = {}
                if 'metadata' in row and row['metadata']:
                    try:
                        metadata = json.loads(row['metadata'])
                    except:
                        pass
                
                # Combine row data with metadata
                data = {**row}
                del data['metadata']  # Remove raw JSON field
                
                # Add metadata fields
                for key, value in metadata.items():
                    if key not in data:
                        data[key] = value
                
                processed_results.append(data)
            
            return {
                'results': processed_results,
                'total': total
            }
        except Exception as e:
            logging.error(f"Error searching results: {e}")
            return {
                'results': [],
                'total': 0
            }