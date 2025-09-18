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
import { ArrowRightLeft, Languages, Loader2, Search } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { GenerateVocabularyDetailsOutput } from "@/ai/flows/generate-vocabulary-details";

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
};

export function DictionarySearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const { toast } = useToast();

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
    <div className="max-w-2xl mx-auto">
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
                    <span className="text-3xl font-bold font-headline">{result.originalWord}</span>
                    <Badge variant={result.sourceLanguage === 'english' ? 'secondary' : 'outline'}>{result.sourceLanguage}</Badge>
                </div>
            </CardTitle>
             <CardDescription className="!mt-4 text-lg">
                <p className="font-semibold text-muted-foreground">Translation</p>
                <p className="text-2xl text-primary">{result.translation}</p>
             </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-lg">
            
            {(result.ipa || result.pinyin) && (
                <div>
                    <p className="font-semibold text-muted-foreground">Pronunciation</p>
                    <p>{result.ipa || result.pinyin}</p>
                </div>
            )}
            
            {result.examples && result.examples.length > 0 && (
                <div>
                    <p className="font-semibold text-muted-foreground mb-2">Examples</p>
                    <div className="space-y-4 text-base">
                        {result.examples.map((ex, index) => (
                            <div key={index} className="p-3 rounded-md border bg-muted/50">
                                <p className="font-medium">{ex.source}</p>
                                <p className="text-muted-foreground italic">{ex.target}</p>
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
