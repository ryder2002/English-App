"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getChatbotResponseAction } from "@/app/actions";
import { Bot, Loader2, Send, User, Volume2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

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
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export function ChatbotUI({ messages, setMessages }: ChatbotUIProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [audioState, setAudioState] = useState<{ id: string | null; status: 'playing' | 'loading' | 'idle' }>({ id: null, status: 'idle' });
  const { toast } = useToast();
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const form = useForm<ChatFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: "",
    },
  });

  useEffect(() => {
    if (scrollViewportRef.current) {
        scrollViewportRef.current.scrollTo({ top: scrollViewportRef.current.scrollHeight, behavior: 'smooth'});
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
    };
  }, []);

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
      setMessages(prev => prev.slice(0, prev.length -1));
    } finally {
      setIsLoading(false);
    }
  };
  
  const playAudio = (e: React.MouseEvent, text: string, lang: string, id: string) => {
    e.stopPropagation();
    if (!('speechSynthesis' in window)) {
        toast({ variant: "destructive", title: "Lỗi", description: "Trình duyệt của bạn không hỗ trợ phát âm thanh." });
        return;
    }

    if (audioState.status === 'playing' && audioState.id === id) {
        speechSynthesis.cancel();
        setAudioState({ id: null, status: 'idle' });
        return;
    }
    
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    const langMap = { english: 'en-US', chinese: 'zh-CN', vietnamese: 'vi-VN' };
    utterance.lang = langMap[lang as keyof typeof langMap] || 'en-US';

    utterance.onstart = () => setAudioState({ id, status: 'playing' });
    utterance.onend = () => {
        setAudioState({ id: null, status: 'idle' });
        utteranceRef.current = null;
    };
    utterance.onerror = () => {
        setAudioState({ id: null, status: 'idle' });
        toast({ variant: "destructive", title: "Lỗi phát âm", description: "Không thể phát âm thanh." });
    };
    
    setAudioState({ id, status: 'loading' });
    speechSynthesis.speak(utterance);
  };


  const formatMessage = (content: string, index: number) => {
    const parts = content.split(/(<speak word='[^']*' lang='[^']*'>[^<]*<\/speak>)/g);

    return parts.map((part, i) => {
        const match = part.match(/<speak word='([^']*)' lang='([^']*)'>([^<]*)<\/speak>/);
        if (match) {
            const [_, word, lang, innerText] = match;
            const audioId = `msg-${index}-part-${i}`;
            return (
                <span key={i} className="inline-flex items-center gap-1">
                    <span className="font-semibold text-primary">{innerText || word}</span>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-muted-foreground"
                        onClick={(e) => playAudio(e, word, lang, audioId)}
                        disabled={audioState.status === 'loading'}
                    >
                         {(audioState.id === audioId && (audioState.status === 'loading' || audioState.status === 'playing')) ? <Loader2 className="h-4 w-4 animate-spin"/> : <Volume2 className="h-4 w-4"/>}
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
    <div className="flex flex-col h-full flex-grow mx-auto w-full bg-card/50 dark:bg-card/80 rounded-t-xl shadow-lg border">
        <ScrollArea className="flex-grow p-4 md:p-6" viewportRef={scrollViewportRef}>
            <div className="space-y-6">
                {messages.map((message, index) => (
                    <div key={index} className={cn("flex items-start gap-4", message.role === 'user' ? 'justify-end' : '')}>
                        {message.role === 'assistant' && (
                             <Avatar className="h-9 w-9 border-2 border-primary/50 bg-gradient-to-br from-cyan-400 to-teal-600">
                                <AvatarFallback className="bg-transparent text-primary-foreground">
                                    <Bot className="h-5 w-5"/>
                                </AvatarFallback>
                             </Avatar>
                        )}
                         <div className={cn("max-w-[80%] rounded-xl p-3 px-4 text-sm shadow-md", message.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-secondary text-secondary-foreground rounded-bl-none')}>
                            <div className="prose prose-sm dark:prose-invert prose-strong:text-foreground">{formatMessage(message.content, index)}</div>
                         </div>
                         {message.role === 'user' && (
                             <Avatar className="h-9 w-9 border-2">
                                <AvatarFallback>
                                    <User className="h-5 w-5"/>
                                </AvatarFallback>
                             </Avatar>
                        )}
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex items-start gap-4">
                        <Avatar className="h-9 w-9 border-2 border-primary/50 bg-gradient-to-br from-cyan-400 to-teal-600">
                            <AvatarFallback className="bg-transparent text-primary-foreground">
                                <Bot className="h-5 w-5"/>
                            </AvatarFallback>
                        </Avatar>
                        <div className={cn("rounded-xl p-3 px-4 text-sm shadow-md", 'bg-secondary rounded-bl-none flex items-center')}>
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
        <div className="p-4 md:p-6 border-t bg-card/30 backdrop-blur-sm flex-shrink-0 rounded-b-xl">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-4">
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
                            className="h-11 text-base rounded-full px-5 bg-background/70 dark:bg-card/70"
                        />
                        </FormControl>
                    </FormItem>
                )}
                />
                <Button type="submit" disabled={isLoading} size="icon" className="rounded-full w-11 h-11 shrink-0 bg-primary hover:bg-primary/90">
                    <Send className="h-5 w-5" />
                </Button>
            </form>
            </Form>
        </div>
    </div>
  );
}
