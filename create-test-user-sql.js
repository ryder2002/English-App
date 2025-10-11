const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '10122002',
    database: 'english_app_db'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash('123456', 12);
    console.log('✅ Password hashed');
    
    // Check if user exists
    const checkUser = await client.query('SELECT * FROM users WHERE email = $1', ['dinhcongnhat.02@gmail.com']);
    
    if (checkUser.rows.length > 0) {
      console.log('ℹ️  User already exists:', checkUser.rows[0]);
    } else {
      console.log('👤 Creating user...');
      const result = await client.query(`
        INSERT INTO users (email, password, name, created_at, updated_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, email, name, created_at
      `, ['dinhcongnhat.02@gmail.com', hashedPassword, 'Test User']);
      
      console.log('✅ Created test user:', result.rows[0]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createTestUser();
