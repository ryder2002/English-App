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
import { Bot, Loader2, Send, User, Volume2, Mic } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "./ui/avatar";
import type { Language } from "@/lib/types";
import { useSettings } from "@/contexts/settings-context";
import { ImprovedSpeechRecognition } from "./improved-speech-recognition";

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
  const [showSpeechInput, setShowSpeechInput] = useState(false);
  const { selectedVoices } = useSettings();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTo({ top: scrollViewportRef.current.scrollHeight, behavior: 'smooth' });
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
              {speakingId === audioId ? <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 animate-spin" /> : <Volume2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />}
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
    <div className="flex flex-col h-full flex-grow mx-auto w-full max-w-full bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-950/30 rounded-t-lg sm:rounded-t-xl overflow-hidden" style={{ touchAction: 'pan-y' }} data-chatbot>
      <ScrollArea className="flex-grow p-3 sm:p-4 md:p-6 overflow-y-auto" viewportRef={scrollViewportRef} data-scroll-area>
        <div className="space-y-4 sm:space-y-6">
          {messages.length === 0 && (
            <div className="flex items-start gap-2 sm:gap-3 md:gap-4 animate-in fade-in duration-500">
              <Avatar className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 border-2 border-purple-300/50 bg-gradient-to-br from-purple-500 to-pink-600 flex-shrink-0 shadow-lg">
                <AvatarFallback className="bg-transparent text-white">
                  <Bot className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl sm:rounded-2xl p-3 sm:p-4 px-4 sm:px-5 text-xs sm:text-sm shadow-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 text-foreground rounded-tl-none border border-purple-200/50 dark:border-purple-700/50">
                <div className="prose prose-xs sm:prose-sm dark:prose-invert prose-strong:text-foreground break-words">
                  <p>Chào bạn✌️! Tớ là AI Language Assistant, được phát triển bởi Công Nhật.</p>
                  <p>Tớ có thể giúp đỡ cậu trong việc học ngoại ngữ, Tiếng Anh và Tiếng Trung, có gì khó khăn trong việc học đừng ngần ngại hãy hỏi tớ nhé, tớ sẽ giúp cậu giải quyết mọi vấn đề "cách phát âm, ngữ pháp, từ vựng..."!</p>
                </div>
              </div>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className={cn("flex items-start gap-2 sm:gap-3 md:gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300", message.role === 'user' ? 'justify-end' : '')}>
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 border-2 border-purple-300/50 bg-gradient-to-br from-purple-500 to-pink-600 flex-shrink-0 shadow-lg">
                  <AvatarFallback className="bg-transparent text-white">
                    <Bot className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={cn("max-w-[85%] sm:max-w-[80%] rounded-2xl sm:rounded-2xl p-3 sm:p-4 px-4 sm:px-5 text-xs sm:text-sm shadow-lg", message.role === 'user' ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-tr-none border border-blue-400/50' : 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 text-foreground rounded-tl-none border border-purple-200/50 dark:border-purple-700/50')}>
                <div className="prose prose-xs sm:prose-sm dark:prose-invert prose-strong:text-foreground break-words">{formatMessage(message.content, index)}</div>
              </div>
              {message.role === 'user' && (
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 border-2 border-blue-300/50 bg-gradient-to-br from-blue-500 to-cyan-500 flex-shrink-0 shadow-lg">
                  <AvatarFallback className="bg-transparent text-white">
                    <User className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-2 sm:gap-3 md:gap-4 animate-in fade-in duration-300">
              <Avatar className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 border-2 border-purple-300/50 bg-gradient-to-br from-purple-500 to-pink-600 flex-shrink-0 shadow-lg">
                <AvatarFallback className="bg-transparent text-white">
                  <Bot className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5" />
                </AvatarFallback>
              </Avatar>
              <div className={cn("rounded-2xl sm:rounded-2xl p-3 sm:p-4 px-4 sm:px-5 text-xs sm:text-sm shadow-lg", 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-tl-none flex items-center gap-2 border border-purple-200/50 dark:border-purple-700/50')}>
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-purple-600 dark:text-purple-400" />
                <span className="text-purple-600 dark:text-purple-400 font-medium">AI đang suy nghĩ...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-3 sm:p-4 md:p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex-shrink-0 rounded-b-lg sm:rounded-b-xl border-t">
        {/* Speech Recognition Interface */}
        {showSpeechInput && (
          <div className="mb-4">
            <ImprovedSpeechRecognition
              onTranscript={(transcript) => {
                form.setValue('query', transcript);
                setShowSpeechInput(false);
              }}
              onClose={() => setShowSpeechInput(false)}
              defaultLanguage="vi-VN"
            />
          </div>
        )}

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
                      className="h-11 sm:h-12 md:h-13 text-base rounded-full px-4 sm:px-5 md:px-6 bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-400 dark:focus:border-blue-500 shadow-sm"
                      style={{ fontSize: '16px' }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {/* Microphone Button */}
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => setShowSpeechInput(!showSpeechInput)}
              className="rounded-full w-11 h-11 sm:w-12 sm:h-12 md:w-13 md:h-13 shrink-0 border-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              disabled={isLoading}
            >
              <Mic className={`h-5 w-5 sm:h-5.5 sm:w-5.5 md:h-6 md:w-6 ${showSpeechInput ? 'text-red-500' : ''}`} />
            </Button>
            <Button type="submit" disabled={isLoading} size="icon" className="rounded-full w-11 h-11 sm:w-12 sm:h-12 md:w-13 md:h-13 shrink-0 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg">
              <Send className="h-5 w-5 sm:h-5.5 sm:w-5.5 md:h-6 md:w-6" />
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
