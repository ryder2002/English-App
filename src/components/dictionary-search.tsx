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
import { getVocabularyDetailsAction } from "@/app/actions";
import { Loader2, Search } from "lucide-react";
import type { Language, VocabularyItem } from "@/lib/types";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

const formSchema = z.object({
  word: z.string().min(1, { message: "Word cannot be empty." }),
  language: z.enum(["english", "chinese"], {
    required_error: "Please select a language.",
  }),
});

type DictionaryFormValues = z.infer<typeof formSchema>;

type SearchResult = Omit<VocabularyItem, "id">;

export function DictionarySearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const { toast } = useToast();

  const form = useForm<DictionaryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      word: "",
      language: "english",
    },
  });

  const onSubmit = async (values: DictionaryFormValues) => {
    setIsLoading(true);
    setResult(null);
    try {
      const details = await getVocabularyDetailsAction(
        values.word,
        values.language as Language
      );
      setResult({
        word: values.word,
        language: values.language as Language,
        ...details,
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

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="word"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Word to look up</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., benevolent or 善良"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="chinese">Chinese</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
            <CardTitle className="flex items-center gap-4">
              <span className="text-3xl font-bold font-headline">{result.word}</span>
              <Badge variant={result.language === 'english' ? 'secondary' : 'outline'}>{result.language}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-lg">
            <div>
              <p className="font-semibold text-muted-foreground">Vietnamese</p>
              <p className="text-2xl text-primary">{result.vietnameseTranslation}</p>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground">Pronunciation</p>
              <p>{result.ipa || result.pinyin}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
