import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJWT } from '@/lib/services/auth-service'

function getTokenFromRequest(request: NextRequest) {
  // Try cookie first (preferred for browser requests)
  const cookie = request.cookies.get('token')?.value
  if (cookie) return cookie
  
  // Fallback to authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  return null
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
    const { name } = body
    const folderId = parseInt(id)

    // Check if user is admin - admins can update any folder
    const isAdmin = payload.role === 'admin'
    
    // First check if folder exists
    const folder = await prisma.folder.findFirst({
      where: isAdmin
        ? { id: folderId }
        : { id: folderId, userId: payload.userId }
    })

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Update folder
    const updatedFolder = await prisma.folder.update({
      where: {
        id: folderId
      },
      data: { name }
    })

    const formattedFolder = {
      id: updatedFolder.id.toString(),
      name: updatedFolder.name,
      userId: updatedFolder.userId,
      parentId: updatedFolder.parentId ? updatedFolder.parentId.toString() : null,
      createdAt: updatedFolder.createdAt.toISOString()
    }

    return NextResponse.json({ folder: formattedFolder })
  } catch (error) {
    console.error('Error updating folder:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify authentication
    const token = getTokenFromRequest(request)
    if (!token) {
      console.error('[DELETE Folder] No token provided')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyJWT(token)
    if (!payload) {
      console.error('[DELETE Folder] Invalid token')
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const folderId = parseInt(id)
    const isAdmin = payload.role === 'admin'

    // First get the folder
    const folder = await prisma.folder.findFirst({
      where: isAdmin 
        ? { id: folderId }
        : { id: folderId, userId: payload.userId }
    })

    if (!folder) {
      console.error(`[DELETE Folder] Folder ${folderId} not found for user ${payload.userId}`)
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Recursively collect all folder IDs to delete
    const collectFolderIds = async (parentId: number): Promise<number[]> => {
      const children = await prisma.folder.findMany({
        where: isAdmin 
          ? { parentId }
          : { parentId, userId: payload.userId }
      })
      
      let ids = [parentId]
      for (const child of children) {
        const childIds = await collectFolderIds(child.id)
        ids = ids.concat(childIds)
      }
      return ids
    }

    const allFolderIds = await collectFolderIds(folder.id)

    // Get all folder names for vocabulary deletion
    const allFolders = await prisma.folder.findMany({
      where: isAdmin
        ? { id: { in: allFolderIds } }
        : { 
            id: { in: allFolderIds },
            userId: payload.userId
          }
    })
    const folderNames = allFolders.map(f => f.name)

    // Delete quizzes that use these folders
    await prisma.quiz.deleteMany({
      where: {
        folderId: { in: allFolderIds }
      }
    })

    // Delete vocabulary items in these folders
    await prisma.vocabulary.deleteMany({
      where: isAdmin
        ? { folder: { in: folderNames } }
        : {
            userId: payload.userId,
            folder: { in: folderNames }
          }
    })

    // Delete folders (cascade will handle children)
    await prisma.folder.delete({
      where: {
        id: folderId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[DELETE Folder] Error:', error)
    console.error('[DELETE Folder] Error stack:', error.stack)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}
