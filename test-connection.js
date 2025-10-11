const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '10122002',
    database: 'english_app_db'
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL successfully!');
    
    const result = await client.query('SELECT version()');
    console.log('🎉 PostgreSQL version:', result.rows[0].version);
    
    // Test creating a simple table
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_connection (
        id SERIAL PRIMARY KEY,
        message TEXT
      )
    `);
    console.log('✅ Table creation test passed!');
    
    // Clean up
    await client.query('DROP TABLE IF EXISTS test_connection');
    console.log('✅ Connection test completed successfully!');
    
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    console.error('Error code:', err.code);
    console.error('Error details:', err);
  } finally {
    await client.end();
  }
}

testConnection();
