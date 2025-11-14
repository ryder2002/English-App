import { prisma } from '../src/lib/prisma';

async function checkChatTables() {
  try {
    console.log('🔍 Checking chat_conversations table...');
    
    // Try to query chat_conversations
    const convCount = await prisma.chatConversation.count();
    console.log(`✅ chat_conversations table exists! Count: ${convCount}`);
    
    // Try to query chat_messages
    const msgCount = await prisma.chatMessage.count();
    console.log(`✅ chat_messages table exists! Count: ${msgCount}`);
    
    console.log('\n✅ All chat history tables are working!');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Run: npx prisma db push');
    console.log('   Then: npx prisma generate');
  } finally {
    await prisma.$disconnect();
  }
}

checkChatTables();
