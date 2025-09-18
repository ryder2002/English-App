import { ChatbotUI } from "@/components/chatbot-ui";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Trợ lý AI - RYDER",
};

export default function ChatbotPage() {
    return (
        <div className="h-[calc(100vh-5rem)] md:h-screen flex flex-col">
           <div className="container mx-auto p-4 md:p-6 lg:p-8 flex-shrink-0">
             <h1 className="text-3xl font-bold font-headline tracking-tight bg-gradient-to-r from-primary to-cyan-400 text-transparent bg-clip-text">
                    Trợ lý Ngôn ngữ AI
                </h1>
           </div>
            <ChatbotUI />
        </div>
    );
}
