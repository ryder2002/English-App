'use client';

import { AppShell } from "@/components/app-shell";
import { ChatbotUI, type Message } from "@/components/chatbot-ui";
import { ChatHistorySidebar } from "@/components/chat-history-sidebar";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { getChatbotResponseAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Menu, History } from "lucide-react";

const formSchema = z.object({
  query: z.string().min(1),
});

type ChatFormValues = z.infer<typeof formSchema>;

interface Conversation {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  messageCount?: number;
}



export default function ChatbotPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open on desktop
    const [isMobile, setIsMobile] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const { toast } = useToast();

    const form = useForm<ChatFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            query: "",
        },
    });

    // Detect mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Fetch conversations on mount
    useEffect(() => {
        fetchConversations();
    }, []);

    // Load initial conversation or create one
    useEffect(() => {
        if (isLoaded && conversations.length > 0 && !currentConversationId) {
            // Load the most recent conversation
            loadConversation(conversations[0].id);
        } else if (isLoaded && conversations.length === 0 && !currentConversationId) {
            // Show default welcome message without creating conversation
            const defaultWelcome = 'Chào bạn✌️! Tớ là AI Language Assistant, được phát triển bởi Công Nhất.\n Tớ có thể giúp đỡ cậu trong việc học ngoại ngữ, Tiếng Anh và Tiếng Trung, có gì khó khăn trong việc học đừng ngần ngại hãy hỏi tớ nhé, tớ sẽ giúp cậu giải quyết mọi vấn đề "cách phát âm, ngữ pháp, từ vựng..."!';
            setMessages([{ role: 'assistant', content: defaultWelcome }]);
        }
    }, [isLoaded, conversations]);

    const fetchConversations = async () => {
        try {
            setIsLoadingHistory(true);
            const response = await fetch('/api/chat/conversations', {
                credentials: 'include', // Important: Send cookies!
            });

            if (response.ok) {
                const data = await response.json();
                setConversations(data.conversations);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setIsLoadingHistory(false);
            setIsLoaded(true);
        }
    };

    const loadConversation = async (id: number) => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/chat/conversations/${id}`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                const loadedMessages: Message[] = data.conversation.messages.map((msg: any) => ({
                    role: msg.role as 'user' | 'assistant',
                    content: msg.content
                }));
                
                setMessages(loadedMessages);
                setCurrentConversationId(id);
                if (isMobile) setIsSidebarOpen(false);
            }
        } catch (error) {
            console.error('Error loading conversation:', error);
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Không thể tải cuộc trò chuyện",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const createNewConversation = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/chat/conversations', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: 'Cuộc trò chuyện mới' })
            });

            if (response.ok) {
                const data = await response.json();
                const newConv = data.conversation;
                
                // Add welcome message to new conversation
                const welcomeMessage = 'Chào bạn✌️! Tớ là AI Language Assistant, được phát triển bởi Công Nhất.\n Tớ có thể giúp đỡ cậu trong việc học ngoại ngữ, Tiếng Anh và Tiếng Trung, có gì khó khăn trong việc học đừng ngần ngại hãy hỏi tớ nhé, tớ sẽ giúp cậu giải quyết mọi vấn đề "cách phát âm, ngữ pháp, từ vựng..."!';
                
                await fetch(`/api/chat/conversations/${newConv.id}/messages`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        role: 'assistant',
                        content: welcomeMessage
                    })
                });

                setMessages([{ role: 'assistant', content: welcomeMessage }]);
                setCurrentConversationId(newConv.id);
                await fetchConversations();
                if (isMobile) setIsSidebarOpen(false);
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Không thể tạo cuộc trò chuyện mới",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const renameConversation = async (id: number, newTitle: string) => {
        try {
            const response = await fetch(`/api/chat/conversations/${id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: newTitle })
            });

            if (response.ok) {
                await fetchConversations();
                toast({
                    title: "Thành công",
                    description: "Đã đổi tên cuộc trò chuyện",
                });
            }
        } catch (error) {
            console.error('Error renaming conversation:', error);
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Không thể đổi tên",
            });
        }
    };

    const deleteConversation = async (id: number) => {
        try {
            const response = await fetch(`/api/chat/conversations/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                if (currentConversationId === id) {
                    setMessages([]);
                    setCurrentConversationId(null);
                }
                await fetchConversations();
                toast({
                    title: "Đã xóa",
                    description: "Cuộc trò chuyện đã được xóa",
                });
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Không thể xóa cuộc trò chuyện",
            });
        }
    };

    const saveMessage = async (role: 'user' | 'assistant', content: string) => {
        if (!currentConversationId) return;

        try {
            await fetch(`/api/chat/conversations/${currentConversationId}/messages`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ role, content })
            });

            // Update conversation list to reflect new message
            await fetchConversations();
        } catch (error) {
            console.error('Error saving message:', error);
        }
    };

    const onSubmit = async (values: ChatFormValues) => {
        // If no conversation exists, create one first with user's message as title
        if (!currentConversationId) {
            setIsLoading(true);
            try {
                // Use first 60 characters of user's message as title
                const conversationTitle = values.query.length > 60 
                    ? values.query.substring(0, 60) + '...'
                    : values.query;

                const response = await fetch('/api/chat/conversations', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ title: conversationTitle })
                });

                if (response.ok) {
                    const data = await response.json();
                    setCurrentConversationId(data.conversation.id);
                    await fetchConversations();
                } else {
                    toast({
                        variant: "destructive",
                        title: "Lỗi",
                        description: "Không thể tạo cuộc trò chuyện",
                    });
                    setIsLoading(false);
                    return;
                }
            } catch (error) {
                console.error('Error creating conversation:', error);
                toast({
                    variant: "destructive",
                    title: "Lỗi",
                    description: "Không thể tạo cuộc trò chuyện",
                });
                setIsLoading(false);
                return;
            }
        }

        setIsLoading(true);
        const userMessage: Message = { role: 'user', content: values.query };
        const currentHistory = [...messages];
        
        setMessages(prev => [...prev, userMessage]);
        form.reset();

        // Save user message to database
        await saveMessage('user', values.query);

        try {
            const response = await getChatbotResponseAction(values.query, currentHistory);
            const assistantMessage: Message = { role: 'assistant', content: response };
            setMessages(prev => [...prev, assistantMessage]);
            
            // Save assistant message to database
            await saveMessage('assistant', response);
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Ôi! Đã có lỗi xảy ra.",
                description: "Có lỗi khi giao tiếp với trợ lý.",
            });
            // Rollback the user message if API call fails
            setMessages(prev => prev.filter(m => m !== userMessage));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AppShell>
          <div className="h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] md:h-screen flex bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 overflow-hidden">
            {/* Main Content - Now FIRST */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Mobile Header with Menu */}
              {isMobile && (
                <div className="flex-shrink-0 p-3 bg-white/80 border-b-2 border-blue-200 flex items-center gap-3">
                  <div className="flex-1">
                    <h2 className="font-semibold text-blue-900 line-clamp-1">
                      {conversations.find(c => c.id === currentConversationId)?.title || 'Chatbot'}
                    </h2>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsSidebarOpen(true)}
                    className="border-2 border-blue-400 hover:bg-blue-100"
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                </div>
              )}

              {/* Header */}
              <div className="flex-shrink-0 container mx-auto px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 lg:px-8 lg:py-4">
                <div className="rounded-xl sm:rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft p-2 sm:p-3 border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center justify-center gap-3 sm:gap-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md shadow-glow animate-pulse-slow flex-shrink-0">
                      <span className="text-xl sm:text-2xl">🤖</span>
                    </div>
                    <div className="text-center sm:text-left">
                      <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
                        Trợ lý Ngôn ngữ AI
                      </h1>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                        Hỗ trợ học tiếng Anh và tiếng Trung
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Area + Sidebar Container */}
              <div className="flex-grow flex container mx-auto px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6 min-h-0 gap-4">
                {/* Chat Area */}
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Toggle History Button - Desktop only */}
                  {!isMobile && (
                    <div className="flex justify-end mb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="border-2 border-blue-400 hover:bg-blue-100 gap-2"
                      >
                        <History className="w-4 h-4" />
                        Lịch sử chat
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex-1 min-h-0">
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

                {/* Sidebar - Desktop only, same height as chat */}
                {!isMobile && isSidebarOpen && (
                  <div className="w-80 flex-shrink-0">
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
                      onClose={() => {}}
                    />
                  </div>
                )}

                {/* Mobile Sidebar - Full screen overlay */}
                {isMobile && (
                  <ChatHistorySidebar
                    conversations={conversations}
                    currentConversationId={currentConversationId}
                    onSelectConversation={loadConversation}
                    onCreateConversation={createNewConversation}
                    onRenameConversation={renameConversation}
                    onDeleteConversation={deleteConversation}
                    isLoading={isLoadingHistory}
                    isMobile={true}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                  />
                )}
              </div>
            </div>
          </div>
        </AppShell>
    );
}
