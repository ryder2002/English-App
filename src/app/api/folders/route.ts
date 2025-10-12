import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJWT } from '@/lib/services/auth-service'

export async function GET(request: NextRequest) {
  try {
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

    // Get folders for user with hierarchy
    const folders = await prisma.folder.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' }
    })

    const formattedFolders = folders.map(folder => ({
      id: folder.id.toString(),
      name: folder.name,
      userId: folder.userId,
      parentId: folder.parentId ? folder.parentId.toString() : null,
      createdAt: folder.createdAt.toISOString()
    }))

    return NextResponse.json({ folders: formattedFolders })
  } catch (error) {
    console.error('Error fetching folders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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
