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
import { useEffect, useState } from "react";

const formSchema = z.object({
  word: z.string().min(1, { message: "Từ không được để trống." }),
  language: z.enum(["english", "chinese", "vietnamese"], {
    required_error: "Vui lòng chọn một ngôn ngữ.",
  }),
  vietnameseTranslation: z.string().optional(),
  partOfSpeech: z.string().optional(),
  folder: z.string().min(1, { message: "Thư mục không được để trống." }),
});

type SaveVocabularyFormValues = z.infer<typeof formSchema>;

interface SaveVocabularyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemToEdit?: VocabularyItem | null;
  defaultFolder?: string;
  initialData?: Partial<VocabularyItem>;
  folders?: string[]; // nhận folders qua props, mặc định là mảng rỗng
  addFolder?: (name: string) => Promise<void>; // nhận addFolder qua props nếu có
}

export function SaveVocabularyDialog({
  open,
  onOpenChange,
  itemToEdit,
  defaultFolder,
  initialData,
  folders = [], // nhận folders qua props, mặc định là mảng rỗng
  addFolder: addFolderProp, // nhận addFolder qua props nếu có
}: SaveVocabularyDialogProps & { folders?: string[], addFolder?: (name: string) => Promise<void> }) {
  // Nếu không truyền vào thì lấy từ context
  const context = useVocabulary();
  const addVocabularyItem = context?.addVocabularyItem;
  const updateVocabularyItem = context?.updateVocabularyItem;
  const addFolder = addFolderProp || context?.addFolder;
  // Sửa logic lấy danh sách thư mục để tránh lỗi khi context.folders là undefined hoặc null
  const foldersList = Array.isArray(folders) && folders.length > 0
    ? folders
    : Array.isArray(context?.folderObjects)
      ? context.folderObjects.map(f => f.name)
      : [];
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const form = useForm<SaveVocabularyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      word: "",
      language: "english",
      vietnameseTranslation: "",
      partOfSpeech: "",
      folder: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (itemToEdit) {
        form.reset({
          word: itemToEdit.word,
          language: itemToEdit.language as "english" | "chinese" | "vietnamese",
          vietnameseTranslation: itemToEdit.vietnameseTranslation,
          partOfSpeech: itemToEdit.partOfSpeech,
          folder: itemToEdit.folder,
        });
      } else if (initialData) {
        form.reset({
          word: initialData.word || "",
          language: initialData.language || "english",
          vietnameseTranslation: initialData.vietnameseTranslation || "",
          partOfSpeech: initialData.partOfSpeech || "",
          folder: defaultFolder || initialData.folder || (foldersList.length > 0 ? foldersList[0] : ""),
        });
      } else {
        form.reset({
          word: "",
          language: "english",
          vietnameseTranslation: "",
          partOfSpeech: "",
          folder: defaultFolder || (foldersList.length > 0 ? foldersList[0] : ""),
        });
      }
      setNewFolderName("");
    }
  }, [itemToEdit, initialData, form, open, defaultFolder, foldersList]);

  // Sửa lỗi lặp setState: Chỉ gọi setNewFolderName khi dialog đang mở, đã chọn new_folder và input đang hiện
  const selectedFolder = form.watch("folder");

  useEffect(() => {
    if (!open || selectedFolder !== "new_folder") {
      if (newFolderName !== "") setNewFolderName("");
    }
  }, [open, selectedFolder]);

 const onSubmit = async (values: SaveVocabularyFormValues) => {
    setIsSubmitting(true);
    try {
      let targetFolder = values.folder;
      // Sửa lại logic kiểm tra folderExists để dùng đúng danh sách foldersList, tránh lặp vô hạn khi thêm thư mục mới
      if (targetFolder === 'new_folder' && newFolderName) {
        const folderExists = foldersList.some((f: string) => f.toLowerCase() === newFolderName.toLowerCase());
        if (!folderExists) {
          await addFolder(newFolderName);
        }
        targetFolder = newFolderName;
      }

      let success = false;
      if (itemToEdit) {
        const wordChanged = values.word !== itemToEdit.word;
        const languageChanged = values.language !== itemToEdit.language;

        const editData: Partial<VocabularyItem> = {
          id: itemToEdit.id,
          word: values.word,
          language: values.language,
          folder: targetFolder,
          vietnameseTranslation: values.vietnameseTranslation,
          partOfSpeech: values.partOfSpeech,
          ipa: itemToEdit.ipa,
          pinyin: itemToEdit.pinyin,
        };

        if (wordChanged || languageChanged) {
          try {
            const details = await getVocabularyDetailsAction(
              values.word,
              values.language as Language,
              "vietnamese"
            );
            editData.vietnameseTranslation = values.vietnameseTranslation || details.translation;
            editData.partOfSpeech = values.partOfSpeech || details.partOfSpeech;
            editData.ipa = details.ipa;
            editData.pinyin = details.pinyin;
          } catch (aiError) {
            console.error("AI detail fetch failed during edit:", aiError);
            toast({
              variant: "destructive",
              title: "AI hỗ trợ thất bại",
              description: `Không thể tự động điền thông tin cho từ mới "${values.word}". Vui lòng điền thủ công.`,
            });
            editData.ipa = undefined;
            editData.pinyin = undefined;
          }
        }

        const updateResult = await updateVocabularyItem(itemToEdit.id, editData);
        success = typeof updateResult === "boolean" ? updateResult : true;
        if (success) {
          toast({
            title: "Thành công!",
            description: `Từ "${values.word}" đã được cập nhật.`,
          });
        }
      } else {
        const details = await getVocabularyDetailsAction(
          values.word,
          values.language as Language,
          "vietnamese"
        );

        const finalVietnameseTranslation = values.vietnameseTranslation || (values.language === 'vietnamese' ? values.word : details.translation);

        if (!finalVietnameseTranslation) {
          throw new Error("Không thể tìm thấy nghĩa Tiếng Việt cho từ này.");
        }

        const vocabularyData = {
          word: values.word,
          language: values.language as Language,
          folder: targetFolder,
          vietnameseTranslation: finalVietnameseTranslation,
          partOfSpeech: values.partOfSpeech || details.partOfSpeech,
          ipa: initialData?.ipa || details.ipa,
          pinyin: initialData?.pinyin || details.pinyin,
        };

        const addResult = await addVocabularyItem(vocabularyData);
        success = addResult !== null;
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
       let errorMessage = "Có lỗi khi lưu từ của bạn. Vui lòng thử lại.";
       if (error instanceof Error && error.message.includes("is invalid")) {
           errorMessage = `Từ "${(error as any).word || values.word}" không hợp lệ hoặc không tìm thấy.`;
       }
      toast({
        variant: "destructive",
        title: "Ôi! Đã có lỗi xảy ra.",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const dialogTitle = itemToEdit ? "Chỉnh sửa từ" : "Thêm từ mới";
  const buttonText = itemToEdit ? "Lưu thay đổi" : "Thêm từ";
  // Đảm bảo chỉ khai báo selectedFolder một lần duy nhất ở đầu component
  // const selectedFolder = form.watch("folder"); // Remove this duplicate declaration

  const isNewWordFromDictionary = !!initialData && !itemToEdit;
  const isEditing = !!itemToEdit;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Chỉnh sửa thông tin cho từ vựng của bạn."
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
                    <Input placeholder="ví dụ: hello, 你好" {...field} disabled={isSubmitting || isNewWordFromDictionary} />
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
                    disabled={isSubmitting || isNewWordFromDictionary}
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
              name="vietnameseTranslation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nghĩa Tiếng Việt</FormLabel>
                  <FormControl>
                    <Input placeholder={isEditing ? "Chỉnh sửa nghĩa..." : "Có thể bỏ trống, AI sẽ tự điền"} {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="partOfSpeech"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Từ loại</FormLabel>
                  <FormControl>
                    <Input placeholder={isEditing ? "Chỉnh sửa từ loại..." : "Có thể bỏ trống, AI sẽ tự điền"} {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="folder"
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
                        {foldersList.map((folder: string) => (
                        <SelectItem key={folder} value={folder}>
                          {folder}
                        </SelectItem>
                        ))}
                       <SelectItem value="new_folder">
                          + Tạo thư mục mới...
                        </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             {selectedFolder === "new_folder" && open && (
              <FormItem>
                <FormLabel>Tên thư mục mới</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ví dụ: Chủ đề Gia đình"
                    value={newFolderName}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value !== newFolderName) setNewFolderName(value);
                    }}
                    disabled={isSubmitting}
                  />
                </FormControl>
              </FormItem>
            )}
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

export interface VocabularyContextType {
  addVocabularyItem: (item: VocabularyItem) => Promise<boolean>;
  updateVocabularyItem: (id: string, item: Partial<VocabularyItem>) => Promise<boolean>;
  addFolder: (folderName: string) => Promise<void>;
  folders: string[];
  // other properties...
}
