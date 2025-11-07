import { NextRequest, NextResponse } from 'next/server';

// Test endpoint to check if API is working
export async function GET() {
  return NextResponse.json({ 
    status: 'OK', 
    message: 'Submit speaking API is working',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Test submit-speaking API called with:', {
      hasAudioBase64: !!body.audioBase64,
      audioBase64Length: body.audioBase64?.length || 0,
      transcribedText: body.transcribedText,
      transcribedTextLength: body.transcribedText?.length || 0
    });

    return NextResponse.json({ 
      status: 'TEST_OK', 
      message: 'API endpoint received data successfully',
      receivedData: {
        hasAudioBase64: !!body.audioBase64,
        audioBase64Length: body.audioBase64?.length || 0,
        transcribedText: body.transcribedText,
        transcribedTextLength: body.transcribedText?.length || 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Test submit-speaking API error:', error);
    return NextResponse.json({ 
      status: 'ERROR', 
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
