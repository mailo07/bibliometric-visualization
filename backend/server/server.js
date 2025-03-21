// server.js (Node/Express backend)
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());  // Enable CORS for all origins&#8203;:contentReference[oaicite:3]{index=3}

// PostgreSQL pool connection (adjust host/port as needed)
const pool = new Pool({
host: 'localhost',
  port: 8080,               // Database is listening on port 8080
user: 'postgres',
password: 'vivo18#',
database: 'bibliometric_data'
});

// GET /api/search?title=...&author_name=...&year=...&page=1&limit=10
app.get('/api/search', async (req, res) => {
try {
    // Extract query parameters
    let { title, author_name, year, page = 1, limit = 10 } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const offset = (page - 1) * limit;
    
    // Build base SQL for each table
    let whereClauses = [];
    if (title) {
      // Use ILIKE for case-insensitive substring match
    whereClauses.push(`title ILIKE '%${title}%'`);
    }
    if (author_name) {
    whereClauses.push(`author_name ILIKE '%${author_name}%'`);
    }
    if (year) {
      whereClauses.push(`year = ${Number(year)}`);  // year is numeric
    }
    // Combine all conditions into one WHERE clause (if any filters provided)
    let whereSql = '';
    if (whereClauses.length > 0) {
    whereSql = 'WHERE ' + whereClauses.join(' AND ');
    }
    
    // Construct the full SQL query to search across multiple tables
    const searchQuery = `
    SELECT 'bibliometric' AS source, id, title, author_name, year
    FROM bibliometric_data ${whereSql}
    UNION
    SELECT 'crossref' AS source, id, title, author_name, year
    FROM crossref_data_multiple_subjects ${whereSql}
    UNION
    SELECT 'google_scholar' AS source, id, title, author_name, year
    FROM google_scholar_data ${whereSql}
    ORDER BY year DESC NULLS LAST
    LIMIT ${limit} OFFSET ${offset};
    `;
    // Execute the query
    const result = await pool.query(searchQuery);
    return res.status(200).json(result.rows);
} catch (err) {
    console.error('Error executing search query:', err);
    return res.status(500).json({ error: 'Internal server error' });
}
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
console.log(`API server listening on port ${PORT}`);
});
