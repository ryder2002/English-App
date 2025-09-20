"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { quickDictionaryLookupAction, getAudioAction } from "@/app/actions";
import { ArrowRightLeft, Loader2, Search, Volume2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import type { Language } from "@/lib/types";
import { Skeleton } from "./ui/skeleton";

const languageEnum = z.enum(["english", "chinese", "vietnamese"]);

const formSchema = z.object({
  word: z.string().min(1, { message: "Từ không được để trống." }),
  sourceLanguage: languageEnum,
  targetLanguage: languageEnum,
}).refine(data => data.sourceLanguage !== data.targetLanguage, {
    message: "Ngôn ngữ nguồn và đích phải khác nhau.",
    path: ["targetLanguage"],
});

type DictionaryFormValues = z.infer<typeof formSchema>;

type SearchResult = {
  word: string;
  sourceLanguage: Language;
  translation: string;
  pronunciation?: string;
};

export function DictionarySearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const { toast } = useToast();
  const [audioState, setAudioState] = useState<{ id: string | null; status: 'playing' | 'loading' | 'idle' }>({ id: null, status: 'idle' });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Cleanup audio element on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const form = useForm<DictionaryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      word: "",
      sourceLanguage: "english",
      targetLanguage: "vietnamese",
    },
  });

  const onSubmit = async (values: DictionaryFormValues) => {
    setIsLoading(true);
    setResult(null);
    if(audioRef.current) {
        audioRef.current.pause();
    }
    setAudioState({ id: null, status: 'idle' });
    try {
      const details = await quickDictionaryLookupAction({
        word: values.word,
        sourceLanguage: values.sourceLanguage,
        targetLanguage: values.targetLanguage
      });

      setResult({
        word: values.word,
        sourceLanguage: values.sourceLanguage,
        translation: details.translation,
        pronunciation: details.pronunciation
      });

      // Pre-fetch and play audio for the source word
      if (details.audioSrc) {
        playAudio(values.word, values.sourceLanguage, 'original', details.audioSrc);
      }

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Ôi! Đã có lỗi xảy ra.",
        description:
          "Có lỗi khi tra từ. Vui lòng thử lại.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = async (text: string, lang: Language, id: string, src?: string) => {
    if (audioState.id === id && audioState.status === 'playing') {
      audioRef.current?.pause();
      setAudioState({ id: null, status: 'idle' });
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    let audioSrc = src;

    if (!audioSrc) {
        setAudioState({ id, status: 'loading' });
        try {
            audioSrc = await getAudioAction(text, lang);
            if (!audioSrc) {
                throw new Error("Audio source could not be generated.");
            }
        } catch (error) {
            console.error("Audio generation error:", error);
            toast({ variant: "destructive", title: "Lỗi AI", description: "Không thể tạo âm thanh." });
            setAudioState({ id: null, status: 'idle' });
            return;
        }
    }
    
    setAudioState({ id, status: 'playing' });
    const audio = new Audio(audioSrc);
    audioRef.current = audio;

    audio.onended = () => {
        setAudioState({ id: null, status: 'idle' });
        audioRef.current = null;
    };
    audio.onerror = () => {
        setAudioState({ id: null, status: 'idle' });
        toast({ variant: "destructive", title: "Lỗi phát âm", description: "Không thể phát tệp âm thanh." });
    };
    audio.play();
  };


  const swapLanguages = () => {
    const source = form.getValues("sourceLanguage");
    const target = form.getValues("targetLanguage");
    form.setValue("sourceLanguage", target);
    form.setValue("targetLanguage", source);
  }
  
  const languageOptions = [
      {value: 'english', label: 'Tiếng Anh'},
      {value: 'chinese', label: 'Tiếng Trung'},
      {value: 'vietnamese', label: 'Tiếng Việt'}
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="word"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Từ cần tra</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ví dụ: benevolent, 善良, hoặc tốt bụng"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                <div className="flex items-end gap-2">
                    <FormField
                    control={form.control}
                    name="sourceLanguage"
                    render={({ field }) => (
                        <FormItem className="flex-1">
                        <FormLabel>Từ</FormLabel>
                        <Select
                            onValueChange={field.onChange}
                            value={field.value}
                        >
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn một ngôn ngữ" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {languageOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={swapLanguages} className="shrink-0">
                        <ArrowRightLeft className="h-4 w-4" />
                    </Button>
                    <FormField
                    control={form.control}
                    name="targetLanguage"
                    render={({ field }) => (
                        <FormItem className="flex-1">
                        <FormLabel>Sang</FormLabel>
                        <Select
                            onValueChange={field.onChange}
                            value={field.value}
                        >
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn một ngôn ngữ" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {languageOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Tìm kiếm
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
         <div className="mt-8 p-10 flex flex-col items-center justify-center space-y-4 border rounded-lg">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-12 w-64" />
         </div>
      )}

      {result && !isLoading && (
        <Card className="mt-8 animate-in fade-in duration-500">
            <CardContent className="p-10 flex flex-col items-center justify-center text-center space-y-2">
                <div className="flex items-baseline gap-4">
                    <h2 className="text-5xl font-bold font-headline bg-gradient-to-r from-primary to-cyan-400 text-transparent bg-clip-text">{result.word}</h2>
                    <Badge variant="secondary">{languageOptions.find(l => l.value === result.sourceLanguage)?.label}</Badge>
                </div>

                {result.pronunciation && (
                    <p className="text-xl text-muted-foreground">{result.pronunciation}</p>
                )}

                <p className="text-3xl font-semibold pt-4">{result.translation}</p>
                
                <div className="pt-4">
                     <Button size="icon" variant="outline" className="rounded-full h-14 w-14" onClick={() => playAudio(result.word, result.sourceLanguage, 'original')} disabled={audioState.status === 'loading'}>
                        {(audioState.id === 'original' && (audioState.status === 'loading' || audioState.status === 'playing')) ? <Loader2 className="h-6 w-6 animate-spin"/> : <Volume2 className="h-6 w-6"/>}
                    </Button>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
