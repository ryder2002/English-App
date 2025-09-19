

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
import { dictionaryLookupAction } from "@/app/actions";
import { ArrowRightLeft, Languages, Loader2, Search, Volume2 } from "lucide-react";
import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import type { GenerateVocabularyDetailsOutput } from "@/ai/flows/generate-vocabulary-details";
import { Separator } from "./ui/separator";
import type { Language } from "@/lib/types";

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

type SearchResult = GenerateVocabularyDetailsOutput & {
  originalWord: string,
  sourceLanguage: Language,
  targetLanguage: Language,
};

export function DictionarySearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const { toast } = useToast();
  const [audioState, setAudioState] = useState<{ id: string | null; status: 'playing' | 'loading' | 'idle' }>({ id: null, status: 'idle' });
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

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
    speechSynthesis.cancel();
    setAudioState({ id: null, status: 'idle' });
    try {
      const details = await dictionaryLookupAction({
        word: values.word,
        sourceLanguage: values.sourceLanguage,
        targetLanguage: values.targetLanguage
      });
      setResult({
        ...details,
        originalWord: values.word,
        sourceLanguage: values.sourceLanguage,
        targetLanguage: values.targetLanguage,
      });
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

  const playAudio = async (text: string, lang: string, id: string) => {
    if (!('speechSynthesis' in window)) {
        toast({ variant: "destructive", title: "Lỗi", description: "Trình duyệt của bạn không hỗ trợ phát âm thanh." });
        return;
    }

    if (audioState.status === 'playing' && audioState.id === id) {
        speechSynthesis.cancel();
        setAudioState({ id: null, status: 'idle' });
        return;
    }
    
    // Stop any currently playing audio
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    const langMap = {
        english: 'en-US',
        chinese: 'zh-CN',
        vietnamese: 'vi-VN'
    };
    utterance.lang = langMap[lang as keyof typeof langMap] || 'en-US';

    utterance.onstart = () => {
        setAudioState({ id, status: 'playing' });
    };

    utterance.onend = () => {
        setAudioState({ id: null, status: 'idle' });
        utteranceRef.current = null;
    };
    
    utterance.onerror = () => {
        setAudioState({ id: null, status: 'idle' });
        toast({ variant: "destructive", title: "Lỗi phát âm", description: "Không thể phát âm thanh. Vui lòng thử lại." });
    };
    
    setAudioState({ id, status: 'loading' });
    speechSynthesis.speak(utterance);
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
         <div className="mt-8 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </div>
      )}

      {result && (
        <Card className="mt-8 animate-in fade-in duration-500">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
                <div className="flex items-baseline gap-4">
                    <span className="text-4xl font-bold font-headline bg-gradient-to-r from-primary to-cyan-400 text-transparent bg-clip-text">{result.originalWord}</span>
                    <Badge variant="secondary">{languageOptions.find(l => l.value === result.sourceLanguage)?.label}</Badge>
                </div>
                <Button size="icon" variant="ghost" onClick={() => playAudio(result.originalWord, result.sourceLanguage, 'original')} disabled={audioState.status === 'loading'}>
                    {(audioState.id === 'original' && (audioState.status === 'loading' || audioState.status === 'playing')) ? <Loader2 className="h-5 w-5 animate-spin"/> : <Volume2 className="h-5 w-5"/>}
                </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {result.definitions.map((def, index) => (
              <div key={index} className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="capitalize text-sm">{def.partOfSpeech}</Badge>
                        {def.pronunciation && <p className="text-muted-foreground text-sm">{def.pronunciation}</p>}
                    </div>
                    <p className="pl-2">{def.meaning}</p>
                    <div className="pl-2 flex items-center gap-2">
                         <p className="text-lg text-primary font-semibold">{def.translation}</p>
                         <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => playAudio(def.translation, result.targetLanguage, `def-${index}`)} disabled={audioState.status === 'loading'}>
                            {(audioState.id === `def-${index}` && (audioState.status === 'loading' || audioState.status === 'playing')) ? <Loader2 className="h-4 w-4 animate-spin"/> : <Volume2 className="h-4 w-4"/>}
                        </Button>
                    </div>
                </div>
                {index < result.definitions.length - 1 && <Separator />}
              </div>
            ))}
            
            {result.examples && result.examples.length > 0 && (
                <>
                <Separator />
                <div>
                    <p className="font-semibold text-muted-foreground mb-2 text-lg">Ví dụ</p>
                    <div className="space-y-4 text-base">
                        {result.examples.map((ex, index) => (
                            <div key={index} className="p-3 rounded-md border bg-muted/50">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium flex-grow">{ex.source}</p>
                                  {(result.sourceLanguage === 'english' || result.sourceLanguage === 'chinese') && (
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-8 w-8 text-muted-foreground shrink-0" 
                                      onClick={(e) => { e.stopPropagation(); playAudio(ex.source, result.sourceLanguage, `ex-source-${index}`)}}
                                      disabled={audioState.status === 'loading'}
                                    >
                                      {(audioState.id === `ex-source-${index}` && (audioState.status === 'loading' || audioState.status === 'playing')) 
                                        ? <Loader2 className="h-4 w-4 animate-spin"/> 
                                        : <Volume2 className="h-4 w-4"/>
                                      }
                                    </Button>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-muted-foreground italic flex-grow">{ex.target}</p>
                                    {(result.targetLanguage === 'english' || result.targetLanguage === 'chinese') && (
                                        <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 text-muted-foreground shrink-0" 
                                        onClick={(e) => { e.stopPropagation(); playAudio(ex.target, result.targetLanguage, `ex-target-${index}`)}}
                                        disabled={audioState.status === 'loading'}
                                        >
                                        {(audioState.id === `ex-target-${index}` && (audioState.status === 'loading' || audioState.status === 'playing')) 
                                            ? <Loader2 className="h-4 w-4 animate-spin"/> 
                                            : <Volume2 className="h-4 w-4"/>
                                        }
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                </>
            )}

          </CardContent>
        </Card>
      )}
    </div>
  );
}
