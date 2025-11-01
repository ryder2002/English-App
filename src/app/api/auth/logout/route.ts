import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  
  // Clear cookies
  response.cookies.delete('token');
  response.cookies.delete('role');
  
  return response;
}

