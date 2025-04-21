from werkzeug.security import generate_password_hash, check_password_hash

def hash_password(password):
    """Generate a secure hash of the password"""
    return generate_password_hash(password)

def verify_password(password, hashed_password):
    """Verify a password against its hash"""
    return check_password_hash(hashed_password, password)