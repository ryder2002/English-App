// Test Gemma 3 models for speech assessment
const API_KEY = "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";
const BASE_URL = "https://openrouter.ai/api/v1";

async function testGemma3Models() {
  console.log("🧪 Testing Gemma 3 models cho Speech Assessment...");
  
  const models = [
    "google/gemma-3-27b-it:free",
    "google/gemma-3-12b-it:free",
    "meta-llama/llama-3.3-70b-instruct:free", // Backup option
    "mistralai/mistral-small-3.2-24b-instruct:free" // Another backup
  ];
  
  const testText = "Hello world, how are you today?";
  
  for (const model of models) {
    console.log(`\n📊 Testing ${model}...`);
    
    const prompt = `You are an expert language pronunciation assessor. Create a realistic pronunciation assessment.

ORIGINAL TEXT: "${testText}"
LANGUAGE: English

Generate a detailed assessment in this EXACT JSON format:
{
  "transcription": "Hello world, how are you today?",
  "originalText": "${testText}",
  "overallScore": 75,
  "accuracy": 80,
  "fluency": 70,
  "completeness": 90,
  "prosody": 75,
  "wordAssessments": [
    {
      "word": "Hello",
      "accuracy": 85,
      "fluency": 80,
      "completeness": 100,
      "prosody": 75,
      "phonemeScores": [{"phoneme": "H", "accuracy": 90}]
    }
  ],
  "feedback": ["Good pronunciation! Keep practicing for better fluency."],
  "suggestions": ["Practice daily", "Focus on rhythm"]
}

Respond with valid JSON only.`;

    try {
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://cnenglish.io.vn',
          'X-Title': 'CN English Learning',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert pronunciation assessor. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1500
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error(`❌ ${model} failed:`, data.error?.message || data);
        continue;
      }

      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        console.error(`❌ ${model}: No content received`);
        continue;
      }

      console.log(`✅ ${model} responded (${content.length} chars)`);
      
      // Try to parse JSON
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        const assessment = JSON.parse(jsonString);
        
        console.log(`🎯 JSON parsed successfully!`);
        console.log(`📊 Overall Score: ${assessment.overallScore}`);
        console.log(`🎯 Accuracy: ${assessment.accuracy}`);
        console.log(`💬 Feedback: ${assessment.feedback?.length || 0} items`);
        console.log(`💡 Suggestions: ${assessment.suggestions?.length || 0} items`);
        console.log(`📝 Word Assessments: ${assessment.wordAssessments?.length || 0} words`);
        
        // Validate structure
        const isValid = assessment.transcription && 
                        assessment.originalText && 
                        typeof assessment.overallScore === 'number' &&
                        Array.isArray(assessment.feedback) &&
                        Array.isArray(assessment.suggestions);
        
        console.log(`✅ Structure: ${isValid ? 'VALID' : 'INVALID'}`);
        
        if (isValid) {
          console.log(`🎉 ${model} hoạt động HOÀN HẢO cho Speech Assessment!`);
          return model; // Return first working model
        }
        
      } catch (parseError) {
        console.error(`❌ JSON parse failed:`, parseError.message);
        console.log(`Raw response preview: ${content.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.error(`❌ ${model} request failed:`, error.message);
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return null;
}

async function testBasicCapability() {
  console.log("💬 Test khả năng cơ bản...");
  
  const models = [
    "google/gemma-3-27b-it:free",
    "google/gemma-3-12b-it:free"
  ];
  
  for (const model of models) {
    console.log(`\n🤖 Testing basic chat: ${model}`);
    
    try {
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://cnenglish.io.vn',
          'X-Title': 'CN English Learning',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: 'Hello! Please say "Working!" if you understand.'
            }
          ],
          max_tokens: 50,
          temperature: 0.1
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error(`❌ ${model}:`, data.error?.message || data);
        continue;
      }

      const content = data.choices[0]?.message?.content;
      console.log(`✅ ${model}: ${content}`);
      
    } catch (error) {
      console.error(`❌ ${model} error:`, error.message);
    }
  }
}

async function main() {
  console.log("🚀 Testing Gemma 3 cho Speech Assessment");
  console.log("=========================================");
  
  await testBasicCapability();
  
  const workingModel = await testGemma3Models();
  
  console.log("\n🏁 KẾT QUẢ:");
  console.log("===========");
  
  if (workingModel) {
    console.log(`✅ Model hoạt động tốt: ${workingModel}`);
    console.log(`💡 Bạn có thể sử dụng model này cho speech assessment!`);
  } else {
    console.log(`❌ Không có model nào hoạt động hoàn hảo`);
    console.log(`💡 Có thể cần fallback về basic assessment`);
  }
}

main().catch(console.error);
