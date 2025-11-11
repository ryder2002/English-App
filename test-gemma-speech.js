// Test script to check if Gemma models can handle speech assessment
const API_KEY = "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";
const BASE_URL = "https://openrouter.ai/api/v1";

async function testGemmaSpeechAssessment() {
  console.log("🧪 Testing Gemma models for speech assessment...");
  
  const testText = "Hello world, how are you today?";
  const models = [
    "google/gemma-2-27b-it:free",
    "google/gemma-7b-it:free"
  ];
  
  for (const model of models) {
    console.log(`\n📊 Testing ${model}...`);
    
    const prompt = `You are an expert language pronunciation assessor. I need you to create a realistic pronunciation assessment for language learning.

ORIGINAL TEXT TO READ: "${testText}"
LANGUAGE: English

Since I cannot provide the actual audio transcription, please generate a REALISTIC assessment scenario where a language learner attempts to read this text. Consider common pronunciation challenges for this language.

Provide a detailed assessment in this EXACT JSON format:
{
  "transcription": "<simulate realistic transcription with some common errors>",
  "originalText": "${testText}",
  "overallScore": <number 60-85>,
  "accuracy": <number 60-90>,
  "fluency": <number 50-80>,
  "completeness": <number 70-95>,
  "prosody": <number 55-85>,
  "wordAssessments": [
    {
      "word": "<each_word_from_original>",
      "accuracy": <number 50-95>,
      "fluency": <number 60-90>,
      "completeness": <number 80-100>,
      "prosody": <number 60-85>,
      "phonemeScores": [{"phoneme": "<char>", "accuracy": <number 60-95>}]
    }
  ],
  "feedback": ["<specific feedback based on simulated errors>"],
  "suggestions": ["<actionable improvement suggestions>"]
}

Make it realistic - include some pronunciation challenges typical for this language, but keep scores reasonable for a learning context.`;

    try {
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://cnenglish.io.vn',
          'X-Title': 'CN English Learning Test',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert pronunciation assessor. Always respond with valid JSON only. Make realistic assessments that help language learners improve.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.4,
          max_tokens: 2000
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error(`❌ ${model} failed:`, data);
        continue;
      }

      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        console.error(`❌ ${model}: No content received`);
        continue;
      }

      console.log(`✅ ${model} Response length:`, content.length);
      
      // Try to parse JSON
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        const assessment = JSON.parse(jsonString);
        
        console.log(`✅ ${model} JSON parsed successfully!`);
        console.log(`📊 Overall Score: ${assessment.overallScore}`);
        console.log(`🎯 Accuracy: ${assessment.accuracy}`);
        console.log(`💬 Feedback: ${assessment.feedback?.length || 0} items`);
        console.log(`💡 Suggestions: ${assessment.suggestions?.length || 0} items`);
        
        // Check if it has proper structure
        const hasRequiredFields = assessment.transcription && 
                                 assessment.originalText && 
                                 typeof assessment.overallScore === 'number' &&
                                 Array.isArray(assessment.feedback);
        
        console.log(`📋 Structure valid: ${hasRequiredFields ? '✅' : '❌'}`);
        
      } catch (parseError) {
        console.error(`❌ ${model} JSON parse failed:`, parseError.message);
        console.log("Raw response:", content.substring(0, 200) + "...");
      }
      
    } catch (error) {
      console.error(`❌ ${model} request failed:`, error.message);
    }
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Test simple chat capability
async function testSimpleChat() {
  console.log("\n💬 Testing simple chat capability...");
  
  const models = [
    "google/gemma-2-27b-it:free",
    "google/gemma-7b-it:free"
  ];
  
  for (const model of models) {
    console.log(`\n🤖 Testing ${model} basic chat...`);
    
    try {
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://cnenglish.io.vn',
          'X-Title': 'CN English Learning Test',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: 'Hello! Please respond with a simple JSON object: {"status": "working", "model": "' + model + '", "timestamp": "' + new Date().toISOString() + '"}'
            }
          ],
          max_tokens: 100,
          temperature: 0.1
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error(`❌ ${model} failed:`, data);
        continue;
      }

      const content = data.choices[0]?.message?.content;
      console.log(`✅ ${model} responded:`, content);
      
    } catch (error) {
      console.error(`❌ ${model} failed:`, error.message);
    }
  }
}

// Run tests
async function runAllTests() {
  console.log("🚀 Starting Gemma Speech Assessment Tests");
  console.log("==========================================");
  
  await testSimpleChat();
  await testGemmaSpeechAssessment();
  
  console.log("\n🏁 Tests completed!");
}

runAllTests().catch(console.error);
