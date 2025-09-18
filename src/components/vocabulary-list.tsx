
"use client";

import { useVocabulary } from "@/contexts/vocabulary-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/button";
import { Folder, MoreVertical, Trash2, Edit, Loader2 } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import type { VocabularyItem } from "@/lib/types";
import { useMemo, useState } from "react";
import { SaveVocabularyDialog } from "./save-vocabulary-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Skeleton } from "./ui/skeleton";

export function VocabularyList() {
  const { vocabulary, removeVocabularyItem, isDataReady } = useVocabulary();
  const isMobile = useIsMobile();
  const [itemToEdit, setItemToEdit] = useState<VocabularyItem | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  const handleEdit = (item: VocabularyItem) => {
    setItemToEdit(item);
    setIsSaveDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsSaveDialogOpen(open);
    if (!open) {
      setItemToEdit(null);
    }
  };


  const groupedVocabulary = useMemo(() => {
    return vocabulary.reduce((acc, item) => {
      const folder = item.folder || "Uncategorized";
      if (!acc[folder]) {
        acc[folder] = [];
      }
      acc[folder].push(item);
      return acc;
    }, {} as Record<string, VocabularyItem[]>);
  }, [vocabulary]);

  if (!isDataReady) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-12 w-1/3" />
            <div className="space-y-2">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        </div>
    )
  }

  if (vocabulary.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg bg-muted/50">
        <p className="text-muted-foreground">Your vocabulary list is empty.</p>
        <p className="text-sm text-muted-foreground">
          Click "Add Word" to start learning!
        </p>
      </div>
    );
  }

  const vocabularyContent = (
    <>
    <Accordion type="multiple" defaultValue={Object.keys(groupedVocabulary)} className="w-full">
      {Object.entries(groupedVocabulary).map(([folder, items]) => (
        <AccordionItem value={folder} key={folder}>
          <AccordionTrigger className="text-lg font-semibold font-headline hover:no-underline">
            <div className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-primary" />
              <span>{folder}</span>
              <Badge variant="secondary">{items.length}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            {isMobile ? (
              <div className="space-y-2 pt-2">
                {items.map((item) => (
                  <Card key={item.id} >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-base">{item.word}</h3>
                          <p className="text-primary font-medium">
                            {item.vietnameseTranslation}
                          </p>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem onClick={() => handleEdit(item)}>
                                    <Edit className="mr-2 h-4 w-4"/> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => removeVocabularyItem(item.id)} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4"/> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-2 text-sm space-y-1">
                        <Badge
                          variant={
                            item.language === "english"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {item.language}
                        </Badge>
                        {(item.ipa || item.pinyin) && (
                          <p className="text-muted-foreground">
                            {item.ipa || item.pinyin}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                 <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Word</TableHead>
                          <TableHead>Language</TableHead>
                          <TableHead>Pronunciation</TableHead>
                          <TableHead>Vietnamese</TableHead>
                          <TableHead className="text-right w-[100px]">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id} >
                            <TableCell className="font-medium">
                              {item.word}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  item.language === "english"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {item.language}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.ipa || item.pinyin}</TableCell>
                            <TableCell>{item.vietnameseTranslation}</TableCell>
                            <TableCell className="text-right">
                               <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenuItem onClick={() => handleEdit(item)}>
                                            <Edit className="mr-2 h-4 w-4"/> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => removeVocabularyItem(item.id)} className="text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4"/> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                 </CardContent>
              </Card>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
    <SaveVocabularyDialog 
        open={isSaveDialogOpen}
        onOpenChange={handleDialogChange}
        itemToEdit={itemToEdit}
    />
    </>
  );

  return vocabularyContent;
}
