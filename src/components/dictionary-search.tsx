
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
import { ArrowRightLeft, Loader2, PlusCircle, Search, Volume2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { Separator } from "./ui/separator";
import type { Language } from "@/lib/types";
import { Skeleton } from "./ui/skeleton";
import type { GenerateVocabularyDetailsOutput } from "@/ai/flows/generate-vocabulary-details";
import { useSettings } from "@/contexts/settings-context";
import { SaveVocabularyDialog } from "./save-vocabulary-dialog";
import type { VocabularyItem } from "@/lib/types";

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
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const { selectedVoices } = useSettings();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  
  useEffect(() => {
    // Cleanup: stop speech synthesis on component unmount
    return () => {
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      window.speechSynthesis.cancel();
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
    window.speechSynthesis.cancel();
    setSpeakingId(null);
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
    
    utterance.onstart = () => setSpeakingId(id);
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

  const getInitialDataForSave = (): Partial<VocabularyItem> | undefined => {
    if (!result) return undefined;
    
    // We get the first translation available.
    const primaryTranslation = result.definitions[0]?.translation || "";

    return {
      word: result.word,
      language: result.sourceLanguage,
      vietnameseTranslation: primaryTranslation,
      ipa: result.sourceLanguage === 'english' ? result.pronunciation : undefined,
      pinyin: result.sourceLanguage === 'chinese' ? result.pronunciation : undefined,
    }
  }


  return (
    <>
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
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-grow min-w-0">
                        <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
                            <span className="truncate">{result.word}</span>
                            <Button size="icon" variant="ghost" className="rounded-full h-9 w-9 flex-shrink-0" onClick={(e) => playAudio(e, result.word, result.sourceLanguage, 'original')}>
                                {speakingId === 'original' ? <Loader2 className="h-5 w-5 animate-spin"/> : <Volume2 className="h-5 w-5"/>}
                            </Button>
                        </CardTitle>
                        {result.pronunciation && (
                           <p className="text-lg text-muted-foreground">{result.pronunciation}</p>
                        )}
                    </div>
                    <div className="flex-shrink-0">
                        <Button onClick={() => setIsSaveDialogOpen(true)} size="sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Thêm
                        </Button>
                    </div>
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
                      {result.examples.map((ex, index) => {
                        const audioId = `example-${index}`;
                        return (
                          <div key={index} className="pl-4 border-l-2 border-primary">
                            <div className="flex items-center gap-2">
                                <p className="font-medium flex-grow">{ex.source}</p>
                                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={(e) => playAudio(e, ex.source, result.sourceLanguage, audioId)}>
                                    {speakingId === audioId ? <Loader2 className="h-4 w-4 animate-spin"/> : <Volume2 className="h-4 w-4"/>}
                                </Button>
                            </div>
                            <p className="text-muted-foreground italic">"{ex.target}"</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </CardContent>
        </Card>
      )}
    </div>
    <SaveVocabularyDialog
        open={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        initialData={getInitialDataForSave()}
    />
    </>
  );
}
