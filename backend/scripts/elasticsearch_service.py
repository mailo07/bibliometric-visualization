# services/elasticsearch_service.py
from elasticsearch import Elasticsearch
import logging
from config import Config
import time

class ElasticsearchService:
    """Service for interacting with Elasticsearch"""
    
    def __init__(self):
        self.es = None
        self.index_name = "bibliometric_data"
        self.connect()
    
    def connect(self):
        """Connect to Elasticsearch"""
        try:
            # Connect to Elasticsearch
            self.es = Elasticsearch([{
                'host': Config.ELASTICSEARCH_HOST,
                'port': Config.ELASTICSEARCH_PORT
            }])
            
            if self.es.ping():
                logging.info("✅ Connected to Elasticsearch")
            else:
                logging.error("❌ Could not connect to Elasticsearch")
                self.es = None
        except Exception as e:
            logging.error(f"❌ Elasticsearch connection error: {e}")
            self.es = None
    
    def create_index(self):
        """Create search index with mapping"""
        if not self.es:
            logging.error("Cannot create index: Not connected to Elasticsearch")
            return False
        
        try:
            # Define mapping for bibliometric data
            mapping = {
                "mappings": {
                    "properties": {
                        "id": {"type": "keyword"},
                        "title": {
                            "type": "text",
                            "analyzer": "english",
                            "fields": {
                                "keyword": {"type": "keyword"}
                            }
                        },
                        "author": {
                            "type": "text",
                            "fields": {
                                "keyword": {"type": "keyword"}
                            }
                        },
                        "year": {"type": "integer"},
                        "journal": {
                            "type": "text",
                            "fields": {
                                "keyword": {"type": "keyword"}
                            }
                        },
                        "doi": {"type": "keyword"},
                        "abstract": {"type": "text", "analyzer": "english"},
                        "citations": {"type": "integer"},
                        "subject": {"type": "text", "analyzer": "english"},
                        "source": {"type": "keyword"}
                    }
                }
            }
            
            # Create the index
            if not self.es.indices.exists(index=self.index_name):
                self.es.indices.create(index=self.index_name, body=mapping)
                logging.info(f"Created index: {self.index_name}")
                return True
            else:
                logging.info(f"Index {self.index_name} already exists")
                return True
        except Exception as e:
            logging.error(f"Error creating index: {e}")
            return False
    
    def index_data(self, data):
        """Index data into Elasticsearch"""
        if not self.es:
            logging.error("Cannot index data: Not connected to Elasticsearch")
            return False
        
        try:
            # Bulk index the data
            bulk_data = []
            for item in data:
                bulk_data.append({
                    "index": {
                        "_index": self.index_name,
                        "_id": item.get('id')
                    }
                })
                bulk_data.append(item)
            
            if bulk_data:
                self.es.bulk(body=bulk_data, refresh=True)
                logging.info(f"Indexed {len(data)} documents")
                return True
            return False
        except Exception as e:
            logging.error(f"Error indexing data: {e}")
            return False
    
    def search(self, query, page=1, per_page=10, filters=None):
        """Search Elasticsearch index"""
        if not self.es:
            logging.error("Cannot search: Not connected to Elasticsearch")
            return [], 0
        
        try:
            filters = filters or {}
            from_val = (page - 1) * per_page
            
            # Build query
            must_clauses = [
                {"multi_match": {
                    "query": query,
                    "fields": ["title^3", "abstract^2", "author", "subject"]
                }}
            ]
            
            # Add filters
            if filters.get('year_from'):
                must_clauses.append({
                    "range": {
                        "year": {
                            "gte": int(filters['year_from'])
                        }
                    }
                })
            
            if filters.get('year_to'):
                must_clauses.append({
                    "range": {
                        "year": {
                            "lte": int(filters['year_to'])
                        }
                    }
                })
            
            if filters.get('min_citations'):
                must_clauses.append({
                    "range": {
                        "citations": {
                            "gte": int(filters['min_citations'])
                        }
                    }
                })
            
            # Source filter
            if filters.get('source'):
                must_clauses.append({
                    "term": {
                        "source": filters['source']
                    }
                })
            
            # Construct full query
            query_body = {
                "query": {
                    "bool": {
                        "must": must_clauses
                    }
                },
                "from": from_val,
                "size": per_page,
                "sort": [
                    {"citations": {"order": "desc"}},
                    "_score"
                ]
            }
            
            # Execute search
            response = self.es.search(
                index=self.index_name,
                body=query_body
            )
            
            # Parse results
            hits = response['hits']['hits']
            total = response['hits']['total']['value']
            
            results = []
            for hit in hits:
                results.append(hit['_source'])
            
            return results, total
        except Exception as e:
            logging.error(f"Search error: {e}")
            return [], 0