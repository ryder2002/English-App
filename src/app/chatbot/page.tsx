import { ChatbotUI } from "@/components/chatbot-ui";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "AI Chatbot - LinguaLeap",
};

export default function ChatbotPage() {
    return (
        <div className="h-[calc(100vh-5rem)] md:h-screen flex flex-col">
           <div className="container mx-auto p-4 md:p-6 lg:p-8 flex-shrink-0">
             <h1 className="text-3xl font-bold font-headline tracking-tight">
                    AI Language Assistant
                </h1>
           </div>
            <ChatbotUI />
        </div>
    );
}
