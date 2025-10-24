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

    // Get vocabulary for user
    const vocabulary = await prisma.vocabulary.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' }
    })

    // Convert to match the existing VocabularyItem interface
    const formattedVocabulary = vocabulary.map((item: any) => ({
      id: item.id.toString(),
      word: item.word,
      language: item.language,
      vietnameseTranslation: item.vietnameseTranslation,
      folder: item.folder,
      partOfSpeech: item.partOfSpeech || undefined,
      ipa: item.ipa || undefined,
      pinyin: item.pinyin || undefined,
      createdAt: item.createdAt.toISOString(),
      audioSrc: item.audioSrc || undefined
    }))

    return NextResponse.json({ vocabulary: formattedVocabulary })
  } catch (error) {
    console.error('Error fetching vocabulary:', error)
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
    const { item } = body

    // Create new vocabulary item
    const newItem = await prisma.vocabulary.create({
      data: {
        word: item.word,
        language: item.language,
        vietnameseTranslation: item.vietnameseTranslation,
        folder: item.folder,
        partOfSpeech: item.partOfSpeech || null,
        ipa: item.ipa || null,
        pinyin: item.pinyin || null,
        audioSrc: item.audioSrc || null,
        userId: payload.userId
      }
    })

    const formattedItem = {
      id: newItem.id.toString(),
      word: newItem.word,
      language: newItem.language,
      vietnameseTranslation: newItem.vietnameseTranslation,
      folder: newItem.folder,
      partOfSpeech: newItem.partOfSpeech || undefined,
      ipa: newItem.ipa || undefined,
      pinyin: newItem.pinyin || undefined,
      createdAt: newItem.createdAt.toISOString(),
      audioSrc: newItem.audioSrc || undefined
    }

    return NextResponse.json({ vocabulary: formattedItem })
  } catch (error) {
    console.error('Error creating vocabulary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
