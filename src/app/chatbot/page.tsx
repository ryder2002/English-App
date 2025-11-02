'use client';

import { AppShell } from "@/components/app-shell";
import { ChatbotUI, type Message } from "@/components/chatbot-ui";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { getChatbotResponseAction } from "@/app/actions";

const CHAT_SESSION_STORAGE_KEY = 'cn-chat-session';

const formSchema = z.object({
  query: z.string().min(1),
});

type ChatFormValues = z.infer<typeof formSchema>;


export default function ChatbotPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<ChatFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            query: "",
        },
    });

    // Load messages from sessionStorage on initial render
    useEffect(() => {
        try {
            const savedMessages = sessionStorage.getItem(CHAT_SESSION_STORAGE_KEY);
            if (savedMessages) {
                setMessages(JSON.parse(savedMessages));
            } else {
                 setMessages([
                    { role: 'assistant', content: 'Chào bạn✌️! Tớ là AI Language Assistant, được phát triển bởi Công Nhất.\n Tớ có thể giúp đỡ cậu trong việc học ngoại ngữ, Tiếng Anh và Tiếng Trung, có gì khó khăn trong việc học đừng ngần ngại hãy hỏi tớ nhé, tớ sẽ giúp cậu giải quyết mọi vấn đề "cách phát âm, ngữ pháp, từ vựng..."!' }
                ]);
            }
        } catch (error) {
            console.error("Failed to load chat from session storage", error);
            // Start with a default message if loading fails
            setMessages([
                { role: 'assistant', content: 'Chào bạn✌️! Tớ là AI Language Assistant, được phát triển bởi Công Nhất.\n Tớ có thể giúp đỡ cậu trong việc học ngoại ngữ, Tiếng Anh và Tiếng Trung, có gì khó khăn trong việc học đừng ngần ngại hãy hỏi tớ nhé, tớ sẽ giúp cậu giải quyết mọi vấn đề "cách phát âm, ngữ pháp, từ vựng..."!' }
            ]);
        }
        setIsLoaded(true);
    }, []);

    // Save messages to sessionStorage whenever they change
    useEffect(() => {
        if (isLoaded) { // Only save after initial load is complete
             try {
                sessionStorage.setItem(CHAT_SESSION_STORAGE_KEY, JSON.stringify(messages));
            } catch (error) {
                console.error("Failed to save chat to session storage", error);
            }
        }
    }, [messages, isLoaded]);

    const onSubmit = async (values: ChatFormValues) => {
        setIsLoading(true);
        const userMessage: Message = { role: 'user', content: values.query };
        const currentHistory = [...messages];
        
        setMessages(prev => [...prev, userMessage]);
        form.reset();

        try {
            const response = await getChatbotResponseAction(values.query, currentHistory);
            const assistantMessage: Message = { role: 'assistant', content: response };
            setMessages(prev => [...prev, assistantMessage]);
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
          <div className="h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] md:h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 overflow-hidden">
             <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4 md:p-6 lg:p-8 flex-shrink-0">
               <div className="mb-2 sm:mb-4 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft p-3 sm:p-4 border border-gray-200/50 dark:border-gray-700/50">
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
              <div className="flex-grow container mx-auto px-3 sm:px-4 md:px-6 lg:pb-8 flex min-h-0">
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
        </AppShell>
    );
}
