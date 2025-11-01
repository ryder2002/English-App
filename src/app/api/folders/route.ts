import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJWT } from '@/lib/services/auth-service'

function getTokenFromRequest(request: NextRequest) {
  const cookie = request.cookies.get('token')?.value
  return cookie || null
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const payload = verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // IMPORTANT: Only return folders owned by the logged-in user
    // Admin folders should NOT appear in user's folder list
    // Admin folders are only accessible to admin and used in quizzes
    const userId = payload.userId;
    
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get folders ONLY for this specific user
    // This ensures users see only their own folders
    const folders = await prisma.folder.findMany({
      where: { userId: userId }, // Strict filter by user ID
      orderBy: { createdAt: 'desc' }
    })

    const formattedFolders = folders.map(folder => ({
      id: folder.id.toString(),
      name: folder.name,
      userId: folder.userId,
      parentId: folder.parentId ? folder.parentId.toString() : null,
      createdAt: folder.createdAt.toISOString()
    }))

    // CRITICAL: Double-check that all returned folders belong to this user
    // Filter out any folders that don't match userId (safety check)
    const filteredFolders = formattedFolders.filter(folder => {
      const matches = folder.userId === userId;
      if (!matches) {
        console.error(`[Folders API ERROR] Folder ${folder.id} has userId ${folder.userId} but requested by user ${userId}!`);
      }
      return matches;
    });

    // Debug logging
    console.log(`[Folders API] User ${userId} (role: ${user.role}) requested folders. Found ${formattedFolders.length} folders, returning ${filteredFolders.length} after filtering.`);
    if (filteredFolders.length > 0) {
      console.log(`[Folders API] First folder userId: ${filteredFolders[0].userId}, name: ${filteredFolders[0].name}`);
    }

    return NextResponse.json({ folders: filteredFolders })
  } catch (error) {
    console.error('Error fetching folders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const payload = verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { name, parentId } = body

    // Create new folder
    const newFolder = await prisma.folder.create({
      data: {
        name,
        userId: payload.userId,
        parentId: parentId ? parseInt(parentId) : null
      }
    })

    const formattedFolder = {
      id: newFolder.id.toString(),
      name: newFolder.name,
      userId: newFolder.userId,
      parentId: newFolder.parentId ? newFolder.parentId.toString() : null,
      createdAt: newFolder.createdAt.toISOString()
    }

    return NextResponse.json({ folder: formattedFolder })
  } catch (error) {
    console.error('Error creating folder:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
