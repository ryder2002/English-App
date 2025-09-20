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
import { dictionaryLookupAction, getAudioAction } from "@/app/actions";
import { ArrowRightLeft, Loader2, Search, Volume2, Mic } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import type { Language } from "@/lib/types";
import { Skeleton } from "./ui/skeleton";
import type { GenerateVocabularyDetailsOutput } from "@/ai/flows/generate-vocabulary-details";

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


export function DictionarySearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerateVocabularyDetailsOutput & {word: string; sourceLanguage: Language} | null>(null);
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
      const details = await dictionaryLookupAction({
        word: values.word,
        sourceLanguage: values.sourceLanguage,
        targetLanguage: values.targetLanguage
      });

      setResult({
        ...details,
        word: values.word,
        sourceLanguage: values.sourceLanguage,
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

  const playAudio = async (text: string, lang: Language, id: string) => {
    if (audioState.id === id && audioState.status === 'playing') {
      audioRef.current?.pause();
      setAudioState({ id: null, status: 'idle' });
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    setAudioState({ id, status: 'loading' });
    try {
        const audioSrc = await getAudioAction(text, lang);
        if (!audioSrc) {
            throw new Error("Audio source could not be generated.");
        }
        
        const audio = new Audio(audioSrc);
        audioRef.current = audio;

        audio.onplaying = () => setAudioState({ id, status: 'playing'});
        audio.onended = () => {
            setAudioState({ id: null, status: 'idle' });
            audioRef.current = null;
        };
        audio.onerror = () => {
            setAudioState({ id: null, status: 'idle' });
            toast({ variant: "destructive", title: "Lỗi phát âm", description: "Không thể phát tệp âm thanh." });
        };
        audio.play();

    } catch (error) {
        console.error("Audio generation error:", error);
        toast({ variant: "destructive", title: "Lỗi AI", description: "Không thể tạo âm thanh." });
        setAudioState({ id: null, status: 'idle' });
    }
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
         <div className="mt-8 p-6 flex flex-col space-y-4 border rounded-lg">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
            </div>
            <div className="space-y-3 pt-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/5" />
            </div>
            <div className="space-y-3 pt-6">
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
            </div>
         </div>
      )}

      {result && !isLoading && (
        <Card className="mt-8 animate-in fade-in duration-500">
            <CardHeader>
                <div className="flex items-baseline justify-between">
                    <div>
                        <CardTitle className="text-4xl font-bold font-headline flex items-center gap-3">
                            {result.word}
                        </CardTitle>
                        {result.definitions[0]?.pronunciation && (
                           <p className="text-xl text-muted-foreground">{result.definitions[0].pronunciation}</p>
                        )}
                    </div>
                     <Button size="icon" variant="ghost" className="rounded-full h-14 w-14" onClick={() => playAudio(result.word, result.sourceLanguage, 'original')} disabled={audioState.status === 'loading'}>
                        {(audioState.id === 'original' && (audioState.status === 'loading' || audioState.status === 'playing')) ? <Loader2 className="h-6 w-6 animate-spin"/> : <Volume2 className="h-6 w-6"/>}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                     <h3 className="text-lg font-semibold mb-2 font-headline tracking-tight">Định nghĩa</h3>
                     <div className="space-y-4">
                        {result.definitions.map((def, index) => (
                            <div key={index} className="p-4 bg-muted/50 rounded-lg">
                                <p className="font-semibold">{def.meaning} <span className="text-sm text-muted-foreground italic">({def.partOfSpeech})</span></p>
                                <p className="text-primary">{def.translation}</p>
                            </div>
                        ))}
                     </div>
                </div>
                
                {result.examples && result.examples.length > 0 && (
                  <div>
                    <Separator className="my-6"/>
                    <h3 className="text-lg font-semibold mb-2 font-headline tracking-tight">Ví dụ</h3>
                    <div className="space-y-3">
                      {result.examples.map((ex, index) => (
                        <div key={index} className="pl-4 border-l-2 border-primary">
                          <p className="font-medium">{ex.source}</p>
                          <p className="text-muted-foreground italic">"{ex.target}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </CardContent>
        </Card>
      )}
    </div>
  );
}
