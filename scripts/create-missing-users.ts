import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || 'temp123456';

// Missing Firebase users that need to be created
const MISSING_FIREBASE_USERS = {
  'B07FdF3qyRNW5fmnDik32q8ZKNu2': 'domanhtung321@gmail.com',
  'F3Uz1de7NANixZ3PAFLzB7zhih53': 'nguyenanh10082007@gmail.com',
  // 'Fiu6RKWXg9OQfrYG8VCUvnWZhS63': 'dinhcongnhat.02@gmail.com', // This conflicts with existing user
};

async function createMissingUsers() {
  console.log('🔄 Creating missing Firebase users...');
  
  try {
    let createdCount = 0;
    
    for (const [firebaseUid, email] of Object.entries(MISSING_FIREBASE_USERS)) {
      console.log(`\n🔍 Creating user: ${firebaseUid}`);
      console.log(`📧 Email: ${email}`);
      
      // Check if user already exists by email
      const existingUser = await prisma.user.findUnique({
        where: { email: email }
      });
      
      if (existingUser) {
        console.log(`⚠️ User already exists: ${email}`);
        continue;
      }
      
      // Check if firebaseUid already exists
      const existingByUid = await prisma.user.findFirst({
        where: { firebaseUid: firebaseUid }
      });
      
      if (existingByUid) {
        console.log(`⚠️ Firebase UID already exists: ${firebaseUid}`);
        continue;
      }
      
      // Create new user
      const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);
      const name = email.split('@')[0];
      
      await prisma.user.create({
        data: {
          email: email,
          password: hashedPassword,
          name: name,
          firebaseUid: firebaseUid,
          createdAt: new Date(),
        }
      });
      
      console.log(`✅ Created user: ${email} (temp password: ${DEFAULT_PASSWORD})`);
      createdCount++;
    }
    
    console.log(`\n🎉 Missing users creation complete! Created: ${createdCount} users`);
    return createdCount;
  } catch (error: any) {
    console.error('❌ Error creating missing users:', error);
    throw error;
  }
}

async function showAllUsers() {
  console.log('\n📋 Complete user list:');
  
  const users = await prisma.user.findMany({
    select: {
      email: true,
      name: true,
      firebaseUid: true,
      _count: {
        select: {
          vocabulary: true,
          folders: true
        }
      }
    },
    orderBy: { email: 'asc' }
  });
  
  users.forEach((user: any, index: number) => {
    console.log(`\n${index + 1}. 👤 ${user.name}`);
    console.log(`   📧 Email: ${user.email}`);
    console.log(`   🔒 Password: ${DEFAULT_PASSWORD}`);
    console.log(`   📚 Vocabulary: ${user._count.vocabulary}`);
    console.log(`   📁 Folders: ${user._count.folders}`);
    console.log(`   🆔 Firebase UID: ${user.firebaseUid ? user.firebaseUid.slice(-8) + '...' : 'N/A'}`);
  });
  
  return users;
}

async function main() {
  console.log('🚀 Creating missing Firebase users...');
  console.log(`🔐 Default password: "${DEFAULT_PASSWORD}"`);
  
  try {
    // Create missing users
    const createdCount = await createMissingUsers();
    
    // Show all users
    const allUsers = await showAllUsers();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 All Firebase users are now available!');
    console.log(`📊 Total users: ${allUsers.length}`);
    console.log(`➕ New users created: ${createdCount}`);
    
    console.log('\n🔑 Login with any of the emails above:');
    console.log(`   Password for all: "${DEFAULT_PASSWORD}"`);
    
    // Show users with most data
    const usersWithData = allUsers.filter((user: any) => user._count.vocabulary > 0);
    if (usersWithData.length > 0) {
      console.log('\n📚 Users with vocabulary data:');
      usersWithData.forEach((user: any, index: number) => {
        console.log(`   ${index + 1}. ${user.email} (${user._count.vocabulary} words, ${user._count.folders} folders)`);
      });
    }
    
  } catch (error: any) {
    console.error('\n💥 Creation failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
