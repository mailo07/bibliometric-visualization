from psycopg2 import sql
from services.database import DatabaseService
from typing import Dict, Any, List, Optional
import logging

class ProfileService:
    """Service for handling user profile-related database operations"""
    
    def __init__(self):
        self.db = DatabaseService()
    
    def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch user profile information
        
        Args:
            user_id: The user's ID
            
        Returns:
            User profile data or None if not found
        """
        try:
            query = sql.SQL("SELECT * FROM users WHERE id = %s").format()
            result = self.db.execute_query(query, (user_id,))
            return result[0] if result else None
        except Exception as e:
            logging.error(f"Error fetching user profile: {str(e)}")
            return None
    
    def get_user_publications(self, user_id: str, page: int = 1, per_page: int = 10) -> Dict[str, Any]:
        """
        Fetch publications associated with a specific user
        
        Args:
            user_id: The user's ID
            page: Page number (starting from 1)
            per_page: Number of results per page
            
        Returns:
            Dictionary with results and pagination info
        """
        offset = (page - 1) * per_page
        
        try:
            # Query to fetch publications from all sources by author ID
            # This assumes you have a user_publications mapping table
            query = """
                SELECT p.*, 'user_publication' AS source
                FROM user_publications up
                JOIN publications p ON up.publication_id = p.id
                WHERE up.user_id = %s
                ORDER BY p.year DESC
                LIMIT %s OFFSET %s
            """
            
            results = self.db.execute_query(query, (user_id, per_page, offset)) or []
            
            # Get total count
            count_query = """
                SELECT COUNT(*) 
                FROM user_publications
                WHERE user_id = %s
            """
            
            total = self.db.execute_query(count_query, (user_id,))[0]['count']
            
            return {
                'results': results,
                'total': total,
                'page': page,
                'per_page': per_page
            }
            
        except Exception as e:
            logging.error(f"Error fetching user publications: {str(e)}")
            return {'results': [], 'total': 0, 'page': page, 'per_page': per_page}
    
    def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """
        Get aggregate statistics for a user
        
        Args:
            user_id: The user's ID
            
        Returns:
            Dictionary with user statistics
        """
        try:
            # Query to get aggregated statistics
            query = """
                SELECT 
                    COUNT(DISTINCT p.id) AS total_publications,
                    COALESCE(SUM(p.citations), 0) AS total_citations,
                    MAX(p.citations) AS max_citations,
                    COUNT(DISTINCT CASE WHEN p.year >= EXTRACT(YEAR FROM CURRENT_DATE) - 5 THEN p.id END) AS recent_publications
                FROM user_publications up
                JOIN publications p ON up.publication_id = p.id
                WHERE up.user_id = %s
            """
            
            result = self.db.execute_query(query, (user_id,))
            return result[0] if result else {
                'total_publications': 0,
                'total_citations': 0,
                'max_citations': 0,
                'recent_publications': 0
            }
            
        except Exception as e:
            logging.error(f"Error fetching user stats: {str(e)}")
            return {
                'total_publications': 0,
                'total_citations': 0,
                'max_citations': 0,
                'recent_publications': 0
            }
    
    def update_user_profile(self, user_id: str, profile_data: Dict[str, Any]) -> bool:
        """
        Update user profile information
        
        Args:
            user_id: The user's ID
            profile_data: Dictionary with profile fields to update
            
        Returns:
            True if update was successful, False otherwise
        """
        try:
            # Build the SET clause dynamically
            set_items = []
            params = []
            
            for field, value in profile_data.items():
                set_items.append(sql.SQL("{} = %s").format(sql.Identifier(field)))
                params.append(value)
            
            # Add user_id as the last parameter
            params.append(user_id)
            
            query = sql.SQL("UPDATE users SET {} WHERE id = %s").format(
                sql.SQL(", ").join(set_items)
            )
            
            self.db.execute_query(query, params, fetch=False)
            return True
            
        except Exception as e:
            logging.error(f"Error updating user profile: {str(e)}")
            return False