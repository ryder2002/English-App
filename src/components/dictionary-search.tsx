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
import { dictionaryLookupAction, getAudioForWordAction } from "@/app/actions";
import { ArrowRightLeft, Languages, Loader2, Search, Volume2 } from "lucide-react";
import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { GenerateVocabularyDetailsOutput } from "@/ai/flows/generate-vocabulary-details";
import { Separator } from "./ui/separator";

const languageEnum = z.enum(["english", "chinese", "vietnamese"]);

const formSchema = z.object({
  word: z.string().min(1, { message: "Word cannot be empty." }),
  sourceLanguage: languageEnum,
  targetLanguage: languageEnum,
}).refine(data => data.sourceLanguage !== data.targetLanguage, {
    message: "Source and target languages must be different.",
    path: ["targetLanguage"],
});

type DictionaryFormValues = z.infer<typeof formSchema>;

type SearchResult = GenerateVocabularyDetailsOutput & {
  originalWord: string,
  sourceLanguage: z.infer<typeof languageEnum>,
  targetLanguage: z.infer<typeof languageEnum>,
};

export function DictionarySearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const { toast } = useToast();
  const [playingAudioFor, setPlayingAudioFor] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
        title: "Uh oh! Something went wrong.",
        description:
          "There was a problem looking up your word. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = async (text: string, lang: string, id: string) => {
    if (playingAudioFor === id) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingAudioFor(null);
      return;
    }

    setPlayingAudioFor(id);
    try {
      const audioDataUri = await getAudioForWordAction(text, lang);
      const audio = new Audio(audioDataUri);
      audioRef.current = audio;
      audio.play();
      audio.onended = () => {
        setPlayingAudioFor(null);
        audioRef.current = null;
      };
    } catch (error) {
      console.error("Failed to play audio", error);
      toast({ variant: "destructive", title: "Could not play audio." });
      setPlayingAudioFor(null);
    }
  };

  const swapLanguages = () => {
    const source = form.getValues("sourceLanguage");
    const target = form.getValues("targetLanguage");
    form.setValue("sourceLanguage", target);
    form.setValue("targetLanguage", source);
  }
  
  const languageOptions = [
      {value: 'english', label: 'English'},
      {value: 'chinese', label: 'Chinese'},
      {value: 'vietnamese', label: 'Vietnamese'}
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
                        <FormLabel>Word to look up</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., benevolent, 善良, or tốt bụng"
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
                        <FormLabel>From</FormLabel>
                        <Select
                            onValueChange={field.onChange}
                            value={field.value}
                        >
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a language" />
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
                        <FormLabel>To</FormLabel>
                        <Select
                            onValueChange={field.onChange}
                            value={field.value}
                        >
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a language" />
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
                Search
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
                    <span className="text-4xl font-bold font-headline">{result.originalWord}</span>
                    <Badge variant="secondary">{result.sourceLanguage}</Badge>
                </div>
                <Button size="icon" variant="ghost" onClick={() => playAudio(result.originalWord, result.sourceLanguage, 'original')}>
                    {playingAudioFor === 'original' ? <Loader2 className="h-5 w-5 animate-spin"/> : <Volume2 className="h-5 w-5"/>}
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
                         <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => playAudio(def.translation, result.targetLanguage, `def-${index}`)}>
                            {playingAudioFor === `def-${index}` ? <Loader2 className="h-4 w-4 animate-spin"/> : <Volume2 className="h-4 w-4"/>}
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
                    <p className="font-semibold text-muted-foreground mb-2 text-lg">Examples</p>
                    <div className="space-y-4 text-base">
                        {result.examples.map((ex, index) => (
                            <div key={index} className="p-3 rounded-md border bg-muted/50">
                                <p className="font-medium">{ex.source}</p>
                                <p className="text-muted-foreground italic">{ex.target}</p>
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
