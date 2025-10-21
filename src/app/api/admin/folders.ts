import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const folders = await prisma.folder.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      children: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(folders);
}
