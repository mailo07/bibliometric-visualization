// tools/database_optimizer.js
const { Client } = require('pg');
require('dotenv').config();

async function optimizeDatabase() {
  console.log('Starting database optimization for BiblioKnow...');
  
  // Create a new pg client
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to database successfully');
    
    // Check if the pg_trgm extension is installed
    console.log('Checking for pg_trgm extension...');
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
    `);
    console.log('pg_trgm extension is ready');
    
    // Create indexes for OpenAlex table
    console.log('Creating indexes for OpenAlex table...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_openalex_title_trgm ON openalex USING gin (title gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_openalex_author_trgm ON openalex USING gin (author gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_openalex_journal_trgm ON openalex USING gin (journal gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_openalex_citation_count ON openalex (citation_count);
    `);
    console.log('OpenAlex indexes created successfully');
    
    // Create indexes for Crossref table
    console.log('Creating indexes for Crossref table...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_crossref_title_trgm ON crossref_data_multiple_subjects USING gin (title gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_crossref_author_trgm ON crossref_data_multiple_subjects USING gin (author gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_crossref_publisher_trgm ON crossref_data_multiple_subjects USING gin (publisher gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_crossref_subjects_trgm ON crossref_data_multiple_subjects USING gin (subjects gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_crossref_citation_count ON crossref_data_multiple_subjects (citation_count);
    `);
    console.log('Crossref indexes created successfully');
    
    // Check if arxiv_papers table exists and create indexes if it does
    console.log('Checking for arxiv_papers table...');
    const arxivTableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'arxiv_papers'
      );
    `);
    
    if (arxivTableResult.rows[0].exists) {
      console.log('ArXiv table exists, creating indexes...');
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_arxiv_title_trgm ON arxiv_papers USING gin (title gin_trgm_ops);
        CREATE INDEX IF NOT EXISTS idx_arxiv_authors_trgm ON arxiv_papers USING gin (authors gin_trgm_ops);
        CREATE INDEX IF NOT EXISTS idx_arxiv_abstract_trgm ON arxiv_papers USING gin (abstract gin_trgm_ops);
      `);
      console.log('ArXiv indexes created successfully');
    } else {
      console.log('ArXiv table does not exist, skipping index creation');
    }
    
    // Run ANALYZE to update statistics
    console.log('Updating database statistics...');
    await client.query('ANALYZE');
    console.log('Database statistics updated');
    
    // Test queries to check performance
    console.log('Testing search performance...');
    
    console.log('Testing "Computer Science" search...');
    const startTime1 = Date.now();
    const result1 = await client.query(`
      SELECT COUNT(*) FROM openalex 
      WHERE title ILIKE '%Computer Science%' 
      OR author ILIKE '%Computer Science%' 
      OR journal ILIKE '%Computer Science%'
    `);
    console.log(`Found ${result1.rows[0].count} matches in OpenAlex in ${Date.now() - startTime1}ms`);
    
    const startTime2 = Date.now();
    const result2 = await client.query(`
      SELECT COUNT(*) FROM crossref_data_multiple_subjects 
      WHERE title ILIKE '%Computer Science%' 
      OR author ILIKE '%Computer Science%' 
      OR publisher ILIKE '%Computer Science%' 
      OR subjects ILIKE '%Computer Science%'
    `);
    console.log(`Found ${result2.rows[0].count} matches in Crossref in ${Date.now() - startTime2}ms`);
    
    // Table statistics
    console.log('Getting table statistics...');
    const statsResult = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM openalex) AS openalex_count,
        (SELECT COUNT(*) FROM crossref_data_multiple_subjects) AS crossref_count
    `);
    
    console.log('Database Table Statistics:');
    console.log(`- OpenAlex records: ${statsResult.rows[0].openalex_count}`);
    console.log(`- Crossref records: ${statsResult.rows[0].crossref_count}`);
    
    console.log('Database optimization completed successfully!');
    
  } catch (error) {
    console.error('Error during database optimization:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the optimization function
optimizeDatabase().then(() => {
  console.log('Optimization script completed');
}).catch(err => {
  console.error('Optimization script failed:', err);
});