import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { interactWithLanguageChatbot } from '@/ai/flows/interact-with-language-chatbot';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization') || '';
        const token = authHeader.replace(/^Bearer\s+/, '') || request.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await AuthService.verifyToken(token);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { message, conversationId, useRag } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        let currentConversationId = conversationId;
        let conversation;

        // Create or get conversation
        if (!currentConversationId) {
            conversation = await prisma.chatConversation.create({
                data: {
                    userId: user.id,
                    title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
                }
            });
            currentConversationId = conversation.id;
        } else {
            // Verify ownership
            conversation = await prisma.chatConversation.findUnique({
                where: { id: currentConversationId }
            });

            if (!conversation || conversation.userId !== user.id) {
                return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
            }
        }

        // Save user message
        await prisma.chatMessage.create({
            data: {
                conversationId: currentConversationId,
                role: 'user',
                content: message
            }
        });

        // Get history for context (board + chat messages) and convert to the small Message schema the flow expects.
        const rawHistory = await prisma.chatMessage.findMany({
            where: { conversationId: currentConversationId },
            orderBy: { createdAt: 'asc' },
            take: 20 // Limit history context
        });

        const history = rawHistory.map(h => {
            const role = (h.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant';
            return { role, content: h.content };
        });

        // Use the Genkit/Flows chat flow to ensure RAG + website restrictions are applied.
        let response = '';
        try {
            const result = await interactWithLanguageChatbot({ query: message, history, useRag: useRag ?? true });
            response = result.response;
        } catch (err) {
            console.error('Interact flow failed, falling back to direct Gemini:', err);
            // Fallback: use Gemini raw model directly
            const model = genAI.getGenerativeModel({
                model: 'gemini-2.0-flash',
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                }
            });

            const chat = model.startChat({ history: rawHistory.map(msg => ({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.content }] })) });
            const r = await chat.sendMessage(message);
            response = r.response.text();
        }

        // Save assistant message
        await prisma.chatMessage.create({
            data: {
                conversationId: currentConversationId,
                role: 'assistant', // or 'model' depending on your schema enum
                content: response
            }
        });

        // Update conversation timestamp
        await prisma.chatConversation.update({
            where: { id: currentConversationId },
            data: { updatedAt: new Date() }
        });

        return NextResponse.json({
            response,
            conversationId: currentConversationId
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
