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
import { Folder as FolderIcon, MoreVertical, PlusCircle, Trash2, Edit, Loader2, ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import Link from "next/link";
import type { Folder } from "@/lib/types";

const formSchema = z.object({
  folderName: z.string().min(1, { message: "Tên thư mục không được để trống." }),
});

type FolderFormValues = z.infer<typeof formSchema>;

interface FolderTreeNodeProps {
  folder: Folder;
  vocabulary: any[];
  onEdit: (folderId: string, currentName: string) => void;
  onDelete: (folderId: string, folderName: string) => void;
  onAddSubfolder: (parentId: string) => void;
  editingFolderId: string | null;
  editForm: any;
  isSubmitting: boolean;
  onSaveEdit: (folderId: string, values: FolderFormValues) => void;
  onCancelEdit: () => void;
  level?: number;
}

function FolderTreeNode({
  folder,
  vocabulary,
  onEdit,
  onDelete,
  onAddSubfolder,
  editingFolderId,
  editForm,
  isSubmitting,
  onSaveEdit,
  onCancelEdit,
  level = 0
}: FolderTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = folder.children && folder.children.length > 0;
  const wordsCount = vocabulary.filter(item => item.folder === folder.name).length;

  return (
    <div className="space-y-1">
      {editingFolderId === folder.id ? (
        <Card>
          <CardContent className="p-3" style={{ marginLeft: `${level * 24}px` }}>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit((values: FolderFormValues) => onSaveEdit(folder.id, values))} className="flex items-center gap-2">
                <FormField
                  control={editForm.control}
                  name="folderName"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormControl>
                        <Input autoFocus {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={onCancelEdit} disabled={isSubmitting}>
                  Hủy
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-3" style={{ marginLeft: `${level * 24}px` }}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-grow">
                {hasChildren && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                )}
                {!hasChildren && <div className="w-6" />}
                <Link href={`/folders/${encodeURIComponent(folder.name)}`} className="flex items-center gap-2 flex-grow hover:underline">
                  <FolderIcon className="h-5 w-5 text-primary" />
                  <span className="font-medium">{folder.name}</span>
                  {wordsCount > 0 && <Badge variant="secondary">{wordsCount}</Badge>}
                </Link>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onAddSubfolder(folder.id)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Thêm thư mục con
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(folder.id, folder.name)}>
                    <Edit className="mr-2 h-4 w-4" /> Đổi tên
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Xóa
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc chắn?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Thao tác này sẽ xóa vĩnh viễn thư mục &quot;{folder.name}&quot;, tất cả thư mục con và từ vựng bên trong.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(folder.id, folder.name)} className="bg-destructive text-destructive-foreground">
                          Xóa
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      )}
      
      {hasChildren && isExpanded && (
        <div className="space-y-1">
          {folder.children!.map((child) => (
            <FolderTreeNode
              key={child.id}
              folder={child}
              vocabulary={vocabulary}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSubfolder={onAddSubfolder}
              editingFolderId={editingFolderId}
              editForm={editForm}
              isSubmitting={isSubmitting}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderManagerWithHierarchy() {
  const { folderObjects, buildFolderTree, addFolder, updateFolder, removeFolder, vocabulary } = useVocabulary();
  const [addingToParentId, setAddingToParentId] = useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
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
    const success = await addFolder(values.folderName, addingToParentId);
    if (success) {
      form.reset();
      setAddingToParentId(null);
    }
    setIsSubmitting(false);
  };
  
  const onEditSubmit = async (folderId: string, values: FolderFormValues) => {
    setIsSubmitting(true);
    await updateFolder(folderId, values.folderName);
    setEditingFolderId(null);
    editForm.reset();
    setIsSubmitting(false);
  };

  const startEditing = (folderId: string, currentName: string) => {
    setEditingFolderId(folderId);
    editForm.setValue("folderName", currentName);
  };
  
  const cancelEditing = () => {
    setEditingFolderId(null);
    editForm.reset();
  };

  const handleDelete = async (folderId: string, folderName: string) => {
    await removeFolder(folderId);
  };

  const folderTree = buildFolderTree();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardContent className="p-4">
          {addingToParentId === null ? (
            <Button onClick={() => setAddingToParentId("root")} className="w-full" variant="outline" disabled={isSubmitting}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Tạo thư mục mới
            </Button>
          ) : addingToParentId === "root" ? (
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
                <Button type="button" variant="ghost" onClick={() => setAddingToParentId(null)} disabled={isSubmitting}>
                  Hủy
                </Button>
              </form>
            </Form>
          ) : null}
        </CardContent>
      </Card>

      {folderObjects.length === 0 && (
        <p className="text-center text-muted-foreground p-4">Bạn chưa có thư mục nào.</p>
      )}

      <div className="space-y-2">
        {folderTree.map((folder) => (
          <FolderTreeNode
            key={folder.id}
            folder={folder}
            vocabulary={vocabulary}
            onEdit={startEditing}
            onDelete={handleDelete}
            onAddSubfolder={(parentId) => {
              setAddingToParentId(parentId);
              form.reset();
            }}
            editingFolderId={editingFolderId}
            editForm={editForm}
            isSubmitting={isSubmitting}
            onSaveEdit={onEditSubmit}
            onCancelEdit={cancelEditing}
          />
        ))}
      </div>

      {addingToParentId && addingToParentId !== "root" && (
        <Card className="border-2 border-primary">
          <CardContent className="p-4">
            <div className="mb-2 text-sm text-muted-foreground">
              Thêm thư mục con vào: <span className="font-medium">
                {folderObjects.find(f => f.id === addingToParentId)?.name}
              </span>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onAddSubmit)} className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name="folderName"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormControl>
                        <Input autoFocus placeholder="Tên thư mục con..." {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Thêm"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setAddingToParentId(null)} disabled={isSubmitting}>
                  Hủy
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
