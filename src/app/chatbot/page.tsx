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
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
    query: z.string().min(1, {
        message: "Vui lòng nhập tin nhắn.",
    }),
});

// Navigation Items Structure
type NavItemType = {
  label: string;
  icon: any;
  href?: string;
  children?: { href: string; label: string; icon: any }[];
};

const navItems: NavItemType[] = [
  {
    label: "Từ vựng của tôi",
    icon: BookText,
    children: [
      { href: "/", label: "Danh sách từ", icon: BookText },
      { href: "/folders", label: "Thư mục", icon: Folder },
      { href: "/add-vocabulary", label: "Thêm từ mới", icon: PlusSquare },
    ],
  },
  {
    label: "Ôn tập",
    icon: GraduationCap,
    children: [
      { href: "/flashcards", label: "Flashcards", icon: Layers },
      { href: "/tests", label: "Kiểm tra", icon: ClipboardCheck },
    ],
  },
  { href: "/classes", label: "Lớp học", icon: Users },
  { href: "/dictionary", label: "Từ điển", icon: Search },
  { href: "/chatbot", label: "Trợ lý AI", icon: Bot },
];

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
    const { user, signOut } = useAuth();
    const { isMobileOpen, setIsMobileOpen } = useLayout();
    const { toast } = useToast();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const pathname = usePathname();

    // State for collapsible sections
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        "Từ vựng của tôi": true,
        "Ôn tập": true,
    });

    const toggleSection = (label: string) => {
        setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
    };

    const getInitials = (email: string | null | undefined) => {
        if (!email) return "U";
        return email.charAt(0).toUpperCase();
    };

    const NavItem = ({
        item,
        isMobile = false,
    }: {
        item: NavItemType;
        isMobile?: boolean;
    }) => {
        const hasChildren = item.children && item.children.length > 0;
        const isActive = item.href
            ? item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href)
            : false;
        const isOpen = openSections[item.label];

        if (hasChildren) {
            return (
                <Collapsible
                    open={isOpen}
                    onOpenChange={() => toggleSection(item.label)}
                    className="w-full"
                >
                    <CollapsibleTrigger asChild>
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full justify-between px-3 py-2.5 h-auto font-medium hover:bg-accent/50 rounded-xl mb-1",
                                isOpen ? "text-primary" : "text-muted-foreground",
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </div>
                            <ChevronDown
                                className={cn(
                                    "w-4 h-4 transition-transform duration-200",
                                    isOpen ? "" : "-rotate-90",
                                )}
                            />
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1 pl-4 animate-collapsible-down">
                        {item.children?.map((child) => {
                            const isChildActive =
                                child.href === "/"
                                    ? pathname === "/"
                                    : pathname.startsWith(child.href);
                            return (
                                <Link
                                    key={child.href}
                                    href={child.href}
                                    onClick={() => isMobile && setIsMobileOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 relative overflow-hidden",
                                        isChildActive
                                            ? "bg-primary/10 text-primary font-medium"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                                    )}
                                >
                                    <child.icon className="w-4 h-4" />
                                    <span>{child.label}</span>
                                    {isChildActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-r-full" />
                                    )}
                                </Link>
                            );
                        })}
                    </CollapsibleContent>
                </Collapsible>
            );
        }

        return (
            <Link
                href={item.href!}
                onClick={() => isMobile && setIsMobileOpen(false)}
                className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative overflow-hidden mb-1",
                    isActive
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
            >
                <item.icon
                    className={cn(
                        "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                        isActive && "animate-pulse-slow",
                    )}
                />
                <span className="flex-1">{item.label}</span>
                {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                )}
            </Link>
        );
    };

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
                    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
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
                        <SheetContent side="left" className="w-[300px] p-0 border-r border-border/40 bg-background/95 backdrop-blur-xl">
                            <div className="flex flex-col h-full">
                                <div className="p-6 flex items-center gap-3 border-b border-border/40">
                                    <div className="relative">
                                        <div className="w-16 h-16 flex items-center justify-center">
                                            <Image
                                                src="/Logo.png"
                                                alt="Logo"
                                                width={64}
                                                height={64}
                                                className="object-contain"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                                    {navItems.map((item, index) => (
                                        <NavItem key={index} item={item} isMobile />
                                    ))}

                                    <div className="my-2 border-t border-border/40" />

                                    <Link
                                        href="/settings"
                                        onClick={() => setIsMobileOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-accent/50",
                                            pathname === "/settings" &&
                                            "bg-accent/50 text-foreground font-medium",
                                        )}
                                    >
                                        <Settings className="w-5 h-5" />
                                        <span>Cài đặt</span>
                                    </Link>
                                </div>

                                <div className="p-6 border-t border-border/40 bg-muted/30">
                                    <div className="flex items-center gap-3 mb-4">
                                        {user?.id ? (
                                            <UserAvatar
                                                userId={user.id}
                                                userName={user.name || undefined}
                                                userEmail={user.email}
                                                size="md"
                                                showName={false}
                                            />
                                        ) : (
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback className="bg-primary text-primary-foreground">
                                                    {getInitials(user?.email)}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {user?.name || user?.email || "Người dùng"}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {user?.email || ""}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                                        onClick={signOut}
                                    >
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Đăng xuất
                                    </Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Mobile: Center - Logo */}
                    <div className="flex items-center gap-2">
                        <Image
                            src="/Logo.png"
                            alt="Logo"
                            width={32}
                            height={32}
                            className="object-contain"
                        />
                    </div>

                    {/* Desktop: Left - AI Assistant Info */}
                    <div className="hidden lg:flex items-center gap-3">
                        <div>
                            <h1 className="font-semibold text-base leading-none flex items-center gap-2">
                                <span className="text-xl">🤖</span>
                                Trợ lý AI
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
                {/* Removed Xin chào button */}

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
