import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export async function GET(request: NextRequest) {
  try {
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenRouter API key not configured',
        key_present: false 
      }, { status: 400 });
    }

    console.log('🧪 Testing Gemma models with OpenRouter...');

    const models_to_test = [
      'google/gemma-2-27b-it:free',
      'google/gemma-7b-it:free',
      'mistralai/mistral-7b-instruct:free'
    ];

    const results = [];

    for (const model of models_to_test) {
      console.log(`Testing model: ${model}`);
      
      try {
        const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.OPENROUTER_SITE_URL || '',
            'X-Title': process.env.OPENROUTER_SITE_NAME || '',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'user',
                content: 'Hello! Can you respond with a simple JSON: {"status": "working", "model": "' + model + '"}'
              }
            ],
            max_tokens: 50,
            temperature: 0.1
          })
        });

        const data = await response.json();
        
        results.push({
          model: model,
          status: response.status,
          success: response.ok,
          response: data.choices?.[0]?.message?.content || data.error || 'No content',
          usage: data.usage || null
        });

        console.log(`✅ ${model}: ${response.status}`);
        
      } catch (error: any) {
        results.push({
          model: model,
          status: 'error',
          success: false,
          error: error.message
        });
        
        console.log(`❌ ${model}: ${error.message}`);
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const working_models = results.filter(r => r.success);
    const failed_models = results.filter(r => !r.success);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      api_key_configured: true,
      total_tested: models_to_test.length,
      working_count: working_models.length,
      failed_count: failed_models.length,
      working_models: working_models.map(m => m.model),
      failed_models: failed_models.map(m => m.model),
      detailed_results: results,
      recommended_config: {
        primary: working_models[0]?.model || 'google/gemma-7b-it:free',
        fallback: working_models[1]?.model || 'mistralai/mistral-7b-instruct:free'
      }
    });

  } catch (error: any) {
    console.error('💥 Test error:', error);
    return NextResponse.json({
      error: error.message || 'Test failed',
      success: false,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
