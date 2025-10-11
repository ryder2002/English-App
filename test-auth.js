const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function testAuth() {
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
    
    // Test user lookup
    const user = await client.query('SELECT * FROM users WHERE email = $1', ['dinhcongnhat.02@gmail.com']);
    
    if (user.rows.length === 0) {
      console.log('❌ No user found');
      return;
    }
    
    console.log('👤 Found user:', {
      id: user.rows[0].id,
      email: user.rows[0].email,
      name: user.rows[0].name
    });
    
    // Test password verification
    const isPasswordValid = await bcrypt.compare('123456', user.rows[0].password);
    console.log('🔐 Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Password does not match');
      return;
    }
    
    console.log('✅ Authentication successful!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

testAuth();
