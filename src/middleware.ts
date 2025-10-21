import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Cho phép tất cả mọi người truy cập admin, không kiểm tra gì cả
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
