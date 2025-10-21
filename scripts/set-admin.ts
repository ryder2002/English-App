import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // First list all users
    console.log('\nCurrent users in the system:')
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true // Include password hash for verification
      },
      orderBy: {
        id: 'asc'
      }
    })
    
    if (users.length === 0) {
      console.log('No users found in the database')
      return
    }

    console.table(users)

    // If an email was provided, update that user
    const userEmail = process.argv[2]
    if (!userEmail) {
      console.log('\nTo make a user admin, run this script with their email:')
      console.log('npx ts-node scripts/set-admin.ts user@email.com')
      return
    }

    const updatedUser = await prisma.user.update({
      where: { email: userEmail },
      data: { role: 'admin' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    console.log('Successfully updated user to admin:', updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
