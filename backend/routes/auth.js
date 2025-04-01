// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { body, validationResult } = require('express-validator');

// Configure PostgreSQL connection using your specific details
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'bibliometric_data',
  password: 'vivo18#',
  port: 8080,
});

// Initialize the database by creating the users table if it doesn't exist
const initDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        profile_image VARCHAR(255),
        bio TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Call the initialization function
initDatabase();

// Security configurations - SINGLE DECLARATION FOR ENTIRE FILE
const JWT_SECRET = process.env.JWT_SECRET || 'bibliometricapp-secret-key';
const SALT_ROUNDS = 10;

// Middleware for logging authentication attempts
const logAuthAttempt = (req, type, success, details = '') => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  console.log(`[${timestamp}] AUTH ${type}: ${success ? 'SUCCESS' : 'FAILURE'} - IP: ${ip} - User-Agent: ${userAgent} - Details: ${details}`);
  
  // In a production app, we would save this to a database table for security auditing
};

// Register endpoint
router.post('/register', [
  // Validation middleware
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logAuthAttempt(req, 'REGISTER', false, 'Validation failed');
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { username, email, password, bio, profile_image } = req.body;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      logAuthAttempt(req, 'REGISTER', false, 'User already exists');
      return res.status(409).json({ message: 'Username or email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user into database with all fields
    const result = await pool.query(
      'INSERT INTO users (username, email, password, profile_image, bio) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [username, email, hashedPassword, profile_image || null, bio || null]
    );

    logAuthAttempt(req, 'REGISTER', true, `User created: ${username}`);
    
    // Return success but don't auto-login the user
    res.status(201).json({ message: 'Registration successful', userId: result.rows[0].id });
  } catch (error) {
    console.error('Register error:', error);
    logAuthAttempt(req, 'REGISTER', false, `Server error: ${error.message}`);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login endpoint
router.post('/login', [
  body('username').trim().not().isEmpty().withMessage('Username is required'),
  body('password').not().isEmpty().withMessage('Password is required'),
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logAuthAttempt(req, 'LOGIN', false, 'Validation failed');
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { username, password } = req.body;

    // Find user in database
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      // Add delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 1000));
      logAuthAttempt(req, 'LOGIN', false, `User not found: ${username}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      logAuthAttempt(req, 'LOGIN', false, `Invalid password for: ${username}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token (expires in 24 hours)
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    logAuthAttempt(req, 'LOGIN', true, `User logged in: ${username}`);
    
    // Return user info and token (excluding password)
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profile_image: user.profile_image
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    logAuthAttempt(req, 'LOGIN', false, `Server error: ${error.message}`);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Auth middleware function - using the same JWT_SECRET declared above
const authMiddleware = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add user from payload
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Export both router and middleware
module.exports = { router, authMiddleware };