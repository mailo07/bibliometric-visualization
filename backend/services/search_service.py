# services/search_service.py
from services.database import DatabaseService
from services.external_apis import ExternalAPIService
from datetime import datetime
from collections import defaultdict
import uuid
import logging
import json
import os
from typing import Dict, Any, Optional, List

class SearchService:
    """Service for handling search-related operations across database and external APIs"""
    
    def __init__(self):
        self.db = DatabaseService()
        self.external_api = ExternalAPIService()
    
    def search_publications(self, query: str, page: int = 1, per_page: int = 10, 
                           filters: Optional[Dict[str, Any]] = None, 
                           include_external: bool = True,
                           balance_sources: bool = True) -> Dict[str, Any]:
        """
        Search for publications across all sources with pagination and filtering
        
        Args:
            query: Search text
            page: Page number (starting from 1)
            per_page: Number of results per page
            filters: Optional dictionary of filters
            include_external: Whether to include external API results
            balance_sources: Whether to balance results from different sources
            
        Returns:
            Dictionary with combined results and pagination info
        """
        filters = filters or {}
        if not isinstance(include_external, bool):
            include_external = filters.get('include_external', 'false').lower() == 'true'
        
        # Normalize query by removing extra spaces
        query = ' '.join(query.split())
        
        if not query or not query.strip():
            return {
                'results': [],
                'total': 0,
                'page': page,
                'per_page': per_page,
                'metrics': self._get_empty_metrics(),
                'external_apis_used': False
            }
        
        try:
            # Get database results first with proper per_page value
            db_results = self._search_database(query, page, per_page, filters)
            results = db_results.get('results', [])
            total = db_results.get('total', 0)
            
            # Log the database results for debugging
            logging.info(f"Database search yielded {len(results) if results else 0} results for query: {query}")
            for idx, result in enumerate(results[:5]):  # Log just the first 5 to avoid flooding logs
                source = result.get('table_source', result.get('source', 'unknown'))
                logging.info(f"DB Result #{idx+1}: from {source} - {result.get('title', 'No title')}")
            
            # If external search is requested
            external_apis_used = False
            external_results = []
            
            if include_external:
                # Calculate how many external results needed to reach per_page total
                db_count = len(results)
                external_needed = max(0, per_page - db_count)
                
                if external_needed > 0:
                    # Fetch from external APIs
                    sources = ['arxiv', 'openalex', 'crossref']  # Reduced to the most important ones
                    per_source = max(min(external_needed // len(sources), 3), 1)  # Get 1-3 results per source
                    
                    for source in sources:
                        try:
                            logging.info(f"Fetching from external API: {source}")
                            source_results, source_total = self.external_api.search_external(
                                source, query, 1, per_source
                            )
                            if source_results:
                                logging.info(f"Found {len(source_results)} results from {source}")
                                # Add source identifier to each result
                                for r in source_results:
                                    r['source'] = f"external_{source}"
                                
                                external_results.extend(source_results)
                                external_apis_used = True
                            else:
                                logging.info(f"No results from {source}")
                        except Exception as source_err:
                            logging.error(f"Error fetching from {source}: {str(source_err)}")
                
                # Ensure we have a good mix of results from different sources
                if external_results and results:
                    if balance_sources:
                        # Combine results with fair balancing from each source
                        combined_results = self._balance_results(results, external_results, per_page)
                    else:
                        # Take half from DB and half from external, up to per_page total
                        db_portion = min(len(results), per_page // 2)
                        ext_portion = min(len(external_results), per_page - db_portion)
                        
                        combined_results = []
                        combined_results.extend(results[:db_portion])
                        combined_results.extend(external_results[:ext_portion])
                    
                    # Sort by citations
                    combined_results.sort(key=lambda x: int(x.get('citations', 0) or 0), reverse=True)
                    results = combined_results[:per_page]  # Ensure we don't exceed the requested per_page
                    total += min(len(external_results), per_page - db_count)
                elif external_results:
                    results = external_results[:per_page]
                    total = len(external_results)
            
            # Ensure all results have source info
            for item in results:
                if 'source' not in item and 'table_source' in item:
                    item['source'] = item['table_source']
                elif 'source' not in item:
                    item['source'] = 'unknown'
            
            # Count sources for debugging
            source_counts = {}
            for item in results:
                source = item.get('source', 'unknown')
                source_counts[source] = source_counts.get(source, 0) + 1
            
            logging.info(f"Final results sources: {source_counts}")
            
            # Calculate metrics from results
            metrics = self._calculate_metrics(results)
            
            return {
                'results': results,
                'total': total,
                'page': page,
                'per_page': per_page,
                'metrics': metrics,
                'external_apis_used': external_apis_used
            }
            
        except Exception as e:
            logging.error(f"Search failed: {str(e)}")
            return {
                'results': [],
                'total': 0,
                'page': page,
                'per_page': per_page,
                'metrics': self._get_empty_metrics(),
                'external_apis_used': False
            }
    
    def _balance_results(self, db_results, external_results, per_page):
        """Balance results from different sources to ensure diversity"""
        # Step 1: Group results by source
        source_groups = defaultdict(list)
        
        # Add DB results
        for item in db_results:
            source = item.get('source', item.get('table_source', 'unknown'))
            source_groups[source].append(item)
        
        # Add external results
        for item in external_results:
            source = item.get('source', 'external')
            source_groups[source].append(item)
        
        # Step 2: Determine how many results to take from each source
        source_count = len(source_groups)
        if source_count == 0:
            return []
        
        base_per_source = max(1, per_page // source_count)
        remaining = per_page
        
        # Step 3: Build balanced result set
        balanced_results = []
        
        # First pass: take base_per_source from each source
        for source, items in source_groups.items():
            take_count = min(base_per_source, len(items), remaining)
            balanced_results.extend(items[:take_count])
            remaining -= take_count
        
        # Second pass: distribute any remaining slots
        if remaining > 0:
            for source, items in source_groups.items():
                used_count = min(base_per_source, len(items))
                if len(items) > used_count:
                    take_count = min(remaining, len(items) - used_count)
                    balanced_results.extend(items[used_count:used_count + take_count])
                    remaining -= take_count
                    if remaining == 0:
                        break
        
        return balanced_results[:per_page]  # Ensure we don't exceed the requested per_page
            
    def _calculate_metrics(self, results) -> Dict[str, Any]:
        """Generate comprehensive metrics"""
        if not results or len(results) == 0:
            return self._get_empty_metrics()
        
        metrics = {
            'scholarlyWorks': len(results),
            'worksCited': 0,
            'frequentlyCited': 0,
            'citation_trends': [],
            'top_authors': [],
            'publication_distribution': []
        }
        
        # Citation trends by year
        year_counts = defaultdict(int)
        author_counts = defaultdict(int)
        pub_counts = defaultdict(int)
        
        for item in results:
            # Get citations
            citations = item.get('citations') or item.get('cited_by') or item.get('citation_count') or 0
            if isinstance(citations, str):
                try:
                    citations = int(citations)
                except (ValueError, TypeError):
                    citations = 0
            
            metrics['worksCited'] += citations
            
            if citations > 10:
                metrics['frequentlyCited'] += 1
            
            # Process year
            year = None
            if item.get('year'):
                try:
                    year_str = str(item['year'])
                    # Extract first 4 digits if it's a longer string
                    if len(year_str) >= 4:
                        year = year_str[:4]
                    if year and year.isdigit():
                        year_counts[year] += citations
                except (ValueError, TypeError):
                    pass
            elif item.get('published'):
                try:
                    year_str = str(item['published'])
                    # Extract first 4 digits if it's a longer string
                    if len(year_str) >= 4:
                        year = year_str[:4]
                    if year and year.isdigit():
                        year_counts[year] += citations
                except (ValueError, TypeError):
                    pass
            
            # Process authors
            authors = []
            if item.get('author'):
                if isinstance(item['author'], str):
                    authors = [a.strip() for a in item['author'].split(',')]
                elif isinstance(item['author'], list):
                    authors = item['author']
            elif item.get('authors'):
                if isinstance(item['authors'], str):
                    authors = [a.strip() for a in item['authors'].split(',')]
                elif isinstance(item['authors'], list):
                    authors = item['authors']
            elif item.get('author_name'):
                if isinstance(item['author_name'], str):
                    authors = [item['author_name']]
                elif isinstance(item['author_name'], list):
                    authors = item['author_name']
            
            for author in authors:
                if isinstance(author, str) and author.strip():
                    author_counts[author.strip()] += citations
            
            # Process publication source
            pub = item.get('journal') or item.get('source') or item.get('publisher') or 'Unknown'
            if isinstance(pub, str) and pub.strip():
                pub_counts[pub.strip()] += 1
        
        # Format metrics
        metrics['citation_trends'] = [{'year': k, 'citations': v} for k, v in sorted(year_counts.items())]
        
        metrics['top_authors'] = sorted(
            [{'name': k, 'citations': v} for k, v in author_counts.items()],
            key=lambda x: x['citations'], reverse=True
        )[:5]
        
        metrics['publication_distribution'] = sorted(
            [{'name': k, 'count': v} for k, v in pub_counts.items()],
            key=lambda x: x['count'], reverse=True
        )[:5]
        
        # Add placeholders if empty
        if not metrics['citation_trends']:
            current_year = datetime.now().year
            metrics['citation_trends'] = [{'year': str(y), 'citations': 0} for y in range(current_year-4, current_year+1)]
        
        if not metrics['top_authors']:
            metrics['top_authors'] = [{'name': 'No author data', 'citations': 0}]
        
        if not metrics['publication_distribution']:
            metrics['publication_distribution'] = [{'name': 'No publication data', 'count': 0}]
        
        return metrics
    
    def _get_empty_metrics(self) -> Dict[str, Any]:
        """Return placeholder metrics when no results"""
        current_year = datetime.now().year
        return {
            'scholarlyWorks': 0,
            'worksCited': 0,
            'frequentlyCited': 0,
            'citation_trends': [{'year': str(y), 'citations': 0} for y in range(current_year-4, current_year+1)],
            'top_authors': [{'name': 'No data', 'citations': 0}],
            'publication_distribution': [{'name': 'No data', 'count': 0}]
        }
        
    def _search_database(self, query: str, page: int, per_page: int, 
                        filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Search across all database tables with pagination and filtering
        """
        filters = filters or {}
        offset = (page - 1) * per_page
        
        # Make search more flexible by breaking it into words
        query_words = query.split()
        
        # Two approaches for text search: exact phrase and any word
        exact_phrase = query.replace("'", "''")  # Escape single quotes
        
        # Build flexible tsquery for multi-word searches (OR operator)
        tsquery_parts = []
        for word in query_words:
            word = word.replace("'", "''")  # Escape single quotes
            tsquery_parts.append(f"to_tsquery('english', '{word}:*')")
        
        tsquery_expression = " || ".join(tsquery_parts)  # Use OR instead of AND
        if not tsquery_expression:
            tsquery_expression = "to_tsquery('english', '')"
        
        # Define the filter clauses
        filter_conditions = []
        filter_params = {'limit': per_page, 'offset': offset, 'exact_phrase': f"%{exact_phrase}%"}
        
        if filters.get('year_from'):
            filter_conditions.append("(CAST(COALESCE(year, '0') AS INTEGER) >= %(year_from)s OR CAST(COALESCE(publication_year, '0') AS INTEGER) >= %(year_from)s)")
            filter_params['year_from'] = int(filters['year_from'])
        
        if filters.get('year_to'):
            filter_conditions.append("(CAST(COALESCE(year, '0') AS INTEGER) <= %(year_to)s OR CAST(COALESCE(publication_year, '0') AS INTEGER) <= %(year_to)s)")
            filter_params['year_to'] = int(filters['year_to'])
        
        if filters.get('min_citations'):
            filter_conditions.append("(COALESCE(cited_by, 0) >= %(min_citations)s OR COALESCE(citation_count, 0) >= %(min_citations)s OR COALESCE(citations, 0) >= %(min_citations)s)")
            filter_params['min_citations'] = int(filters['min_citations'])
        
        # Additional filters that might come from sidebar
        if filters.get('authorFilter') and filters['authorFilter'].strip():
            filter_conditions.append("(COALESCE(author_name, '') ILIKE %(authorFilter)s OR COALESCE(authors, '') ILIKE %(authorFilter)s OR COALESCE(author, '') ILIKE %(authorFilter)s OR COALESCE(publisher, '') ILIKE %(authorFilter)s)")
            filter_params['authorFilter'] = f"%{filters['authorFilter']}%"
        
        if filters.get('titleFilter') and filters['titleFilter'].strip():
            filter_conditions.append("(COALESCE(title, '') ILIKE %(titleFilter)s OR COALESCE(book_title, '') ILIKE %(titleFilter)s)")
            filter_params['titleFilter'] = f"%{filters['titleFilter']}%"
        
        if filters.get('journalFilter') and filters['journalFilter'].strip():
            filter_conditions.append("(COALESCE(journal, '') ILIKE %(journalFilter)s OR COALESCE(source, '') ILIKE %(journalFilter)s OR COALESCE(subject, '') ILIKE %(journalFilter)s)")
            filter_params['journalFilter'] = f"%{filters['journalFilter']}%"
        
        if filters.get('publisherFilter') and filters['publisherFilter'].strip():
            filter_conditions.append("(COALESCE(publisher, '') ILIKE %(publisherFilter)s)")
            filter_params['publisherFilter'] = f"%{filters['publisherFilter']}%"
        
        # Source filtering
        source_filter = ""
        if filters.get('source'):
            source = filters['source']
            source_filter = f"AND table_source = '{source}'"
        
        # Combine filter conditions
        additional_filters = " AND ".join(filter_conditions)
        if additional_filters:
            additional_filters = f"AND {additional_filters}"
        
        # Build the unified search query using UNION ALL for multiple tables
        search_query = f"""
            WITH 
            bibliometric_results AS (
                SELECT 
                    id::text as id, 
                    author_name AS author, 
                    title, 
                    doi, 
                    year::text, 
                    COALESCE(cited_by, 0)::integer AS citations,
                    'bibliometric_data' AS table_source,
                    subject
                FROM bibliometric_data
                WHERE (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(author_name, '')) 
                      @@ ({tsquery_expression})
                      OR title ILIKE %(exact_phrase)s 
                      OR author_name ILIKE %(exact_phrase)s
                      OR subject ILIKE %(exact_phrase)s)
                {additional_filters}
                {source_filter if source_filter and 'bibliometric' in source_filter else ''}
                LIMIT %(limit)s
            ),
            crossref_results AS (
                SELECT 
                    id::text as id, 
                    authors AS author, 
                    title, 
                    doi, 
                    year::text, 
                    COALESCE(citation_count, 0)::integer AS citations,
                    'crossref_data_multiple_subjects' AS table_source,
                    subject
                FROM crossref_data_multiple_subjects
                WHERE (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(authors, '')) 
                      @@ ({tsquery_expression})
                      OR title ILIKE %(exact_phrase)s 
                      OR authors ILIKE %(exact_phrase)s
                      OR subject ILIKE %(exact_phrase)s)
                {additional_filters}
                {source_filter if source_filter and 'crossref' in source_filter else ''}
                LIMIT %(limit)s
            ),
            google_results AS (
                SELECT 
                    id::text as id, 
                    author_name AS author, 
                    title, 
                    NULL AS doi, 
                    year::text, 
                    COALESCE(cited_by, 0)::integer AS citations,
                    'google_scholar_data' AS table_source,
                    subject_of_study AS subject
                FROM google_scholar_data
                WHERE (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(author_name, '')) 
                      @@ ({tsquery_expression})
                      OR title ILIKE %(exact_phrase)s 
                      OR author_name ILIKE %(exact_phrase)s
                      OR subject_of_study ILIKE %(exact_phrase)s)
                {additional_filters}
                {source_filter if source_filter and 'google_scholar' in source_filter else ''}
                LIMIT %(limit)s
            ),
            openalex_results AS (
                SELECT 
                    id::text as id, 
                    author, 
                    title, 
                    doi, 
                    year::text, 
                    COALESCE(citations, 0)::integer AS citations,
                    'openalex_data' AS table_source,
                    subject
                FROM openalex_data
                WHERE (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(author, '')) 
                      @@ ({tsquery_expression})
                      OR title ILIKE %(exact_phrase)s
                      OR author ILIKE %(exact_phrase)s
                      OR subject ILIKE %(exact_phrase)s)
                {additional_filters}
                {source_filter if source_filter and 'openalex' in source_filter else ''}
                LIMIT %(limit)s
            ),
            cleaned_results AS (
                SELECT 
                    id::text as id, 
                    author, 
                    title, 
                    doi, 
                    year::text, 
                    0::integer AS citations,
                    'cleaned_bibliometric_data' AS table_source,
                    NULL AS subject
                FROM cleaned_bibliometric_data
                WHERE (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(author, '')) 
                      @@ ({tsquery_expression})
                      OR title ILIKE %(exact_phrase)s
                      OR author ILIKE %(exact_phrase)s)
                {additional_filters}
                {source_filter if source_filter and 'cleaned' in source_filter else ''}
                LIMIT %(limit)s
            ),
            scopus_results AS (
                SELECT 
                    id::text as id, 
                    publisher AS author, 
                    book_title AS title, 
                    NULL AS doi, 
                    publication_year::text AS year, 
                    0::integer AS citations,
                    'scopus_data' AS table_source,
                    asjc AS subject
                FROM scopus_data
                WHERE (to_tsvector('english', COALESCE(book_title, '') || ' ' || COALESCE(publisher, '')) 
                      @@ ({tsquery_expression})
                      OR book_title ILIKE %(exact_phrase)s
                      OR publisher ILIKE %(exact_phrase)s
                      OR asjc ILIKE %(exact_phrase)s)
                {additional_filters}
                {source_filter if source_filter and 'scopus' in source_filter else ''}
                LIMIT %(limit)s
            ),
            scopus_sept_results AS (
                SELECT 
                    id::text as id, 
                    publisher AS author, 
                    book_title AS title, 
                    NULL AS doi, 
                    publication_year::text AS year, 
                    0::integer AS citations,
                    'scopus_data_sept' AS table_source,
                    asjc AS subject
                FROM scopus_data_sept
                WHERE (to_tsvector('english', COALESCE(book_title, '') || ' ' || COALESCE(publisher, '')) 
                      @@ ({tsquery_expression})
                      OR book_title ILIKE %(exact_phrase)s
                      OR publisher ILIKE %(exact_phrase)s
                      OR asjc ILIKE %(exact_phrase)s)
                {additional_filters}
                {source_filter if source_filter and 'scopus_sept' in source_filter else ''}
                LIMIT %(limit)s
            ),
            external_api_results AS (
                SELECT 
                    external_id::text as id, 
                    authors AS author, 
                    title, 
                    doi, 
                    year::text, 
                    COALESCE(citations, 0)::integer AS citations,
                    'external_' || source AS table_source,
                    '' AS subject
                FROM external_api_data
                WHERE (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(authors, '')) 
                      @@ ({tsquery_expression})
                      OR title ILIKE %(exact_phrase)s
                      OR authors ILIKE %(exact_phrase)s
                      OR doi ILIKE %(exact_phrase)s)
                {additional_filters}
                LIMIT %(limit)s
            ),
            combined_results AS (
                SELECT * FROM bibliometric_results
                UNION ALL
                SELECT * FROM crossref_results
                UNION ALL
                SELECT * FROM google_results
                UNION ALL
                SELECT * FROM openalex_results
                UNION ALL
                SELECT * FROM cleaned_results
                UNION ALL
                SELECT * FROM scopus_results
                UNION ALL
                SELECT * FROM scopus_sept_results
                UNION ALL
                SELECT * FROM external_api_results
            )
            SELECT * FROM combined_results
            ORDER BY COALESCE(citations, 0) DESC
            LIMIT %(limit)s OFFSET %(offset)s
        """
        
        # Count total results query - using similar CTEs to get accurate count
        count_query = f"""
            WITH 
            bibliometric_count AS (
                SELECT COUNT(*) AS count
                FROM bibliometric_data
                WHERE (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(author_name, '')) 
                      @@ ({tsquery_expression})
                      OR title ILIKE %(exact_phrase)s 
                      OR author_name ILIKE %(exact_phrase)s
                      OR subject ILIKE %(exact_phrase)s)
                {additional_filters}
                {source_filter if source_filter and 'bibliometric' in source_filter else ''}
            ),
            crossref_count AS (
                SELECT COUNT(*) AS count
                FROM crossref_data_multiple_subjects
                WHERE (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(authors, '')) 
                      @@ ({tsquery_expression})
                      OR title ILIKE %(exact_phrase)s 
                      OR authors ILIKE %(exact_phrase)s
                      OR subject ILIKE %(exact_phrase)s)
                {additional_filters}
                {source_filter if source_filter and 'crossref' in source_filter else ''}
            ),
            google_count AS (
                SELECT COUNT(*) AS count
                FROM google_scholar_data
                WHERE (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(author_name, '')) 
                      @@ ({tsquery_expression})
                      OR title ILIKE %(exact_phrase)s 
                      OR author_name ILIKE %(exact_phrase)s
                      OR subject_of_study ILIKE %(exact_phrase)s)
                {additional_filters}
                {source_filter if source_filter and 'google_scholar' in source_filter else ''}
            ),
            openalex_count AS (
                SELECT COUNT(*) AS count
                FROM openalex_data
                WHERE (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(author, '')) 
                      @@ ({tsquery_expression})
                      OR title ILIKE %(exact_phrase)s
                      OR author ILIKE %(exact_phrase)s
                      OR subject ILIKE %(exact_phrase)s)
                {additional_filters}
                {source_filter if source_filter and 'openalex' in source_filter else ''}
            ),
            cleaned_count AS (
                SELECT COUNT(*) AS count
                FROM cleaned_bibliometric_data
                WHERE (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(author, '')) 
                      @@ ({tsquery_expression})
                      OR title ILIKE %(exact_phrase)s
                      OR author ILIKE %(exact_phrase)s)
                {additional_filters}
                {source_filter if source_filter and 'cleaned' in source_filter else ''}
            ),
            scopus_count AS (
                SELECT COUNT(*) AS count
                FROM scopus_data
                WHERE (to_tsvector('english', COALESCE(book_title, '') || ' ' || COALESCE(publisher, '')) 
                      @@ ({tsquery_expression})
                      OR book_title ILIKE %(exact_phrase)s
                      OR publisher ILIKE %(exact_phrase)s
                      OR asjc ILIKE %(exact_phrase)s)
                {additional_filters}
                {source_filter if source_filter and 'scopus' in source_filter else ''}
            ),
            scopus_sept_count AS (
                SELECT COUNT(*) AS count
                FROM scopus_data_sept
                WHERE (to_tsvector('english', COALESCE(book_title, '') || ' ' || COALESCE(publisher, '')) 
                      @@ ({tsquery_expression})
                      OR book_title ILIKE %(exact_phrase)s
                      OR publisher ILIKE %(exact_phrase)s
                      OR asjc ILIKE %(exact_phrase)s)
                {additional_filters}
                {source_filter if source_filter and 'scopus_sept' in source_filter else ''}
            ),
            external_api_count AS (
                SELECT COUNT(*) AS count
                FROM external_api_data
                WHERE (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(authors, '')) 
                      @@ ({tsquery_expression})
                      OR title ILIKE %(exact_phrase)s
                      OR authors ILIKE %(exact_phrase)s
                      OR doi ILIKE %(exact_phrase)s)
                {additional_filters}
            )
            SELECT 
                (SELECT count FROM bibliometric_count) +
                (SELECT count FROM crossref_count) +
                (SELECT count FROM google_count) +
                (SELECT count FROM openalex_count) +
                (SELECT count FROM cleaned_count) +
                (SELECT count FROM scopus_count) +
                (SELECT count FROM scopus_sept_count) +
                (SELECT count FROM external_api_count) AS total_count
        """
        
        try:
            # Execute search query
            results = self.db.execute_query(search_query, filter_params)
            
            # Execute count query
            count_result = self.db.execute_query(count_query, {k: v for k, v in filter_params.items() 
                                                           if k in ['year_from', 'year_to', 'min_citations', 'exact_phrase', 
                                                              'authorFilter', 'titleFilter', 'journalFilter', 'publisherFilter']})
            
            total = count_result[0]['total_count'] if count_result else 0
            
            logging.info(f"Database search found {len(results) if results else 0} results")
            logging.info(f"Total count from database: {total}")
            
            return {
                'results': results or [],
                'total': total
            }
            
        except Exception as e:
            logging.error(f"Database search failed: {str(e)}")
            # Debug info to trace the error
            logging.error(f"Filter parameters: {filter_params}")
            return {'results': [], 'total': 0}
    
    def get_publication_details(self, paper_id, source=None):
        """Get detailed information about a publication"""
        try:
            if source:
                # Check if it's an external source
                if source.startswith('external_'):
                    ext_source = source.replace('external_', '')
                    return self.external_api.get_publication_details(ext_source, paper_id)
                
                # Check database tables based on source
                if source == 'bibliometric_data' or source == 'bibliometric':
                    return self._get_bibliometric_details(paper_id)
                elif source == 'crossref_data_multiple_subjects' or source == 'crossref':
                    return self._get_crossref_details(paper_id)
                elif source == 'google_scholar_data' or source == 'google_scholar':
                    return self._get_google_scholar_details(paper_id)
                elif source == 'openalex_data' or source == 'openalex':
                    return self._get_openalex_db_details(paper_id)
                elif source == 'cleaned_bibliometric_data' or source == 'cleaned':
                    return self._get_cleaned_details(paper_id)
                elif source == 'scopus_data' or source == 'scopus':
                    return self._get_scopus_details(paper_id, 'scopus_data')
                elif source == 'scopus_data_sept' or source == 'scopus_sept':
                    return self._get_scopus_details(paper_id, 'scopus_data_sept')
            
            # If no source specified or source not found, try all database tables
            paper = self._get_bibliometric_details(paper_id)
            if paper:
                return paper
            
            paper = self._get_crossref_details(paper_id)
            if paper:
                return paper
            
            paper = self._get_google_scholar_details(paper_id)
            if paper:
                return paper
            
            paper = self._get_openalex_db_details(paper_id)
            if paper:
                return paper
            
            paper = self._get_cleaned_details(paper_id)
            if paper:
                return paper
            
            paper = self._get_scopus_details(paper_id, 'scopus_data')
            if paper:
                return paper
            
            paper = self._get_scopus_details(paper_id, 'scopus_data_sept')
            if paper:
                return paper
                
            # Try external_api_data table
            paper = self._get_external_api_details(paper_id)
            if paper:
                return paper
            
            # If not found in database, try external APIs
            for ext_source in ['arxiv', 'openalex', 'crossref', 'dblp', 'openlibrary', 'gutendex', 'gbif']:
                paper = self.external_api.get_publication_details(ext_source, paper_id)
                if paper:
                    return paper
            
            return None
        except Exception as e:
            logging.error(f"Error getting publication details: {str(e)}")
            return None
    
    def _get_bibliometric_details(self, paper_id):
        """Get paper details from bibliometric_data table"""
        query = "SELECT * FROM bibliometric_data WHERE id = %s"
        result = self.db.execute_query(query, (paper_id,))
        if result and len(result) > 0:
            return result[0]
        return None
    
    def _get_crossref_details(self, paper_id):
        """Get paper details from crossref_data_multiple_subjects table"""
        query = "SELECT * FROM crossref_data_multiple_subjects WHERE id = %s"
        result = self.db.execute_query(query, (paper_id,))
        if result and len(result) > 0:
            return result[0]
        return None
    
    def _get_google_scholar_details(self, paper_id):
        """Get paper details from google_scholar_data table"""
        query = "SELECT * FROM google_scholar_data WHERE id = %s"
        result = self.db.execute_query(query, (paper_id,))
        if result and len(result) > 0:
            return result[0]
        return None
    
    def _get_openalex_db_details(self, paper_id):
        """Get paper details from openalex_data table"""
        query = "SELECT * FROM openalex_data WHERE id = %s"
        result = self.db.execute_query(query, (paper_id,))
        if result and len(result) > 0:
            return result[0]
        return None
    
    def _get_cleaned_details(self, paper_id):
        """Get paper details from cleaned_bibliometric_data table"""
        query = "SELECT * FROM cleaned_bibliometric_data WHERE id = %s"
        result = self.db.execute_query(query, (paper_id,))
        if result and len(result) > 0:
            return result[0]
        return None
    
    def _get_scopus_details(self, paper_id, source):
        """Get paper details from scopus_data or scopus_data_sept table"""
        table = 'scopus_data' if source == 'scopus_data' else 'scopus_data_sept'
        query = f"SELECT * FROM {table} WHERE id = %s"
        result = self.db.execute_query(query, (paper_id,))
        if result and len(result) > 0:
            return result[0]
        return None
        
    def _get_external_api_details(self, paper_id):
        """Get paper details from external_api_data table"""
        try:
            query = """
                SELECT 
                    external_id as id, 
                    title, 
                    authors as author, 
                    year, 
                    journal, 
                    citations, 
                    doi,
                    abstract,
                    'external_' || source as source
                FROM external_api_data
                WHERE external_id = %s OR title = %s
                LIMIT 1
            """
            result = self.db.execute_query(query, (paper_id, paper_id))
            if result and len(result) > 0:
                return result[0]
            return None
        except Exception as e:
            logging.error(f"Error getting external API details: {str(e)}")
            return None
            
    def get_bibliometric_metrics(self, query):
        """Calculate bibliometric metrics for a search query"""
        try:
            # First, search for publications with higher limit to get a better sample
            search_results = self.search_publications(query, 1, 100, None, True, False)
            results = search_results.get('results', [])
            
            # Calculate metrics from these results
            metrics = self._calculate_metrics(results)
            
            return metrics
        except Exception as e:
            logging.error(f"Error calculating bibliometric metrics: {str(e)}")
            return self._get_empty_metrics()
    
    def get_publication_summary(self, paper_id):
        """Get a summary of a publication including abstract and key metrics"""
        try:
            # Get publication details
            publication = self.get_publication_details(paper_id)
            
            if not publication:
                return None
            
            # Extract basic information
            summary = {
                'id': publication.get('id'),
                'title': publication.get('title'),
                'author': publication.get('author') or publication.get('authors') or publication.get('author_name'),
                'year': publication.get('year') or publication.get('published') or publication.get('publication_year'),
                'abstract': publication.get('abstract', ''),
                'citations': publication.get('citations') or publication.get('cited_by') or publication.get('citation_count') or 0,
                'source': publication.get('source'),
                'doi': publication.get('doi', ''),
                'journal': publication.get('journal') or publication.get('source') or publication.get('publisher')
            }
            
            return summary
        except Exception as e:
            logging.error(f"Error getting publication summary: {str(e)}")
            return None