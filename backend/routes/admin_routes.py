# routes/admin_routes.py
from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
from models.user import User
from models.system_event import SystemEvent
from extensions import db
from sqlalchemy import or_, desc, and_
import logging

admin_bp = Blueprint('admin', __name__)

# Helper function to log system events
def log_system_event(event_type, message, severity='info', user_id=None, ip_address=None):
    try:
        event = SystemEvent(
            event_type=event_type,
            message=message,
            severity=severity,
            user_id=user_id,
            ip_address=ip_address
        )
        db.session.add(event)
        db.session.commit()
    except Exception as e:
        logging.error(f"Failed to log system event: {str(e)}")
        db.session.rollback()

@admin_bp.route('/users', methods=['GET'])
def get_users():
    """Get paginated and filtered list of users"""
    try:
        # Get query parameters with defaults
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('limit', 10, type=int)
        status_filter = request.args.get('status', '')
        search_term = request.args.get('search', '')
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')

        # Base query
        query = User.query

        # Apply status filters
        if status_filter:
            if status_filter.lower() == 'active':
                query = query.filter(
                    and_(
                        User.is_suspended == False,
                        User.last_activity >= datetime.utcnow() - timedelta(days=30)
                    )
                )
            elif status_filter.lower() == 'inactive':
                query = query.filter(
                    and_(
                        User.is_suspended == False,
                        or_(
                            User.last_activity < datetime.utcnow() - timedelta(days=30),
                            User.last_activity == None
                        )
                    )
                )
            elif status_filter.lower() == 'suspended':
                query = query.filter(User.is_suspended == True)

        # Apply search filter
        if search_term:
            search = f"%{search_term}%"
            query = query.filter(
                or_(
                    User.username.ilike(search),
                    User.email.ilike(search),
                    User.full_name.ilike(search)
                )
            )

        # Apply sorting
        if hasattr(User, sort_by):
            if sort_order.lower() == 'asc':
                query = query.order_by(getattr(User, sort_by).asc())
            else:
                query = query.order_by(getattr(User, sort_by).desc())

        # Paginate results
        paginated_users = query.paginate(page=page, per_page=per_page, error_out=False)
        
        # Prepare response data
        users = []
        for user in paginated_users.items:
            users.append(user.to_dict())

        # Log system event
        log_system_event(
            'USER_LIST_ACCESS',
            f'Admin accessed user list with {len(users)} users',
            'info',
            request.remote_addr
        )

        return jsonify({
            'users': users,
            'total': paginated_users.total,
            'pages': paginated_users.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
    except Exception as e:
        logging.error(f"Failed to fetch users: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Failed to fetch users'}), 500

@admin_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get details of a specific user"""
    try:
        user = User.query.get_or_404(user_id)
        
        # Log system event
        log_system_event(
            'USER_DETAILS_ACCESS',
            f'Admin accessed details for user {user_id}',
            'info',
            request.remote_addr
        )

        return jsonify(user.to_dict()), 200
    except Exception as e:
        logging.error(f"Failed to fetch user {user_id}: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Failed to fetch user'}), 500

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete a user account"""
    try:
        user = User.query.get_or_404(user_id)
        db.session.delete(user)
        db.session.commit()
        
        # Log system event
        log_system_event(
            'USER_DELETED',
            f'User {user_id} deleted by admin',
            'warning',
            request.remote_addr
        )

        return jsonify({'message': 'User deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        logging.error(f"Failed to delete user {user_id}: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Failed to delete user'}), 500

@admin_bp.route('/users/<int:user_id>/suspend', methods=['POST'])
def suspend_user(user_id):
    """Suspend a user account"""
    try:
        user = User.query.get_or_404(user_id)
        user.is_suspended = True
        db.session.commit()
        
        # Log system event
        log_system_event(
            'USER_SUSPENDED',
            f'User {user_id} suspended by admin',
            'warning',
            request.remote_addr
        )

        return jsonify({'message': 'User suspended successfully'}), 200
    except Exception as e:
        db.session.rollback()
        logging.error(f"Failed to suspend user {user_id}: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Failed to suspend user'}), 500

@admin_bp.route('/users/<int:user_id>/unsuspend', methods=['POST'])
def unsuspend_user(user_id):
    """Unsuspend a user account"""
    try:
        user = User.query.get_or_404(user_id)
        user.is_suspended = False
        db.session.commit()
        
        # Log system event
        log_system_event(
            'USER_UNSUSPENDED',
            f'User {user_id} unsuspended by admin',
            'info',
            request.remote_addr
        )

        return jsonify({'message': 'User unsuspended successfully'}), 200
    except Exception as e:
        db.session.rollback()
        logging.error(f"Failed to unsuspend user {user_id}: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Failed to unsuspend user'}), 500

@admin_bp.route('/users/<int:user_id>/update-role', methods=['PUT'])
def update_user_role(user_id):
    """Update a user's role"""
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        if 'role' not in data:
            return jsonify({'error': 'Role is required'}), 400
            
        user.role = data['role']
        db.session.commit()
        
        # Log system event
        log_system_event(
            'USER_ROLE_UPDATED',
            f'Role updated to {data["role"]} for user {user_id}',
            'info',
            request.remote_addr
        )

        return jsonify({
            'message': 'User role updated successfully',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        logging.error(f"Failed to update role for user {user_id}: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Failed to update user role'}), 500

@admin_bp.route('/users/stats', methods=['GET'])
def get_user_stats():
    """Get statistics about users"""
    try:
        total_users = User.query.count()
        active_users = User.query.filter(
            and_(
                User.is_suspended == False,
                User.last_activity >= datetime.utcnow() - timedelta(days=30)
            )
        ).count()
        inactive_users = User.query.filter(
            and_(
                User.is_suspended == False,
                or_(
                    User.last_activity < datetime.utcnow() - timedelta(days=30),
                    User.last_activity == None
                )
            )
        ).count()
        suspended_users = User.query.filter_by(is_suspended=True).count()
        
        return jsonify({
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': inactive_users,
            'suspended_users': suspended_users,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    except Exception as e:
        logging.error(f"Failed to get user stats: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Failed to get user statistics'}), 500

@admin_bp.route('/activity-logs', methods=['GET'])
def get_activity_logs():
    """Get user activity logs"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('limit', 10, type=int)
        user_id = request.args.get('user_id', type=int)
        
        query = SystemEvent.query.filter(SystemEvent.event_type != 'SYSTEM_EVENT')
        
        if user_id:
            query = query.filter(SystemEvent.user_id == user_id)
            
        logs = query.order_by(desc(SystemEvent.timestamp)).paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'logs': [log.to_dict() for log in logs.items],
            'total': logs.total,
            'pages': logs.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
    except Exception as e:
        logging.error(f"Failed to get activity logs: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Failed to get activity logs'}), 500

@admin_bp.route('/system-events', methods=['GET'])
def get_system_events():
    """Get system events"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('limit', 10, type=int)
        severity = request.args.get('severity')
        
        query = SystemEvent.query
        
        if severity:
            query = query.filter(SystemEvent.severity == severity.lower())
            
        events = query.order_by(desc(SystemEvent.timestamp)).paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'events': [event.to_dict() for event in events.items],
            'total': events.total,
            'pages': events.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
    except Exception as e:
        logging.error(f"Failed to get system events: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Failed to get system events'}), 500

@admin_bp.route('/user-activity-metrics', methods=['GET'])
def get_user_activity_metrics():
    """Get user activity metrics for charts"""
    try:
        # Weekly data (last 7 days)
        weekly_data = []
        for i in range(7):
            date = datetime.utcnow() - timedelta(days=6-i)
            start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            end = date.replace(hour=23, minute=59, second=59, microsecond=999)
            
            # Count unique users
            users = db.session.query(User).filter(
                and_(
                    User.last_activity >= start,
                    User.last_activity <= end
                )
            ).count()
            
            # Count total activities (approximated)
            activities = db.session.query(SystemEvent).filter(
                and_(
                    SystemEvent.timestamp >= start,
                    SystemEvent.timestamp <= end,
                    SystemEvent.event_type != 'SYSTEM_EVENT'
                )
            ).count()
            
            weekly_data.append({
                'name': date.strftime('%a'),
                'users': users,
                'sessions': activities
            })

        # Monthly data (last 4 weeks)
        monthly_data = []
        for i in range(4):
            week_start = datetime.utcnow() - timedelta(weeks=3-i)
            week_end = week_start + timedelta(days=6)
            
            # Count unique users
            users = db.session.query(User).filter(
                and_(
                    User.last_activity >= week_start,
                    User.last_activity <= week_end
                )
            ).count()
            
            # Count total activities (approximated)
            activities = db.session.query(SystemEvent).filter(
                and_(
                    SystemEvent.timestamp >= week_start,
                    SystemEvent.timestamp <= week_end,
                    SystemEvent.event_type != 'SYSTEM_EVENT'
                )
            ).count()
            
            monthly_data.append({
                'name': f"Week {i+1}",
                'users': users,
                'sessions': activities
            })

        return jsonify({
            'weeklyData': weekly_data,
            'monthlyData': monthly_data
        }), 200
    except Exception as e:
        logging.error(f"Failed to get user activity metrics: {str(e)}")
        return jsonify({'error': str(e), 'message': 'Failed to get user activity metrics'}), 500