
"use client";

import { useVocabulary } from "@/contexts/vocabulary-context";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "./ui/card";
import { Folder, MoreVertical, PlusCircle, Trash2, Edit, Loader2 } from "lucide-react";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";

const formSchema = z.object({
  folderName: z.string().min(1, { message: "Tên thư mục không được để trống." }),
});

type FolderFormValues = z.infer<typeof formSchema>;

export function FolderManager() {
  const { folders, addFolder, updateFolder, removeFolder, isLoadingInitialData, vocabulary } = useVocabulary();
  const { toast } = useToast();
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FolderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { folderName: "" },
  });
  
  const editForm = useForm<FolderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { folderName: "" },
  });

  const onAddSubmit = async (values: FolderFormValues) => {
    setIsSubmitting(true);
    try {
        const success = await addFolder(values.folderName);
        if(success) {
          form.reset();
          setIsAdding(false);
        }
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const onEditSubmit = async (oldName: string, values: FolderFormValues) => {
    setIsSubmitting(true);
    try {
        const success = await updateFolder(oldName, values.folderName);
        if (success) {
          setEditingFolder(null);
          editForm.reset();
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  const startEditing = (name: string) => {
    setEditingFolder(name);
    editForm.setValue("folderName", name);
  };
  
  const cancelEditing = () => {
    setEditingFolder(null);
    editForm.reset();
  }

  const wordsInFolder = (folderName: string) => {
    return vocabulary.filter(item => item.folder === folderName).length;
  }
  
  const handleRemoveFolder = async (folder: string) => {
      setIsSubmitting(true);
      try {
          await removeFolder(folder);
          toast({
              variant: "default",
              title: "Đã xóa thư mục",
              description: `Thư mục "${folder}" và nội dung của nó đã được xóa.`,
          });
      } finally {
        setIsSubmitting(false);
      }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
       <Card>
        <CardContent className="p-4">
            {!isAdding ? (
                 <Button onClick={() => setIsAdding(true)} className="w-full" variant="outline" disabled={isSubmitting}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Tạo thư mục mới
                </Button>
            ) : (
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onAddSubmit)} className="flex items-center gap-2">
                        <FormField
                        control={form.control}
                        name="folderName"
                        render={({ field }) => (
                            <FormItem className="flex-grow">
                                <FormControl>
                                    <Input autoFocus placeholder="Tên thư mục mới..." {...field} disabled={isSubmitting} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Thêm"}
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} disabled={isSubmitting}>Hủy</Button>
                    </form>
                </Form>
            )}
        </CardContent>
       </Card>

        {isLoadingInitialData ? (
            <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        ) : (
          <div className="space-y-2">
            {folders.length === 0 && !isLoadingInitialData && (
                 <p className="text-center text-muted-foreground p-4">Bạn chưa có thư mục nào.</p>
            )}
            {folders.map((folder) => (
                editingFolder === folder ? (
                    <Card key={folder}>
                        <CardContent className="p-4">
                            <Form {...editForm}>
                                <form onSubmit={editForm.handleSubmit((values) => onEditSubmit(folder, values))} className="flex items-center gap-2">
                                    <FormField
                                    control={editForm.control}
                                    name="folderName"
                                    render={({ field }) => (
                                        <FormItem className="flex-grow">
                                            <FormControl>
                                                <Input autoFocus {...field} disabled={isSubmitting}/>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                    <Button type="submit" disabled={isSubmitting}>
                                         {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu"}
                                    </Button>
                                    <Button type="button" variant="ghost" onClick={cancelEditing} disabled={isSubmitting}>Hủy</Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                ) : (
                <Card key={folder}>
                    <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Folder className="h-5 w-5 text-primary" />
                        <span className="font-medium">{folder}</span>
                        <Badge variant="secondary">{wordsInFolder(folder)}</Badge>
                    </div>
                    <div>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={isSubmitting}>
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => startEditing(folder)} disabled={isSubmitting}>
                                    <Edit className="mr-2 h-4 w-4"/> Đổi tên
                                </DropdownMenuItem>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" className="text-destructive hover:text-destructive w-full justify-start px-2 py-1.5 text-sm h-auto font-normal relative" disabled={isSubmitting}>
                                             <Trash2 className="mr-2 h-4 w-4"/> Xóa
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Bạn có chắc không?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Thao tác này sẽ xóa thư mục và tất cả {wordsInFolder(folder)} từ trong đó. Hành động này không thể hoàn tác.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleRemoveFolder(folder)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Xóa"}
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    </CardContent>
                </Card>
                )
            ))}
          </div>
        )}
    </div>
  );
}
