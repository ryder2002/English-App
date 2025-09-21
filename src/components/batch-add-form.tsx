
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
import { useToast } from "@/hooks/use-toast";
import { batchAddVocabularyAction } from "@/app/actions";
import { ArrowRight, ListPlus, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";

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
    const { addManyVocabularyItems, folders, addFolder } = useVocabulary();
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
        if (folders.length > 0 && !form.getValues('folder')) {
            form.setValue('folder', folders[0]);
        }
    }, [folders, form]);


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
                const folderExists = folders.some(f => f.toLowerCase() === newFolderName.toLowerCase());
                if (!folderExists) {
                    await addFolder(newFolderName);
                }
                targetFolder = newFolderName;
            }


            const newItems = await batchAddVocabularyAction({
                words: wordsArray,
                sourceLanguage: values.sourceLanguage,
                targetLanguage: values.targetLanguage,
                folder: targetFolder,
            });

            await addManyVocabularyItems(newItems);

            toast({
                title: "Thêm thành công!",
                description: `${newItems.length} từ đã được thêm vào thư mục "${targetFolder}".`,
            });
            form.reset();
            setNewFolderName("");

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
        <div className="max-w-2xl mx-auto">
        <Card>
            <CardHeader>
                <CardTitle>Nhập danh sách từ</CardTitle>
                <CardDescription>
                    Nhập mỗi từ trên một dòng. Hệ thống sẽ tự động tìm nạp định nghĩa, bản dịch và phát âm cho bạn.
                </CardDescription>
            </CardHeader>
            <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="words"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Danh sách từ vựng</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="hello
world
你好
..."
                                {...field}
                                rows={8}
                                disabled={isSubmitting}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                
                <div className="flex flex-col sm:flex-row items-end gap-2">
                    <FormField
                        control={form.control}
                        name="sourceLanguage"
                        render={({ field }) => (
                            <FormItem className="w-full sm:w-1/2">
                            <FormLabel>Từ ngôn ngữ</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={isSubmitting}
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
                    <div className="hidden sm:flex items-center justify-center pb-2">
                      <ArrowRight className="h-4 w-4 text-muted-foreground"/>
                    </div>
                    <FormField
                        control={form.control}
                        name="targetLanguage"
                        render={({ field }) => (
                            <FormItem className="w-full sm:w-1/2">
                            <FormLabel>Sang ngôn ngữ</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={isSubmitting}
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

                <FormField
                    control={form.control}
                    name="folder"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Lưu vào thư mục</FormLabel>
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
                                    {folders.map((folder) => (
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
                
                {selectedFolder === "new_folder" && (
                    <FormItem>
                        <FormLabel>Tên thư mục mới</FormLabel>
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


                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                    <ListPlus className="mr-2 h-4 w-4" />
                    )}
                    Thêm từ
                </Button>
            </form>
            </Form>
            </CardContent>
        </Card>
        </div>
    );
}
