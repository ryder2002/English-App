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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVocabulary } from "@/contexts/vocabulary-context";
import { FolderSelectItems } from "@/components/folder-select-items";
import { useToast } from "@/hooks/use-toast";
import { batchAddVocabularyAction } from "@/app/actions";
import { ListPlus, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { type GenerateBatchVocabularyDetailsOutput } from "@/ai/flows/generate-batch-vocabulary-details";

const languageEnum = z.enum(["english", "chinese", "vietnamese"]);

const formSchema = z.object({
  words: z.string().min(1, { message: "Phải có ít nhất một từ." }),
  sourceLanguage: languageEnum,
  targetLanguage: languageEnum,
  folder: z.string().min(1, { message: "Thư mục không được để trống." }),
}).refine(data => data.sourceLanguage !== data.targetLanguage, {
    message: "Ngôn ngữ nguồn và đích phải khác nhau.",
    path: ["targetLanguage"],
});

type BatchAddFormValues = z.infer<typeof formSchema>;

export function BatchAddForm() {
    const { folderObjects, addFolder, addVocabularyItem, buildFolderTree } = useVocabulary();
    const folderTree = buildFolderTree ? buildFolderTree() : [];
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    const form = useForm<BatchAddFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            words: "",
            sourceLanguage: "english",
            targetLanguage: "vietnamese",
            folder: "",
        },
    });
    
    useEffect(() => {
        const getFirstFolderName = () => {
            if (folderTree.length > 0) return folderTree[0].name;
            return folderObjects.length > 0 ? folderObjects[0].name : "";
        };
        const firstFolder = getFirstFolderName();
        if (firstFolder && !form.getValues('folder')) {
            form.setValue('folder', firstFolder);
        }
    }, [folderTree, folderObjects, form]);


    const selectedFolder = form.watch("folder");

    const onSubmit = async (values: BatchAddFormValues) => {
        setIsSubmitting(true);
        try {
            const wordsArray = values.words.split('\n').map(w => w.trim()).filter(w => w.length > 0);
            if (wordsArray.length === 0) {
                toast({
                    variant: "destructive",
                    title: "Không có từ nào để thêm.",
                    description: "Vui lòng nhập các từ bạn muốn thêm, mỗi từ một dòng.",
                });
                setIsSubmitting(false);
                return;
            }
            
            let targetFolder = values.folder;
            if (targetFolder === "new_folder") {
                if (!newFolderName) {
                    toast({
                        variant: "destructive",
                        title: "Tên thư mục trống",
                        description: "Vui lòng nhập tên cho thư mục mới.",
                    });
                    setIsSubmitting(false);
                    return;
                }
                const folderExists = folderObjects.some(f => f.name.toLowerCase() === newFolderName.toLowerCase());
                if (!folderExists) {
                    await addFolder(newFolderName);
                }
                targetFolder = newFolderName;
            }

            const result: GenerateBatchVocabularyDetailsOutput = await batchAddVocabularyAction({
                words: wordsArray,
                sourceLanguage: values.sourceLanguage,
                targetLanguage: values.targetLanguage,
                folder: targetFolder,
            });

            if (result.invalidWords && result.invalidWords.length > 0) {
                toast({
                    variant: "destructive",
                    title: `Phát hiện ${result.invalidWords.length} từ không hợp lệ`,
                    description: `Vui lòng sửa các từ sau: ${result.invalidWords.join(", ")}`,
                    duration: 5000,
                });
            } else if (result.processedWords && result.processedWords.length > 0) {
                // Thêm từng từ bằng addVocabularyItem
                for (const word of result.processedWords) {
                  await addVocabularyItem(word);
                }
                toast({
                    title: "Thêm thành công!",
                    description: `${result.processedWords.length} từ đã được thêm vào thư mục "${targetFolder}".`,
                });
                form.reset();
                setNewFolderName("");
            } else {
                toast({
                    variant: "destructive",
                    title: "Không có từ nào được thêm",
                    description: "Không thể xử lý các từ đã nhập. Vui lòng kiểm tra lại.",
                });
            }

        } catch (error) {
            console.error("Batch add error:", error);
            toast({
                variant: "destructive",
                title: "Ôi! Đã có lỗi xảy ra.",
                description: "Không thể thêm từ hàng loạt. Vui lòng thử lại.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
      const languageOptions = [
        {value: 'english', label: 'Tiếng Anh'},
        {value: 'chinese', label: 'Tiếng Trung'},
        {value: 'vietnamese', label: 'Tiếng Việt'}
    ]

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="words"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-base font-semibold">Danh sách từ vựng</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="hello = hi&#10;world&#10;你好&#10;put on : wear&#10;..."
                                {...field}
                                rows={6}
                                disabled={isSubmitting}
                                className="resize-none text-sm font-mono"
                            />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">Nhập mỗi từ trên một dòng</p>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="sourceLanguage"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-sm">Từ ngôn ngữ</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={isSubmitting}
                            >
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn ngôn ngữ" />
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
                    <FormField
                        control={form.control}
                        name="targetLanguage"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-sm">Sang ngôn ngữ</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={isSubmitting}
                            >
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn ngôn ngữ" />
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

                <div className="grid grid-cols-1 gap-4">
                    <FormField
                        control={form.control}
                        name="folder"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm">Lưu vào thư mục</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={isSubmitting}
                                >
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn thư mục" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <FolderSelectItems
                                        folders={folderObjects || []}
                                        folderTree={folderTree}
                                        valueKey="name"
                                        showNewFolderOption={true}
                                        newFolderLabel="+ Tạo thư mục mới..."
                                      />
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    {selectedFolder === "new_folder" && (
                        <FormItem>
                            <FormLabel className="text-sm">Tên thư mục mới</FormLabel>
                            <FormControl>
                            <Input
                                placeholder="ví dụ: Chủ đề Gia đình"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                disabled={isSubmitting}
                            />
                            </FormControl>
                        </FormItem>
                    )}
                </div>

                <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                    size="lg"
                >
                    {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                    <ListPlus className="mr-2 h-4 w-4" />
                    )}
                    Thêm từ vựng
                </Button>
            </form>
        </Form>
    );
}
