"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useVocabulary } from "@/contexts/vocabulary-context";
import { useToast } from "@/hooks/use-toast";
import { getVocabularyDetailsAction } from "@/app/actions";
import { Loader2 } from "lucide-react";
import type { Language } from "@/lib/types";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

const formSchema = z.object({
  word: z.string().min(1, { message: "Word cannot be empty." }),
  language: z.enum(["english", "chinese"], {
    required_error: "Please select a language.",
  }),
  folder: z.string().min(1, { message: "Folder cannot be empty." }),
});

type AddVocabularyFormValues = z.infer<typeof formSchema>;

interface AddVocabularyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddVocabularyDialog({
  open,
  onOpenChange,
}: AddVocabularyDialogProps) {
  const { addVocabularyItem, isLoading, setIsLoading, getFolders } =
    useVocabulary();
  const { toast } = useToast();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const folders = getFolders();

  const form = useForm<AddVocabularyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      word: "",
      language: "english",
      folder: "Basics",
    },
  });

  const onSubmit = async (values: AddVocabularyFormValues) => {
    setIsLoading(true);
    try {
      const details = await getVocabularyDetailsAction(
        values.word,
        values.language as Language
      );
      addVocabularyItem({
        id: new Date().toISOString(),
        word: values.word,
        language: values.language as Language,
        folder: values.folder,
        ...details,
      });
      toast({
        title: "Success!",
        description: `"${values.word}" has been added to your vocabulary.`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem adding your word. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Word</DialogTitle>
          <DialogDescription>
            Enter a word and our AI will handle the rest.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="word"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Word</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., hello or 你好" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <FormField
              control={form.control}
              name="folder"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Folder</FormLabel>
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value || "Select folder"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search or create folder..."
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              !folders.includes(
                                (e.target as HTMLInputElement).value
                              )
                            ) {
                              form.setValue(
                                "folder",
                                (e.target as HTMLInputElement).value
                              );
                              setPopoverOpen(false);
                            }
                          }}
                        />
                        <CommandList>
                          <CommandEmpty>No folder found. Press Enter to create.</CommandEmpty>
                          <CommandGroup>
                            {folders.map((folder) => (
                              <CommandItem
                                value={folder}
                                key={folder}
                                onSelect={() => {
                                  form.setValue("folder", folder);
                                  setPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    folder === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {folder}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Word
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
