import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const clazzes = await prisma.clazz.findMany({
    include: {
      teacher: { select: { id: true, name: true, email: true } },
      members: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(clazzes);
}
