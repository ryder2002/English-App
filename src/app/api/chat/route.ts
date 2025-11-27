import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

        const { message, conversationId } = await request.json();

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

        // Generate AI response - using stable Gemini Pro with better rate limits
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
            }
        });

        // Get history for context (optional, but good for chat)
        const rawHistory = await prisma.chatMessage.findMany({
            where: { conversationId: currentConversationId },
            orderBy: { createdAt: 'asc' },
            take: 20 // Limit history context
        });

        // Ensure history starts with a user message and alternates
        const history = [];
        let expectingUser = true;

        // Find the first user message
        let startIndex = 0;
        while (startIndex < rawHistory.length && rawHistory[startIndex].role !== 'user') {
            startIndex++;
        }

        for (let i = startIndex; i < rawHistory.length; i++) {
            const msg = rawHistory[i];
            const role = msg.role === 'user' ? 'user' : 'model';

            if (expectingUser && role === 'user') {
                history.push({ role: 'user', parts: [{ text: msg.content }] });
                expectingUser = false;
            } else if (!expectingUser && role === 'model') {
                history.push({ role: 'model', parts: [{ text: msg.content }] });
                expectingUser = true;
            }
            // Skip messages that break the alternation (e.g. two user messages in a row)
        }

        const chat = model.startChat({
            history: history
        });

        const result = await chat.sendMessage(message);
        const response = result.response.text();

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
