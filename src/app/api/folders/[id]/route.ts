import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJWT } from '@/lib/services/auth-service'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body
    const folderId = parseInt(id)

    // Update folder
    const updatedFolder = await prisma.folder.update({
      where: {
        id: folderId,
        userId: payload.userId // Ensure user owns the folder
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
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const folderId = parseInt(id)

    // First get the folder
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId: payload.userId
      }
    })

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Recursively collect all folder IDs to delete
    const collectFolderIds = async (parentId: number): Promise<number[]> => {
      const children = await prisma.folder.findMany({
        where: { parentId, userId: payload.userId }
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
      where: { 
        id: { in: allFolderIds },
        userId: payload.userId
      }
    })
    const folderNames = allFolders.map(f => f.name)

    // Delete vocabulary items in these folders
    await prisma.vocabulary.deleteMany({
      where: {
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
  } catch (error) {
    console.error('Error deleting folder:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
