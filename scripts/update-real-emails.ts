import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || 'temp123456';

// Mapping Firebase UIDs to real emails based on Firebase export data
const FIREBASE_USER_MAPPING = {
  '87gBYVBM8sVucGRRY6kKYkO6qX53': 'buiminhphuong12b@gmail.com',
  'B07FdF3qyRNW5fmnDik32q8ZKNu2': 'domanhtung321@gmail.com',
  'F3Uz1de7NANixZ3PAFLzB7zhih53': 'nguyenanh10082007@gmail.com',
  'Fiu6RKWXg9OQfrYG8VCUvnWZhS63': 'dinhcongnhat.02@gmail.com',
  'L3Y818CshtQ87M7wu7RL8SDEr1H2': 'congnhat101202@gmail.com',
  'VYkQO7u3DObB8R6AcW4P0XPbWa22': 'phamlanthptb@gmail.com',
  'XKrNgGDkdfRQ7ReWEAT6VNbT7Gy2': 'giapthiloan.02@gmail.com',
  'YuAPglz62ygu5yzJmi8RaLkmt3N2': 'longocanh.2k11@gmail.com',
  'lt9Wxx9vslMgxhhMMdUeMNZnBzB3': 'ducmanhyl2003@gmail.com',
};

async function updateUsersWithRealEmails() {
  console.log('🔄 Updating users with real emails from Firebase...');
  
  try {
    let updatedCount = 0;
    let notFoundCount = 0;
    
    for (const [firebaseUid, realEmail] of Object.entries(FIREBASE_USER_MAPPING)) {
      console.log(`\n🔍 Processing Firebase UID: ${firebaseUid}`);
      console.log(`📧 Real email: ${realEmail}`);
      
      // Find user by firebaseUid
      const user = await prisma.user.findFirst({
        where: { firebaseUid: firebaseUid }
      });
      
      if (!user) {
        console.log(`⚠️ User not found for Firebase UID: ${firebaseUid}`);
        notFoundCount++;
        continue;
      }
      
      // Check if real email already exists for another user
      const emailExists = await prisma.user.findFirst({
        where: { 
          email: realEmail,
          id: { not: user.id }
        }
      });
      
      if (emailExists) {
        console.log(`⚠️ Email ${realEmail} already exists for another user`);
        continue;
      }
      
      // Update user with real email and better name
      const name = realEmail.split('@')[0];
      await prisma.user.update({
        where: { id: user.id },
        data: {
          email: realEmail,
          name: name,
        }
      });
      
      console.log(`✅ Updated user: ${user.email} → ${realEmail}`);
      updatedCount++;
    }
    
    console.log(`\n🎉 Email update complete!`);
    console.log(`✅ Updated: ${updatedCount} users`);
    console.log(`⚠️ Not found: ${notFoundCount} UIDs`);
    
    return updatedCount;
  } catch (error: any) {
    console.error('❌ Error updating emails:', error);
    throw error;
  }
}

async function showUpdatedUsers() {
  console.log('\n📋 Updated user list:');
  
  const users = await prisma.user.findMany({
    where: { firebaseUid: { not: null } },
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
  
  users.forEach((user, index) => {
    console.log(`\n${index + 1}. 👤 ${user.name}`);
    console.log(`   📧 Email: ${user.email}`);
    console.log(`   🔒 Password: ${DEFAULT_PASSWORD}`);
    console.log(`   📚 Vocabulary: ${user._count.vocabulary}`);
    console.log(`   📁 Folders: ${user._count.folders}`);
    console.log(`   🆔 Firebase UID: ${user.firebaseUid?.slice(-8)}...`);
  });
  
  return users;
}

async function main() {
  console.log('🚀 Updating Firebase users with real emails...');
  console.log(`🔐 All users will keep password: "${DEFAULT_PASSWORD}"`);
  
  try {
    // Update users with real emails
    const updatedCount = await updateUsersWithRealEmails();
    
    if (updatedCount > 0) {
      // Show final user list
      const users = await showUpdatedUsers();
      
      console.log('\n' + '='.repeat(60));
      console.log('🎉 Email update completed successfully!');
      console.log(`📊 Summary: ${users.length} users ready for login`);
      
      console.log('\n🔑 Login Instructions:');
      console.log('1. Use any email from the list above');
      console.log(`2. Password for all accounts: "${DEFAULT_PASSWORD}"`);
      console.log('3. Change password after first login');
      console.log('4. All your folders and vocabulary are preserved!');
      
      if (users.length > 0) {
        console.log('\n📝 Quick login example:');
        console.log(`   Email: ${users[0].email}`);
        console.log(`   Password: ${DEFAULT_PASSWORD}`);
      }
    }
    
  } catch (error: any) {
    console.error('\n💥 Update failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure PostgreSQL database is running');
    console.log('2. Verify migration was completed successfully');
    console.log('3. Check if user mapping is correct');
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { FIREBASE_USER_MAPPING };
