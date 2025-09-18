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
    { role: 'assistant', content: 'Hello! How can I help you with your language learning today?' }
  ]);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const form = useForm<ChatFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: "",
    },
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth'});
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
        title: "Uh oh! Something went wrong.",
        description: "There was a problem communicating with the assistant.",
      });
      setMessages(prev => prev.slice(0, prev.length -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full flex-grow mx-auto w-full max-w-4xl">
        <ScrollArea className="flex-grow p-4 md:p-6" ref={scrollAreaRef}>
            <div className="space-y-6">
                {messages.map((message, index) => (
                    <div key={index} className={cn("flex items-start gap-4", message.role === 'user' ? 'justify-end' : '')}>
                        {message.role === 'assistant' && (
                             <Avatar className="h-8 w-8 border-2 border-primary/50">
                                <AvatarFallback className="bg-primary/20 text-primary">
                                    <Bot className="h-5 w-5"/>
                                </AvatarFallback>
                             </Avatar>
                        )}
                         <div className={cn("max-w-[75%] rounded-lg p-3 text-sm", message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                            {message.content}
                         </div>
                         {message.role === 'user' && (
                             <Avatar className="h-8 w-8 border-2">
                                <AvatarFallback>
                                    <User className="h-5 w-5"/>
                                </AvatarFallback>
                             </Avatar>
                        )}
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex items-start gap-4">
                        <Avatar className="h-8 w-8 border-2 border-primary/50">
                            <AvatarFallback className="bg-primary/20 text-primary">
                                <Bot className="h-5 w-5"/>
                            </AvatarFallback>
                        </Avatar>
                        <div className="max-w-[75%] rounded-lg p-3 text-sm bg-muted flex items-center">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
        <div className="p-4 md:p-6 border-t bg-background flex-shrink-0">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-4">
            <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                    <FormItem className="flex-grow">
                        <FormControl>
                        <Input
                            placeholder="Ask about translations, definitions, grammar..."
                            {...field}
                            disabled={isLoading}
                        />
                        </FormControl>
                    </FormItem>
                )}
                />
                <Button type="submit" disabled={isLoading} size="icon">
                    <Send className="h-4 w-4" />
                </Button>
            </form>
            </Form>
        </div>
    </div>
  );
}
