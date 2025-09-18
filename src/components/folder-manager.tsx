
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
  FormLabel,
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

const formSchema = z.object({
  folderName: z.string().min(1, { message: "Folder name cannot be empty." }),
});

type FolderFormValues = z.infer<typeof formSchema>;

export function FolderManager() {
  const { folders, addFolder, updateFolder, removeFolder, vocabulary, isLoading } = useVocabulary();
  const { toast } = useToast();
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const form = useForm<FolderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      folderName: "",
    },
  });

  const onAddSubmit = async (values: FolderFormValues) => {
    if (folders.find(f => f.toLowerCase() === values.folderName.toLowerCase())) {
        form.setError("folderName", { message: "Folder already exists." });
        return;
    }
    await addFolder(values.folderName);
    toast({ title: `Folder "${values.folderName}" created.` });
    form.reset();
    setIsAdding(false);
  };
  
  const onEditSubmit = async (oldName: string, values: FolderFormValues) => {
    if (folders.find(f => f.toLowerCase() === values.folderName.toLowerCase() && f.toLowerCase() !== oldName.toLowerCase())) {
        form.setError("folderName", { message: "Folder name already in use." });
        return;
    }
    await updateFolder(oldName, values.folderName);
    toast({ title: `Folder "${oldName}" renamed to "${values.folderName}".` });
    setEditingFolder(null);
    form.reset();
  };

  const startEditing = (name: string) => {
    setEditingFolder(name);
    form.setValue("folderName", name);
  };
  
  const cancelEditing = () => {
    setEditingFolder(null);
    form.reset();
  }

  const wordsInFolder = (folderName: string) => {
    return vocabulary.filter(item => item.folder === folderName).length;
  }
  
  const handleRemoveFolder = async (folder: string) => {
      try {
          await removeFolder(folder);
          toast({
              variant: "default",
              title: "Folder deleted",
              description: `Folder "${folder}" and its contents have been deleted.`,
          });
      } catch (error) {
          toast({
              variant: "destructive",
              title: "Error deleting folder",
          });
      }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
       <Card>
        <CardContent className="p-4">
            {isAdding ? (
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onAddSubmit)} className="flex items-center gap-2">
                        <FormField
                        control={form.control}
                        name="folderName"
                        render={({ field }) => (
                            <FormItem className="flex-grow">
                                <FormControl>
                                    <Input placeholder="New folder name..." {...field} disabled={isLoading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} disabled={isLoading}>Cancel</Button>
                    </form>
                </Form>
            ) : (
                <Button onClick={() => setIsAdding(true)} className="w-full" variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Folder
                </Button>
            )}
        </CardContent>
       </Card>
      
      <div className="space-y-2">
        {folders.map((folder) => (
            editingFolder === folder ? (
                <Card key={folder}>
                    <CardContent className="p-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit((values) => onEditSubmit(folder, values))} className="flex items-center gap-2">
                                <FormField
                                control={form.control}
                                name="folderName"
                                render={({ field }) => (
                                    <FormItem className="flex-grow">
                                        <FormControl>
                                            <Input {...field} disabled={isLoading}/>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <Button type="submit" disabled={isLoading}>
                                     {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                                </Button>
                                <Button type="button" variant="ghost" onClick={cancelEditing} disabled={isLoading}>Cancel</Button>
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
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => startEditing(folder)}>
                                <Edit className="mr-2 h-4 w-4"/> Rename
                            </DropdownMenuItem>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" className="text-destructive hover:text-destructive w-full justify-start px-2 py-1.5 text-sm h-auto font-normal relative">
                                         <Trash2 className="mr-2 h-4 w-4"/> Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will delete the folder and all {wordsInFolder(folder)} words inside it. This action cannot be undone.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleRemoveFolder(folder)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        Delete
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
    </div>
  );
}

