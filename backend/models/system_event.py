# models/system_event.py
from extensions import db
from datetime import datetime

class SystemEvent(db.Model):
    __tablename__ = 'system_events'
    
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    event_type = db.Column(db.String(50), nullable=False)
    message = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(20), nullable=False)  # info, warning, error, critical
    source = db.Column(db.String(50), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat(),
            'event_type': self.event_type,
            'message': self.message,
            'severity': self.severity,
            'source': self.source,
            'user_id': self.user_id,
            'ip_address': self.ip_address
        }