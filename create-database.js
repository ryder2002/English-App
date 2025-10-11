const { Client } = require('pg');

async function createDatabase() {
  // First connect to postgres default database
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '10122002',
    database: 'postgres' // Connect to default postgres database first
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL server!');
    
    // Check if database exists
    const checkDb = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = 'english_app_db'
    `);
    
    if (checkDb.rows.length === 0) {
      // Create database
      await client.query('CREATE DATABASE english_app_db');
      console.log('✅ Database english_app_db created successfully!');
    } else {
      console.log('ℹ️  Database english_app_db already exists');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

createDatabase();
