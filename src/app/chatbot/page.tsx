'use client';

import { ChatbotUI, type Message } from "@/components/chatbot-ui";
import { Metadata } from "next";
import { useState } from "react";

// export const metadata: Metadata = {
//     title: "Trợ lý AI - RYDER",
// };

export default function ChatbotPage() {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Xin chào! Tớ là trợ lý AI của Công Nhất, rất vui được đồng hành cùng bạn trong việc học ngôn ngữ, hãy hãy hỏi tớ bất kì cái gì nếu cậu gặp khó trong việc học nhé!' }
    ]);

    return (
        <div className="h-[calc(100vh-5rem)] md:h-screen flex flex-col">
           <div className="container mx-auto p-4 md:p-6 lg:p-8 flex-shrink-0">
             <h1 className="text-3xl font-bold font-headline tracking-tight bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-transparent bg-clip-text">
                    Trợ lý Ngôn ngữ AI
                </h1>
           </div>
            <div className="flex-grow container mx-auto px-4 md:px-6 lg:pb-8 flex min-h-0">
                <ChatbotUI messages={messages} setMessages={setMessages} />
            </div>
        </div>
    );
}
