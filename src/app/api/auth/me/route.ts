import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/auth-service'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const tokenFromCookie = request.cookies.get('token')?.value || null;
    const token = tokenFromHeader || tokenFromCookie;

    if (!token) {
      // This is normal for unauthenticated users - not an error
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await AuthService.verifyToken(token)

    if (!payload) {
      // Token invalid or expired - clear cookie if exists
      const response = NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      response.cookies.delete('token')
      return response
    }

    return NextResponse.json({
      user: {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        role: payload.role
      }
    })

  } catch (error: any) {
    console.error('Auth verification error:', error)
    // If verification fails, clear the invalid cookie
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    response.cookies.delete('token')
    return response
  }
}
