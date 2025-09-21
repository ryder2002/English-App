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
import { Card, CardContent } from "./ui/card";
import { Folder, MoreVertical, PlusCircle, Trash2, Edit, Loader2, Share2, Users } from "lucide-react";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import type { Folder as FolderType } from "@/lib/types";
import { ShareFolderForm } from "./share-folder-form";


const formSchema = z.object({
  folderName: z.string().min(1, { message: "Tên thư mục không được để trống." }),
});

type FolderFormValues = z.infer<typeof formSchema>;

export function FolderManager() {
  const { folders, addFolder, updateFolder, removeFolder, vocabulary } = useVocabulary();
  const { user } = useAuth();
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [sharingFolder, setSharingFolder] = useState<FolderType | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const form = useForm<FolderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { folderName: "" },
  });
  
  const editForm = useForm<FolderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { folderName: "" },
  });

  const onAddSubmit = async (values: FolderFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
        const newFolder = await addFolder(values.folderName);
        if(newFolder) {
          form.reset();
          setIsAdding(false);
        }
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const onEditSubmit = async (folderId: string, values: FolderFormValues) => {
    setIsSubmitting(true);
    try {
        const success = await updateFolder(folderId, values.folderName);
        if (success) {
          setEditingFolder(null);
          editForm.reset();
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  const startEditing = (folder: FolderType) => {
    setEditingFolder(folder);
    editForm.setValue("folderName", folder.name);
  };

  const startSharing = (folder: FolderType) => {
    setSharingFolder(folder);
    setIsShareDialogOpen(true);
  }
  
  const cancelEditing = () => {
    setEditingFolder(null);
    editForm.reset();
  }

  const wordsInFolder = (folderId: string) => {
    return vocabulary.filter(item => item.folderId === folderId).length;
  }
  
  const handleRemoveFolder = async (folder: FolderType) => {
      if (!user) return;
      setIsSubmitting(true);
      try {
          await removeFolder(folder.id, folder.name);
      } finally {
        setIsSubmitting(false);
      }
  }

  const sortedFolders = [...folders].sort((a, b) => a.name.localeCompare(b.name));

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

        {folders.length === 0 && (
             <p className="text-center text-muted-foreground p-4">Bạn chưa có thư mục nào.</p>
        )}
        <div className="space-y-2">
        {sortedFolders.map((folder) => (
            editingFolder?.id === folder.id ? (
                <Card key={folder.id}>
                    <CardContent className="p-4">
                        <Form {...editForm}>
                            <form onSubmit={editForm.handleSubmit((values) => onEditSubmit(folder.id, values))} className="flex items-center gap-2">
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
            <Card key={folder.id} className="transition-all hover:bg-muted/50">
                <CardContent className="p-0">
                    <div className="flex items-center justify-between p-3">
                         <Link href={`/folders/${encodeURIComponent(folder.name)}?id=${folder.id}`} className="flex-grow">
                            <div className="flex items-center gap-3">
                                {folder.members.length > 1 ? <Users className="h-5 w-5 text-primary" /> : <Folder className="h-5 w-5 text-primary" />}
                                <span className="font-medium">{folder.name}</span>
                                <Badge variant="secondary">{wordsInFolder(folder.id)}</Badge>
                                {folder.ownerId !== user?.uid && <Badge variant="outline">Được chia sẻ</Badge>}
                            </div>
                        </Link>
                        <div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" disabled={isSubmitting}>
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => startSharing(folder)}>
                                        <Share2 className="mr-2 h-4 w-4"/> Chia sẻ
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => startEditing(folder)} disabled={folder.ownerId !== user?.uid}>
                                        <Edit className="mr-2 h-4 w-4"/> Đổi tên
                                    </DropdownMenuItem>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" className="text-destructive hover:text-destructive w-full justify-start px-2 py-1.5 text-sm h-auto font-normal relative" disabled={isSubmitting || folder.ownerId !== user?.uid}>
                                                <Trash2 className="mr-2 h-4 w-4"/> Xóa
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Bạn có chắc không?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Thao tác này sẽ xóa thư mục và tất cả {wordsInFolder(folder.id)} từ trong đó. Hành động này không thể hoàn tác.
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
                    </div>
                </CardContent>
            </Card>
            )
        ))}
        </div>
         {sharingFolder && (
            <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Chia sẻ thư mục "{sharingFolder.name}"</DialogTitle>
                         <DialogDescription>
                            Mời người khác cùng xem và chỉnh sửa thư mục này.
                        </DialogDescription>
                    </DialogHeader>
                    <ShareFolderForm folder={sharingFolder} onInvitationSent={() => setIsShareDialogOpen(false)} />
                </DialogContent>
            </Dialog>
         )}
    </div>
  );
}
