import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth-service';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await AuthService.register(email, password, name);

    // Decide redirect target for client
    const redirectTo = result?.user?.role === 'admin' ? '/admin' : '/';

    const res = NextResponse.json({ ...result, redirectTo });

    const isProd = process.env.NODE_ENV === 'production';
    // Use 'lax' in dev to ensure cookies are accepted on localhost
    const sameSite: 'lax' | 'none' = 'lax';

    // set httpOnly token cookie so middleware and server can read it
    if (result?.token) {
      res.cookies.set('token', String(result.token), {
        path: '/',
        httpOnly: true,
        sameSite,
        secure: isProd,
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    // set role cookie so client-side UI/middleware can use it (non-httpOnly)
    if (result?.user?.role) {
      res.cookies.set('role', String(result.user.role), {
        path: '/',
        sameSite,
        secure: isProd,
        maxAge: 60 * 60 * 24 * 7,
      });
    }
    
    return res;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 400 }
    );
  }
}
