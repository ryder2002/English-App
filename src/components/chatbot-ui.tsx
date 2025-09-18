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
import { Bot, Loader2, Send, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const formSchema = z.object({
  query: z.string().min(1),
});

type ChatFormValues = z.infer<typeof formSchema>;

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function ChatbotUI() {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Xin chào! Tôi có thể giúp gì cho việc học ngôn ngữ của bạn hôm nay?' }
  ]);
  const { toast } = useToast();
  const scrollViewportRef = useRef<HTMLDivElement>(null);

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
  }, [messages])

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

  return (
    <div className="flex flex-col h-full flex-grow mx-auto w-full max-w-4xl bg-card rounded-t-xl shadow-lg">
        <ScrollArea className="flex-grow p-4 md:p-6" viewportRef={scrollViewportRef}>
            <div className="space-y-6">
                {messages.map((message, index) => (
                    <div key={index} className={cn("flex items-start gap-4", message.role === 'user' ? 'justify-end' : '')}>
                        {message.role === 'assistant' && (
                             <Avatar className="h-9 w-9 border-2 border-primary/50">
                                <AvatarFallback className="bg-primary/20 text-primary">
                                    <Bot className="h-5 w-5"/>
                                </AvatarFallback>
                             </Avatar>
                        )}
                         <div className={cn("max-w-[80%] rounded-xl p-3 px-4 text-sm shadow-[0_4px_12px_rgba(0,0,0,0.05)]", message.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-background rounded-bl-none')}>
                            {message.content}
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
                        <Avatar className="h-9 w-9 border-2 border-primary/50">
                            <AvatarFallback className="bg-primary/20 text-primary">
                                <Bot className="h-5 w-5"/>
                            </AvatarFallback>
                        </Avatar>
                        <div className={cn("rounded-xl p-3 px-4 text-sm shadow-[0_4px_12px_rgba(0,0,0,0.05)]", 'bg-background rounded-bl-none flex items-center')}>
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
        <div className="p-4 md:p-6 border-t bg-background/80 backdrop-blur-sm flex-shrink-0 rounded-b-xl">
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
                            className="h-11 text-base rounded-full px-5"
                        />
                        </FormControl>
                    </FormItem>
                )}
                />
                <Button type="submit" disabled={isLoading} size="icon" className="rounded-full w-11 h-11 shrink-0 bg-accent hover:bg-accent/90">
                    <Send className="h-5 w-5" />
                </Button>
            </form>
            </Form>
        </div>
    </div>
  );
}
