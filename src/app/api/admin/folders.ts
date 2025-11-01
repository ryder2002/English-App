import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

function ensureAdminOrThrow(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/, '') || req.cookies.get('token')?.value;
  if (!token) throw new Error('Unauthorized');
  return token;
}

export async function GET(request: NextRequest) {
  try {
    const token = ensureAdminOrThrow(request);
    const user = await AuthService.verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // IMPORTANT: Only return folders owned by the logged-in admin
    // Admin folders are completely separate from user folders
    const folders = await prisma.folder.findMany({
      where: {
        userId: user.id // Strict filter - only admin's own folders
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        children: {
          where: {
            userId: user.id // Also filter children by admin's userId
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Debug logging
    console.log(`[Admin Folders API] Admin ${user.id} requested folders. Returning ${folders.length} folders.`);
    
    return NextResponse.json(folders);
  } catch (error: any) {
    console.error('Admin folders API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
