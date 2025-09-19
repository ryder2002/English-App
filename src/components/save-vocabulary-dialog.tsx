
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
import type { Language, VocabularyItem } from "@/lib/types";
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
import { useEffect, useState } from "react";

const formSchema = z.object({
  word: z.string().min(1, { message: "Từ không được để trống." }),
  language: z.enum(["english", "chinese", "vietnamese"], {
    required_error: "Vui lòng chọn một ngôn ngữ.",
  }),
  folder: z.string().min(1, { message: "Thư mục không được để trống." }),
});

type SaveVocabularyFormValues = z.infer<typeof formSchema>;

interface SaveVocabularyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemToEdit?: Omit<VocabularyItem, 'createdAt'> | null;
}

export function SaveVocabularyDialog({
  open,
  onOpenChange,
  itemToEdit,
}: SaveVocabularyDialogProps) {
  const { addVocabularyItem, updateVocabularyItem, folders } =
    useVocabulary();
  const { toast } = useToast();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const sortedFolders = [...folders].sort();

  const form = useForm<SaveVocabularyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      word: "",
      language: "english",
      folder: "Cơ bản",
    },
  });

  useEffect(() => {
    if (open) {
      if (itemToEdit) {
        form.reset({
          word: itemToEdit.word,
          language: itemToEdit.language,
          folder: itemToEdit.folder,
        });
      } else {
        form.reset({
          word: "",
          language: "english",
          folder: folders.includes("Cơ bản") ? "Cơ bản" : folders[0] || "",
        });
      }
    }
  }, [itemToEdit, form, open, folders]);


  const onSubmit = async (values: SaveVocabularyFormValues) => {
    setIsSubmitting(true);
    try {
      let details;
      if (values.language === 'vietnamese') {
        // If the word is already in Vietnamese, no need to call the AI for translation.
        details = {
          definitions: [{
            partOfSpeech: "từ", // generic part of speech
            meaning: values.word,
            translation: values.word,
            pronunciation: ""
          }],
          examples: []
        };
      } else {
        details = await getVocabularyDetailsAction(
            values.word,
            values.language as Language
        );
      }

      const primaryDefinition = details.definitions[0];
      if (!primaryDefinition) {
        throw new Error("AI không trả về định nghĩa hợp lệ.");
      }

      const vocabularyData = {
          word: values.word,
          language: values.language as Language,
          folder: values.folder,
          vietnameseTranslation: primaryDefinition.translation,
          ipa: values.language === 'english' ? primaryDefinition.pronunciation : undefined,
          pinyin: values.language === 'chinese' ? primaryDefinition.pronunciation : undefined,
      };

      let success = false;
      if (itemToEdit) {
        success = await updateVocabularyItem(itemToEdit.id!, vocabularyData);
        if (success) {
            toast({
                title: "Thành công!",
                description: `"${values.word}" đã được cập nhật.`,
            });
        }
      } else {
        success = await addVocabularyItem(vocabularyData);
        if (success) {
            toast({
                title: "Thành công!",
                description: `"${values.word}" đã được thêm vào từ vựng của bạn.`,
            });
        }
      }

      if (success) {
        form.reset();
        onOpenChange(false);
      }

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Ôi! Đã có lỗi xảy ra.",
        description: "Có lỗi khi lưu từ của bạn. Vui lòng thử lại.",
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  const dialogTitle = itemToEdit ? "Chỉnh sửa từ" : "Thêm từ mới";
  const buttonText = itemToEdit ? "Lưu thay đổi" : "Thêm từ";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {itemToEdit ? "Cập nhật chi tiết cho từ của bạn." : "Nhập một từ và AI của chúng tôi sẽ xử lý phần còn lại."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="word"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Từ</FormLabel>
                  <FormControl>
                    <Input placeholder="ví dụ: hello hoặc 你好" {...field} disabled={isSubmitting} />
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
                  <FormLabel>Ngôn ngữ</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn một ngôn ngữ" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="english">Tiếng Anh</SelectItem>
                      <SelectItem value="chinese">Tiếng Trung</SelectItem>
                      <SelectItem value="vietnamese">Tiếng Việt</SelectItem>
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
                  <FormLabel>Thư mục</FormLabel>
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          disabled={isSubmitting}
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value || "Chọn thư mục"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command
                        filter={(value, search) => {
                            if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                            return 0;
                        }}
                      >
                        <CommandInput
                          placeholder="Tìm kiếm hoặc tạo mới..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                               const newFolderValue = (e.target as HTMLInputElement).value;
                               if(newFolderValue && !sortedFolders.find(f => f.toLowerCase() === newFolderValue.toLowerCase())) {
                                  form.setValue("folder", newFolderValue);
                                  setPopoverOpen(false);
                               }
                            }
                          }}
                        />
                        <CommandList>
                          <CommandEmpty>Không tìm thấy thư mục. Nhấn Enter để tạo mới.</CommandEmpty>
                          <CommandGroup>
                            {sortedFolders.map((folder) => (
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
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {buttonText}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
