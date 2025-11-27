'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ChatbotUI } from '@/components/chatbot-ui';
import { ChatHistorySidebar } from '@/components/chat-history-sidebar';
import { Button } from '@/components/ui/button';
import { Menu, MessageSquarePlus, PanelLeftClose, PanelLeftOpen, BookText, Folder, PlusSquare, GraduationCap, Layers, ClipboardCheck, Users, Search, Bot, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { useLayout } from '@/components/main-layout';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserAvatar } from '@/components/user-avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

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
    const { setIsMobileOpen } = useLayout();
    const { toast } = useToast();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
        <div className="h-screen flex overflow-hidden bg-background">
            {/* Main Chat Area - Left Side */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* Header */}
                <header className="h-16 border-b flex items-center justify-between px-4 bg-white dark:bg-background sticky top-0 z-20 shadow-sm">
                    {/* Mobile: Left - Hamburger Menu (Boxed) with Navigation Sheet */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="lg:hidden rounded-lg border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="3" y1="6" x2="21" y2="6"></line>
                                    <line x1="3" y1="12" x2="21" y2="12"></line>
                                    <line x1="3" y1="18" x2="21" y2="18"></line>
                                </svg>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[280px] p-0 bg-background">
                            <div className="p-4 space-y-2">
                                <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent">
                                    <span>📚 Danh sách từ</span>
                                </Link>
                                <Link href="/folders" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent">
                                    <span>📁 Thư mục</span>
                                </Link>
                                <Link href="/add-vocabulary" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent">
                                    <span>➕ Thêm từ mới</span>
                                </Link>
                                <Link href="/flashcards" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent">
                                    <span>🃏 Flashcards</span>
                                </Link>
                                <Link href="/tests" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent">
                                    <span>📝 Kiểm tra</span>
                                </Link>
                                <Link href="/classes" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent">
                                    <span>👥 Lớp học</span>
                                </Link>
                                <Link href="/dictionary" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent">
                                    <span>🔍 Từ điển</span>
                                </Link>
                                <Link href="/chatbot" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium">
                                    <span>🤖 Trợ lý AI</span>
                                </Link>
                                <div className="border-t pt-2 mt-2">
                                    <Link href="/settings" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent">
                                        <span>⚙️ Cài đặt</span>
                                    </Link>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Mobile: Center - Empty space for cleaner look */}
                    <div className="lg:hidden"></div>

                    {/* Desktop: Left - AI Assistant Info */}
                    <div className="hidden lg:flex items-center gap-3">
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

                    {/* Mobile: Right - Chat History Menu */}
                    <Button
                        variant="outline"
                        size="icon"
                        className="lg:hidden rounded-lg border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </Button>

                    {/* Desktop: Right - Toggle Sidebar */}
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

                {/* Section Title - Mobile Only */}
                <div className="lg:hidden bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 px-4 py-3 border-b">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-base bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Cuộc trò chuyện mới
                        </h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-3 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-200 dark:hover:bg-cyan-900 font-medium"
                            onClick={createNewConversation}
                        >
                            Xin chào?
                        </Button>
                    </div>
                </div>

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
            {/* Sidebar - Right Side */}
            <div
                className={cn(
                    "bg-background/95 backdrop-blur-xl border-l transition-all duration-300 ease-in-out",
                    // Mobile styles
                    "fixed inset-y-0 right-0 z-50 w-80 shadow-2xl lg:shadow-none",
                    isMobile ? (isSidebarOpen ? "translate-x-0" : "translate-x-full") : "",
                    // Desktop styles
                    !isMobile ? (isSidebarOpen ? "lg:w-80 lg:translate-x-0" : "lg:w-0 lg:translate-x-0 lg:border-l-0") : "",
                    !isMobile && "lg:static lg:h-full lg:overflow-hidden"
                )}
            >
                <div className="flex flex-col h-full w-80">
                    <div className="p-4 border-b flex items-center justify-between">
                        <h2 className="font-semibold text-lg">Lịch sử chat</h2>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={createNewConversation} title="Cuộc trò chuyện mới">
                                <MessageSquarePlus className="w-5 h-5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                                <PanelLeftClose className="w-5 h-5 rotate-180" />
                            </Button>
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
