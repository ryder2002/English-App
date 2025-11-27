'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ChatbotUI } from '@/components/chatbot-ui';
import { ChatHistorySidebar } from '@/components/chat-history-sidebar';
import { Button } from '@/components/ui/button';
import { Menu, MessageSquarePlus, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

const formSchema = z.object({
    query: z.string().min(1, {
        message: "Vui lòng nhập tin nhắn.",
    }),
});

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface Conversation {
    id: number;
    title: string;
    createdAt: string;
    updatedAt: string;
    lastMessage?: string;
    messageCount?: number;
}

export default function ChatbotPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            query: "",
        },
    });

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            // Always start with sidebar hidden
            setIsSidebarOpen(false);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        setIsLoaded(true);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (user) {
            fetchConversations();
        }
    }, [user]);

    const fetchConversations = async () => {
        setIsLoadingHistory(true);
        try {
            const res = await fetch('/api/chat/conversations');
            if (res.ok) {
                const data = await res.json();
                // Handle response format { conversations: [...] }
                const conversationList = data.conversations || (Array.isArray(data) ? data : []);

                if (Array.isArray(conversationList)) {
                    setConversations(conversationList);
                    if (conversationList.length > 0 && !currentConversationId) {
                        // Don't auto-load conversation, let user choose or start new
                        // loadConversation(conversationList[0].id);
                    }
                } else {
                    console.error('Conversations data is not an array:', data);
                    setConversations([]);
                }
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const loadConversation = async (id: number) => {
        setIsLoading(true);
        setCurrentConversationId(id);
        if (isMobile) setIsSidebarOpen(false);

        try {
            const res = await fetch(`/api/chat/conversations/${id}`);
            if (res.ok) {
                const data = await res.json();
                // API returns { conversation: { messages: [...] } }
                const messagesList = data.conversation?.messages || data.messages || [];

                if (Array.isArray(messagesList)) {
                    setMessages(messagesList.map((m: any) => ({
                        role: m.role === 'model' ? 'assistant' : m.role,
                        content: m.content
                    })));
                } else {
                    console.error('Messages data is not an array:', data);
                    setMessages([]);
                }
            }
        } catch (error) {
            console.error('Failed to load conversation:', error);
            toast({
                title: 'Lỗi',
                description: 'Không thể tải cuộc trò chuyện',
                variant: 'destructive',
            });
            setMessages([]);
        } finally {
            setIsLoading(false);
        }
    };

    const createNewConversation = () => {
        setCurrentConversationId(null);
        setMessages([]);
        if (isMobile) setIsSidebarOpen(false);
    };

    const renameConversation = async (id: number, newTitle: string) => {
        try {
            const res = await fetch(`/api/chat/conversations/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle }),
            });

            if (res.ok) {
                setConversations(conversations.map(c =>
                    c.id === id ? { ...c, title: newTitle } : c
                ));
            }
        } catch (error) {
            console.error('Failed to rename conversation:', error);
        }
    };

    const deleteConversation = async (id: number) => {
        if (!confirm('Bạn có chắc muốn xóa cuộc trò chuyện này?')) return;

        try {
            const res = await fetch(`/api/chat/conversations/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setConversations(conversations.filter(c => c.id !== id));
                if (currentConversationId === id) {
                    createNewConversation();
                }
            }
        } catch (error) {
            console.error('Failed to delete conversation:', error);
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        const userMessage = values.query;
        const newMessages = [...messages, { role: 'user' as const, content: userMessage }];

        setMessages(newMessages);
        setIsLoading(true);
        form.reset();

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    conversationId: currentConversationId,
                }),
            });

            if (!res.ok) throw new Error('Failed to send message');

            const data = await res.json();

            if (data.conversationId && data.conversationId !== currentConversationId) {
                setCurrentConversationId(data.conversationId);
                fetchConversations(); // Refresh list to show new conversation
            }

            setMessages([...newMessages, { role: 'assistant', content: data.response }]);
        } catch (error) {
            console.error('Chat error:', error);
            toast({
                title: 'Lỗi',
                description: 'Không thể gửi tin nhắn. Vui lòng thử lại.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] md:h-screen flex overflow-hidden bg-background">
            {/* Main Chat Area - Left Side */}
            <div className="flex-1 flex flex-col min-w-0 relative order-1">
                {/* Header */}
                <header className="h-16 border-b flex items-center justify-between px-6 bg-background/50 backdrop-blur-sm sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-sm">
                                <span className="text-xl">🤖</span>
                            </div>
                            <div>
                                <h1 className="font-semibold text-base leading-none">
                                    Trợ lý Ngôn ngữ AI
                                </h1>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Hỗ trợ học tiếng Anh và tiếng Trung
                                </p>
                            </div>
                        </div>
                    </div>

                    {!isMobile && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="hidden lg:flex text-muted-foreground hover:text-foreground"
                            title={isSidebarOpen ? "Đóng lịch sử" : "Mở lịch sử"}
                        >
                            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5 rotate-180" /> : <PanelLeftOpen className="w-5 h-5 rotate-180" />}
                        </Button>
                    )}
                </header>

                {/* Chat UI */}
                <div className="flex-1 min-h-0 relative">
                    {isLoaded && (
                        <ChatbotUI
                            messages={messages}
                            isLoading={isLoading}
                            form={form}
                            onSubmit={onSubmit}
                        />
                    )}
                </div>
            </div>

            {/* Sidebar - Right Side */}
            <div
                className={cn(
                    "fixed inset-y-0 right-0 z-40 w-80 bg-background/95 backdrop-blur-xl border-l transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 order-2",
                    isSidebarOpen ? "translate-x-0" : "translate-x-full",
                    isMobile ? "shadow-2xl" : ""
                )}
            >
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b flex items-center justify-between">
                        <h2 className="font-semibold text-lg">Lịch sử chat</h2>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={createNewConversation} title="Cuộc trò chuyện mới">
                                <MessageSquarePlus className="w-5 h-5" />
                            </Button>
                            {isMobile && (
                                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                                    <PanelLeftClose className="w-5 h-5 rotate-180" />
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <ChatHistorySidebar
                            conversations={conversations}
                            currentConversationId={currentConversationId}
                            onSelectConversation={loadConversation}
                            onCreateConversation={createNewConversation}
                            onRenameConversation={renameConversation}
                            onDeleteConversation={deleteConversation}
                            isLoading={isLoadingHistory}
                            isMobile={false}
                            isOpen={true}
                            onClose={() => { }}
                        />
                    </div>
                </div>
            </div>

            {/* Overlay for mobile sidebar */}
            {isMobile && isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
}
