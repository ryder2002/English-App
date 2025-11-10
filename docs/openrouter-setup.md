# OpenRouter Setup Guide for AI Speech Assessment

## 🚀 Quick Setup Steps

### 1. **Get OpenRouter API Key**
1. Visit [OpenRouter.ai](https://openrouter.ai/)
2. Sign up for an account
3. Go to [API Keys](https://openrouter.ai/keys) 
4. Create a new API key
5. Copy the key (starts with `sk-or-...`)

### 2. **Add to Environment**
```bash
# In your .env.local file
OPENROUTER_API_KEY=sk-or-your-actual-api-key-here
OPENROUTER_SITE_URL=https://cnenglish.io.vn
OPENROUTER_SITE_NAME="CN English Learning"
```

### 3. **Available Models**

**For Speech Transcription:**
- `openai/whisper-1` - High accuracy speech-to-text
- Cost: ~$0.006 per minute of audio

**For Pronunciation Assessment:**
- `anthropic/claude-3-haiku` - Fast, cost-effective (recommended)
- `openai/gpt-3.5-turbo` - Reliable alternative
- `anthropic/claude-3-sonnet` - Higher accuracy, more expensive
- `openai/gpt-4-turbo` - Best quality, highest cost

### 4. **Cost Estimation**

For a typical 30-second pronunciation assessment:
- Whisper transcription: ~$0.003
- Claude Haiku assessment: ~$0.001
- **Total per assessment: ~$0.004**

Monthly cost for 1000 assessments: ~$4 USD

### 5. **Model Configuration**

You can customize models in the API route:
```typescript
// In src/app/api/speech/assess/route.ts
const TRANSCRIPTION_MODEL = 'openai/whisper-1';
const ASSESSMENT_MODEL = 'anthropic/claude-3-haiku'; 
const FALLBACK_MODEL = 'openai/gpt-3.5-turbo';
```

### 6. **Benefits of OpenRouter**

✅ **Cost Effective**: Much cheaper than direct API access
✅ **Multiple Models**: Access to OpenAI, Anthropic, etc. through one API
✅ **No Rate Limits**: Better availability than free tiers
✅ **Easy Setup**: Single API key for multiple AI providers
✅ **Reliability**: Built-in fallback options
✅ **Transparency**: Clear pricing and usage tracking

### 7. **Troubleshooting**

**API Key Issues:**
- Make sure key starts with `sk-or-`
- Check that billing is set up on OpenRouter
- Verify the key has sufficient credits

**Model Not Available:**
- Check [OpenRouter Models](https://openrouter.ai/models) for availability
- Some models may require approval or higher usage tiers

**High Costs:**
- Monitor usage in OpenRouter dashboard
- Consider using Claude Haiku instead of GPT-4
- Implement caching for repeated assessments

### 8. **Testing**

Test the API at: `/test/ai-speech`

Example API call:
```bash
curl -X POST http://localhost:3000/api/speech/assess \
  -H "Content-Type: multipart/form-data" \
  -F "audio=@test.webm" \
  -F "originalText=Hello world" \
  -F "language=en"
```

## 🎯 Production Ready

This OpenRouter integration is production-ready with:
- Error handling and fallbacks
- Cost optimization
- Multiple model support
- Detailed logging
- Rate limiting consideration

Just add your OpenRouter API key and you're ready to go!
