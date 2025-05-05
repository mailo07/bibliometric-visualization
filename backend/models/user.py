# models/user.py
from extensions import db
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)  # Keep just "password" as field name
    full_name = db.Column(db.String(120), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    location = db.Column(db.String(120), nullable=True)
    profile_picture = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    last_activity = db.Column(db.DateTime, nullable=True)
    last_activity_type = db.Column(db.String(50), nullable=True)
    last_ip_address = db.Column(db.String(45), nullable=True)
    is_suspended = db.Column(db.Boolean, default=False)
    role = db.Column(db.String(50), default='user')
    occupation = db.Column(db.String(120), nullable=True)
    member_since = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, username, email, password, **kwargs):
        self.username = username
        self.email = email
        self.password = generate_password_hash(password)
        for key, value in kwargs.items():
            setattr(self, key, value)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'profile_picture': self.profile_picture,
            'bio': self.bio,
            'location': self.location,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'last_activity': self.last_activity.isoformat() if self.last_activity else None,
            'last_activity_type': self.last_activity_type,
            'last_ip_address': self.last_ip_address,
            'is_suspended': self.is_suspended,
            'role': self.role,
            'occupation': self.occupation,
            'member_since': self.member_since.isoformat() if self.member_since else None,
            'status': self.get_status()
        }

    def get_status(self):
        if self.is_suspended:
            return 'Suspended'
        elif not self.last_activity or self.last_activity < datetime.utcnow() - timedelta(days=30):
            return 'Inactive'
        else:
            return 'Active'