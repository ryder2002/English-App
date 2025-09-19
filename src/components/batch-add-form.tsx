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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";

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
    const { addManyVocabularyItems, folders } = useVocabulary();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);

    const sortedFolders = [...folders].sort();

    const form = useForm<BatchAddFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            words: "",
            sourceLanguage: "english",
            targetLanguage: "vietnamese",
            folder: folders.includes("Cơ bản") ? "Cơ bản" : folders[0] || "",
        },
    });

     useEffect(() => {
        if (folders.length > 0 && !form.getValues("folder")) {
            form.setValue("folder", folders.includes("Cơ bản") ? "Cơ bản" : folders[0]);
        }
    }, [folders, form]);


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

            const newItems = await batchAddVocabularyAction({
                words: wordsArray,
                sourceLanguage: values.sourceLanguage,
                targetLanguage: values.targetLanguage,
                folder: values.folder,
            });

            await addManyVocabularyItems(newItems, values.folder);

            toast({
                title: "Thêm thành công!",
                description: `${newItems.length} từ đã được thêm vào thư mục "${values.folder}".`,
            });
            form.reset({
                ...values,
                words: ""
            });

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
                        <FormItem className="flex flex-col">
                        <FormLabel>Lưu vào thư mục</FormLabel>
                        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant="outline"
                                role="combobox"
                                disabled={isSubmitting || folders.length === 0}
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
                                <CommandEmpty>Không tìm thấy. Nhấn Enter để tạo mới.</CommandEmpty>
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
