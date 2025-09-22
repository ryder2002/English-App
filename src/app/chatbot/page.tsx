'use client';

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
                    { role: 'assistant', content: 'Xin chào! Tớ là trợ lý AI của Công Nhất, rất vui được đồng hành cùng bạn trong việc học ngôn ngữ, hãy hãy hỏi tớ bất kì cái gì nếu cậu gặp khó trong việc học nhé!' }
                ]);
            }
        } catch (error) {
            console.error("Failed to load chat from session storage", error);
            // Start with a default message if loading fails
            setMessages([
                { role: 'assistant', content: 'Xin chào! Tớ là trợ lý AI của Công Nhất, rất vui được đồng hành cùng bạn trong việc học ngôn ngữ, hãy hãy hỏi tớ bất kì cái gì nếu cậu gặp khó trong việc học nhé!' }
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
        setMessages(prev => [...prev, userMessage]);
        form.reset();

        try {
            const response = await getChatbotResponseAction(values.query);
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
        <div className="h-[calc(100vh-5rem)] md:h-screen flex flex-col">
           <div className="container mx-auto p-4 md:p-6 lg:p-8 flex-shrink-0">
             <h1 className="text-3xl font-bold font-headline tracking-tight bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-transparent bg-clip-text">
                    Trợ lý Ngôn ngữ AI
                </h1>
           </div>
            <div className="flex-grow container mx-auto px-4 md:px-6 lg:pb-8 flex min-h-0">
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
    );
}
