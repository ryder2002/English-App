const { Client } = require('pg');

async function createTables() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '10122002',
    database: 'english_app_db'
  });

  try {
    await client.connect();
    console.log('✅ Connected to english_app_db!');
    
    // Create enum
    await client.query(`
      CREATE TYPE "Language" AS ENUM ('english', 'chinese', 'vietnamese');
    `);
    console.log('✅ Created Language enum');
    
    // Create users table
    await client.query(`
      CREATE TABLE "users" (
        "id" SERIAL PRIMARY KEY,
        "email" VARCHAR(255) UNIQUE NOT NULL,
        "password" VARCHAR(255) NOT NULL,
        "name" VARCHAR(255),
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created users table');
    
    // Create folders table
    await client.query(`
      CREATE TABLE "folders" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("name", "user_id")
      );
    `);
    console.log('✅ Created folders table');
    
    // Create vocabulary table
    await client.query(`
      CREATE TABLE "vocabulary" (
        "id" SERIAL PRIMARY KEY,
        "word" VARCHAR(255) NOT NULL,
        "language" "Language" NOT NULL,
        "vietnamese_translation" TEXT NOT NULL,
        "folder" VARCHAR(255) NOT NULL,
        "part_of_speech" VARCHAR(100),
        "ipa" VARCHAR(255),
        "pinyin" VARCHAR(255),
        "audio_src" VARCHAR(500),
        "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created vocabulary table');
    
    // Create indexes
    await client.query(`
      CREATE INDEX "idx_vocabulary_user_id" ON "vocabulary"("user_id");
      CREATE INDEX "idx_vocabulary_folder" ON "vocabulary"("folder");
      CREATE INDEX "idx_vocabulary_language" ON "vocabulary"("language");
      CREATE INDEX "idx_folders_user_id" ON "folders"("user_id");
    `);
    console.log('✅ Created indexes');
    
    console.log('🎉 All tables created successfully!');
    
  } catch (err) {
    if (err.code === '42P07') {
      console.log('ℹ️  Tables already exist');
    } else if (err.code === '42710') {
      console.log('ℹ️  Enum already exists');
    } else {
      console.error('❌ Error:', err.message);
      console.error('Error code:', err.code);
    }
  } finally {
    await client.end();
  }
}

createTables();
