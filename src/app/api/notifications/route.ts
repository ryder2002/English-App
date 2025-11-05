import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Lấy thông báo hệ thống công khai (chỉ thông báo đang active)
export async function GET(request: NextRequest) {
  try {
    const notifications = await prisma.systemNotification.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10, // Lấy 10 thông báo gần nhất
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({ notifications });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

