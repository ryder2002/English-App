'use client';

import { ChatbotUI, type Message } from "@/components/chatbot-ui";
import { useEffect, useState } from "react";

const CHAT_SESSION_STORAGE_KEY = 'ryder-chat-session';

export default function ChatbotPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

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
        if (messages.length > 0 && isLoaded) {
             try {
                sessionStorage.setItem(CHAT_SESSION_STORAGE_KEY, JSON.stringify(messages));
            } catch (error) {
                console.error("Failed to save chat to session storage", error);
            }
        }
    }, [messages, isLoaded]);

    return (
        <div className="h-[calc(100vh-5rem)] md:h-screen flex flex-col">
           <div className="container mx-auto p-4 md:p-6 lg:p-8 flex-shrink-0">
             <h1 className="text-3xl font-bold font-headline tracking-tight bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-transparent bg-clip-text">
                    Trợ lý Ngôn ngữ AI
                </h1>
           </div>
            <div className="flex-grow container mx-auto px-4 md:px-6 lg:pb-8 flex min-h-0">
                {isLoaded && <ChatbotUI messages={messages} setMessages={setMessages} />}
            </div>
        </div>
    );
}
