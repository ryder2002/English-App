"use client";

import type { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bot, Loader2, Send, User, Volume2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "./ui/avatar";
import type { Language } from "@/lib/types";
import { useSettings } from "@/contexts/settings-context";

const formSchema = z.object({
  query: z.string().min(1),
});

type ChatFormValues = z.infer<typeof formSchema>;

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatbotUIProps {
  messages: Message[];
  isLoading: boolean;
  form: UseFormReturn<ChatFormValues>;
  onSubmit: (values: ChatFormValues) => Promise<void>;
}

export function ChatbotUI({ messages, isLoading, form, onSubmit }: ChatbotUIProps) {
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const { selectedVoices } = useSettings();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (scrollViewportRef.current) {
        scrollViewportRef.current.scrollTo({ top: scrollViewportRef.current.scrollHeight, behavior: 'smooth'});
    }
  }, [messages]);

  useEffect(() => {
    // Stop speech synthesis on component unmount
    return () => {
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      window.speechSynthesis.cancel();
    };
  }, []);
  
  const playAudio = (e: React.MouseEvent, text: string, lang: Language, id: string) => {
    e.stopPropagation();
    
    if (speakingId === id) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
        return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    
    const langCodeMap: Record<Language, string> = {
        english: 'en-US',
        chinese: 'zh-CN',
        vietnamese: 'vi-VN',
    };
    utterance.lang = langCodeMap[lang];

    const voiceURI = selectedVoices[lang];
    if (voiceURI) {
        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find(v => v.voiceURI === voiceURI);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
    }

    utterance.onstart = () => {
        setSpeakingId(id);
    };

    utterance.onend = () => {
        setSpeakingId(null);
        utteranceRef.current = null;
    };

    utterance.onerror = (event) => {
        console.error("SpeechSynthesis Error", event);
        setSpeakingId(null);
        utteranceRef.current = null;
    };
    
    const speak = () => {
      if (window.speechSynthesis.speaking) {
        setTimeout(speak, 100);
      } else {
        window.speechSynthesis.speak(utterance);
      }
    };
    speak();
  };


  const formatMessage = (content: string, index: number) => {
    const parts = content.split(/(<speak word='[^']*' lang='[^']*'>[^<]*<\/speak>)/g);

    return parts.map((part, i) => {
        if (!part) return null;
        const match = part.match(/<speak word='([^']*)' lang='([^']*)'>([^<]*)<\/speak>/);
        if (match) {
            const [_, word, lang, innerText] = match;
            const audioId = `msg-${index}-part-${i}`;
            return (
                <span key={i} className="inline-flex items-center gap-0.5 sm:gap-1">
                    <span className="font-semibold text-primary text-xs sm:text-sm">{innerText || word}</span>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground"
                        onClick={(e) => playAudio(e, word, lang as Language, audioId)}
                    >
                         {speakingId === audioId ? <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 animate-spin"/> : <Volume2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4"/>}
                    </Button>
                </span>
            );
        }
        
        // Basic markdown formatting
        const bolded = part.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        const html = bolded.replace(/\n/g, '<br />');

        return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
    });
  };

  return (
    <div className="flex flex-col h-full flex-grow mx-auto w-full bg-card/50 dark:bg-card/80 rounded-t-lg sm:rounded-t-xl shadow-lg border">
        <ScrollArea className="flex-grow p-3 sm:p-4 md:p-6" viewportRef={scrollViewportRef}>
            <div className="space-y-4 sm:space-y-6">
                {messages.map((message, index) => (
                    <div key={index} className={cn("flex items-start gap-2 sm:gap-3 md:gap-4", message.role === 'user' ? 'justify-end' : '')}>
                        {message.role === 'assistant' && (
                             <Avatar className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 border-2 border-primary/50 bg-gradient-to-br from-cyan-400 to-teal-600 flex-shrink-0">
                                <AvatarFallback className="bg-transparent text-primary-foreground">
                                    <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5"/>
                                </AvatarFallback>
                             </Avatar>
                        )}
                         <div className={cn("max-w-[85%] sm:max-w-[80%] rounded-lg sm:rounded-xl p-2.5 sm:p-3 px-3 sm:px-4 text-xs sm:text-sm shadow-md", message.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-secondary text-secondary-foreground rounded-bl-none')}>
                            <div className="prose prose-xs sm:prose-sm dark:prose-invert prose-strong:text-foreground break-words">{formatMessage(message.content, index)}</div>
                         </div>
                         {message.role === 'user' && (
                             <Avatar className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 border-2 flex-shrink-0">
                                <AvatarFallback>
                                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5"/>
                                </AvatarFallback>
                             </Avatar>
                        )}
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
                        <Avatar className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 border-2 border-primary/50 bg-gradient-to-br from-cyan-400 to-teal-600 flex-shrink-0">
                            <AvatarFallback className="bg-transparent text-primary-foreground">
                                <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5"/>
                            </AvatarFallback>
                        </Avatar>
                        <div className={cn("rounded-lg sm:rounded-xl p-2.5 sm:p-3 px-3 sm:px-4 text-xs sm:text-sm shadow-md", 'bg-secondary rounded-bl-none flex items-center')}>
                            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-muted-foreground" />
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
        <div className="p-3 sm:p-4 md:p-6 border-t bg-card/30 backdrop-blur-sm flex-shrink-0 rounded-b-lg sm:rounded-b-xl">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                    <FormItem className="flex-grow">
                        <FormControl>
                        <Input
                            placeholder="Hỏi về bản dịch, định nghĩa, ngữ pháp..."
                            {...field}
                            disabled={isLoading}
                            className="h-9 sm:h-10 md:h-11 text-sm sm:text-base rounded-full px-3 sm:px-4 md:px-5 bg-background/70 dark:bg-card/70"
                        />
                        </FormControl>
                    </FormItem>
                )}
                />
                <Button type="submit" disabled={isLoading} size="icon" className="rounded-full w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 shrink-0 bg-primary hover:bg-primary/90">
                    <Send className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5" />
                </Button>
            </form>
            </Form>
        </div>
    </div>
  );
}
