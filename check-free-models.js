// Check what free models are actually available on OpenRouter
const API_KEY = "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";
const BASE_URL = "https://openrouter.ai/api/v1";

async function checkAvailableModels() {
  console.log("🔍 Kiểm tra các model free có sẵn trên OpenRouter...");
  
  try {
    const response = await fetch(`${BASE_URL}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      console.error("❌ Không thể lấy danh sách models:", response.status);
      return;
    }

    const data = await response.json();
    const models = data.data || [];
    
    console.log(`📊 Tổng số models: ${models.length}`);
    
    // Tìm các model FREE
    const freeModels = models.filter(model => {
      const pricing = model.pricing;
      return pricing && (
        (pricing.prompt === "0" && pricing.completion === "0") ||
        model.id.includes(":free") ||
        (pricing.prompt === 0 && pricing.completion === 0)
      );
    });
    
    console.log(`\n🆓 Các model MIỄN PHÍ (${freeModels.length}):`);
    console.log("=".repeat(50));
    
    // Sắp xếp theo tên
    freeModels.sort((a, b) => a.id.localeCompare(b.id));
    
    freeModels.forEach((model, index) => {
      console.log(`${index + 1}. ${model.id}`);
      if (model.name) console.log(`   📝 ${model.name}`);
      console.log(`   💰 Giá: ${model.pricing?.prompt || '0'}/${model.pricing?.completion || '0'}`);
      console.log(`   📏 Context: ${model.context_length || 'N/A'} tokens`);
      console.log("");
    });
    
    // Tìm các model tốt cho chat/assessment
    const goodForChat = freeModels.filter(model => {
      const id = model.id.toLowerCase();
      const contextLength = model.context_length || 0;
      
      // Ưu tiên models có context length lớn và phổ biến
      return (contextLength >= 4000) && (
        id.includes('mistral') || 
        id.includes('llama') || 
        id.includes('phi') ||
        id.includes('qwen') ||
        id.includes('gemma') ||
        id.includes('openchat') ||
        id.includes('zephyr')
      );
    });
    
    console.log(`⭐ KHUYẾN NGHỊ cho Speech Assessment (${goodForChat.length}):`);
    console.log("=".repeat(50));
    
    goodForChat.forEach((model, index) => {
      console.log(`${index + 1}. ✨ ${model.id}`);
      if (model.name) console.log(`   📝 ${model.name}`);
      console.log(`   📏 Context: ${model.context_length} tokens`);
      console.log("");
    });
    
    return goodForChat;
    
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách models:", error.message);
    return [];
  }
}

// Test model cụ thể
async function testSpecificModel(modelId) {
  console.log(`\n🧪 Test model: ${modelId}`);
  
  const testPrompt = `Tạo một đánh giá phát âm JSON đơn giản cho văn bản: "Hello world"

Trả lời chỉ với JSON:
{
  "transcription": "Hello world",
  "originalText": "Hello world", 
  "overallScore": 85,
  "accuracy": 90,
  "fluency": 80,
  "feedback": ["Good pronunciation!"],
  "suggestions": ["Keep practicing"]
}`;

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
        model: modelId,
        messages: [
          {
            role: 'user',
            content: testPrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`❌ ${modelId} không hoạt động:`, data.error?.message || data);
      return false;
    }

    const content = data.choices[0]?.message?.content;
    console.log(`✅ ${modelId} hoạt động!`);
    console.log(`📝 Response: ${content?.substring(0, 100)}...`);
    
    // Thử parse JSON
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log(`🎯 JSON hợp lệ: overallScore = ${parsed.overallScore}`);
      }
    } catch (e) {
      console.log(`⚠️ JSON không hợp lệ, nhưng model vẫn phản hồi`);
    }
    
    return true;
    
  } catch (error) {
    console.error(`❌ ${modelId} lỗi:`, error.message);
    return false;
  }
}

async function main() {
  const availableModels = await checkAvailableModels();
  
  if (availableModels.length === 0) {
    console.log("❌ Không tìm thấy model miễn phí nào!");
    return;
  }
  
  // Test top 3 models
  console.log("\n🔧 Test các model tốt nhất...");
  console.log("=".repeat(30));
  
  const modelsToTest = availableModels.slice(0, 3);
  const workingModels = [];
  
  for (const model of modelsToTest) {
    const works = await testSpecificModel(model.id);
    if (works) {
      workingModels.push(model.id);
    }
    await new Promise(resolve => setTimeout(resolve, 2000)); // Đợi 2s
  }
  
  console.log("\n🎉 KẾT QUẢ CUỐI CÙNG:");
  console.log("=".repeat(30));
  console.log(`✅ Models hoạt động: ${workingModels.length}`);
  workingModels.forEach((model, index) => {
    console.log(`${index + 1}. ${model}`);
  });
  
  if (workingModels.length > 0) {
    console.log(`\n💡 KHUYẾN NGHỊ:`);
    console.log(`Primary Model: ${workingModels[0]}`);
    console.log(`Fallback Model: ${workingModels[1] || workingModels[0]}`);
  }
}

main().catch(console.error);
