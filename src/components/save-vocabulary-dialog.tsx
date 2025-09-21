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
import type { Language, VocabularyItem, Folder } from "@/lib/types";
import { useEffect, useState } from "react";

const formSchema = z.object({
  word: z.string().min(1, { message: "Từ không được để trống." }),
  language: z.enum(["english", "chinese"], {
    required_error: "Vui lòng chọn một ngôn ngữ.",
  }),
  folderId: z.string().min(1, { message: "Thư mục không được để trống." }),
});

type SaveVocabularyFormValues = z.infer<typeof formSchema>;

interface SaveVocabularyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemToEdit?: VocabularyItem | null;
  defaultFolderId?: string;
}

export function SaveVocabularyDialog({
  open,
  onOpenChange,
  itemToEdit,
  defaultFolderId,
}: SaveVocabularyDialogProps) {
  const { addVocabularyItem, updateVocabularyItem, folders } = useVocabulary();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SaveVocabularyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      word: "",
      language: "english",
      folderId: "",
    },
  });
  
  const sortedFolders = [...folders].sort((a,b) => a.name.localeCompare(b.name));

  useEffect(() => {
    if (open) {
      if (itemToEdit) {
        form.reset({
          word: itemToEdit.word,
          language: itemToEdit.language as "english" | "chinese",
          folderId: itemToEdit.folderId,
        });
      } else {
        const initialFolderId = defaultFolderId || (sortedFolders.find(f => f.name === 'Cơ bản')?.id) || (sortedFolders[0]?.id) || "";
        form.reset({
          word: "",
          language: "english",
          folderId: initialFolderId,
        });
      }
    }
  }, [itemToEdit, form, open, folders, defaultFolderId, sortedFolders]);

  const onSubmit = async (values: SaveVocabularyFormValues) => {
    setIsSubmitting(true);
    try {
      let success = false;
      if (itemToEdit) {
        // Only folder can be changed when editing
        const editData = {
          folderId: values.folderId,
        };
        success = await updateVocabularyItem(itemToEdit.id, editData);
        if (success) {
          toast({
            title: "Thành công!",
            description: `Từ đã được chuyển tới thư mục được chọn.`,
          });
        }
      } else {
        const details = await getVocabularyDetailsAction(
          values.word,
          values.language as Language,
          "vietnamese"
        );

        if (!details || !details.translation) {
          throw new Error("AI không trả về dữ liệu hợp lệ.");
        }
      
        const vocabularyData = {
          word: values.word,
          language: values.language as Language,
          folderId: values.folderId,
          vietnameseTranslation: details.translation,
          ipa: details.pronunciation,
          pinyin: values.language === "chinese" ? details.pronunciation : undefined,
        };
        
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
            {itemToEdit
              ? "Chỉnh sửa thư mục cho từ của bạn."
              : "Nhập một từ và AI của chúng tôi sẽ xử lý phần còn lại."}
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
                    <Input placeholder="ví dụ: hello, 你好" {...field} disabled={isSubmitting || !!itemToEdit} />
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
                    value={field.value}
                    disabled={isSubmitting || !!itemToEdit}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn một ngôn ngữ" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="english">Tiếng Anh</SelectItem>
                      <SelectItem value="chinese">Tiếng Trung</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="folderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thư mục</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn một thư mục" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sortedFolders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {buttonText}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
