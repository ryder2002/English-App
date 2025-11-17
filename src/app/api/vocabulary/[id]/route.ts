import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJWT } from '@/lib/services/auth-service'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify authentication - READ FROM COOKIE like other APIs
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { updates } = body
    const vocabularyId = parseInt(id)

    // Update vocabulary item
    const updatedItem = await prisma.vocabulary.update({
      where: {
        id: vocabularyId,
        userId: payload.userId // Ensure user owns the vocabulary
      },
      data: {
        word: updates.word,
        language: updates.language,
        vietnameseTranslation: updates.vietnameseTranslation,
        folder: updates.folder,
        partOfSpeech: updates.partOfSpeech || null,
        ipa: updates.ipa || null,
        pinyin: updates.pinyin || null,
        example: updates.example || null,
        audioSrc: updates.audioSrc || null
      }
    })

    return NextResponse.json({ vocabulary: updatedItem })
  } catch (error) {
    console.error('Error updating vocabulary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify authentication - READ FROM COOKIE like other APIs
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const vocabularyId = parseInt(id)

    // Delete vocabulary item
    await prisma.vocabulary.delete({
      where: {
        id: vocabularyId,
        userId: payload.userId // Ensure user owns the vocabulary
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting vocabulary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
