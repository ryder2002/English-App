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
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Folder, MoreVertical, Trash2, Edit, Loader2, Volume2 } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { useIsMobile } from "@/hooks/use-is-mobile";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import type { Language, VocabularyItem } from "@/lib/types";
import { useMemo, useState, useEffect, useRef } from "react";
import { SaveVocabularyDialog } from "./save-vocabulary-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Skeleton } from "./ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/settings-context";

export function VocabularyList() {
  const { vocabulary, removeVocabularyItem, isLoadingInitialData, folderObjects } = useVocabulary();
  const folders = folderObjects.map(f => f.name);
  const isMobile = useIsMobile();
  
  // CRITICAL: Only show vocabulary that belongs to folders owned by the user
  // Filter out vocabulary that references folders not owned by the user
  // This prevents admin folders from appearing in user's vocabulary list
  const userOwnedVocabulary = vocabulary.filter(item => {
    const folderName = item.folder || "";
    // Allow vocabulary with empty folder or folder name in user's folderObjects
    return !folderName || folders.includes(folderName);
  });
  const [itemToEdit, setItemToEdit] = useState<VocabularyItem | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const { toast } = useToast();
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const { selectedVoices } = useSettings();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Cleanup: stop speech synthesis on component unmount
    return () => {
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      window.speechSynthesis.cancel();
    };
  }, []);


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

  const playAudio = (e: React.MouseEvent, item: VocabularyItem) => {
    e.stopPropagation(); 
    if (speakingId === item.id) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
        return;
    }
    
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(item.word);
    utteranceRef.current = utterance;
    
    const langCodeMap: Record<Language, string> = {
        english: 'en-US',
        chinese: 'zh-CN',
        vietnamese: 'vi-VN',
    };
    utterance.lang = langCodeMap[item.language];
    
    const voiceURI = selectedVoices[item.language];
    if (voiceURI) {
        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find(v => v.voiceURI === voiceURI);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
    }

    utterance.onstart = () => setSpeakingId(item.id);
    utterance.onend = () => {
        setSpeakingId(null);
        utteranceRef.current = null;
    };
    utterance.onerror = (event) => {
        console.error("SpeechSynthesis Error", event);
        setSpeakingId(null);
        utteranceRef.current = null;
    };
    
    const speak = () => {
      if (window.speechSynthesis.speaking) {
        setTimeout(speak, 100);
      } else {
        window.speechSynthesis.speak(utterance);
      }
    };
    speak();
  };


  const groupedVocabulary = useMemo(() => {
    return userOwnedVocabulary.reduce((acc, item) => {
      const folderName = item.folder || "Chưa phân loại";
      if (!acc[folderName]) {
        acc[folderName] = [];
      }
      acc[folderName].push(item);
      return acc;
    }, {} as Record<string, VocabularyItem[]>);
  }, [userOwnedVocabulary]);

  if (isLoadingInitialData) {
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

  if (userOwnedVocabulary.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg bg-card">
        <p className="text-muted-foreground">Danh sách từ vựng của bạn trống.</p>
        <p className="text-sm text-muted-foreground">
          Nhấn "Thêm từ" để bắt đầu học!
        </p>
      </div>
    );
  }

  const languageMap = {
    english: 'Tiếng Anh',
    chinese: 'Tiếng Trung',
    vietnamese: 'Tiếng Việt',
  };

  const sortedFolders = Object.entries(groupedVocabulary).sort(([folderA], [folderB]) => folderA.localeCompare(folderB));

  return (
    <>
    <Accordion type="multiple" defaultValue={folders} className="w-full">
      {sortedFolders.map(([folderName, items]) => (
        <AccordionItem value={folderName} key={folderName} className="border-b-0">
          <AccordionTrigger className="text-lg font-semibold font-headline hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <Folder className="h-6 w-6 text-primary" />
              <span>{folderName}</span>
              <Badge variant="secondary">{items.length}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            {isMobile ? (
              <div className="space-y-2 sm:space-y-3 pt-2">
                {items.map((item) => (
                  <Card key={item.id} className="bg-card/80 hover:shadow-md transition-shadow">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex justify-between items-start gap-2">
                        <div onClick={() => handleEdit(item)} className="flex-grow cursor-pointer min-w-0">
                          <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 mb-1">
                            <span className="truncate">{item.word}</span>
                                <Button size="icon" variant="ghost" className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground flex-shrink-0" onClick={(e) => playAudio(e, item)}>
                                    {speakingId === item.id ? <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin"/> : <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4"/>}
                                </Button>
                          </h3>
                          <p className="text-primary font-medium text-sm sm:text-base line-clamp-2">
                            {item.vietnameseTranslation}
                          </p>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem onClick={() => handleEdit(item)}>
                                    <Edit className="mr-2 h-4 w-4"/> Sửa
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => removeVocabularyItem(item.id)} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4"/> Xóa
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-2 text-xs sm:text-sm space-y-1.5">
                        <p className="text-muted-foreground flex flex-wrap items-center gap-1.5">
                            {item.partOfSpeech && <span className="font-mono text-[10px] sm:text-xs px-1.5 py-0.5 rounded-sm bg-muted">{item.partOfSpeech}</span>}
                            <span className="truncate">{item.ipa || item.pinyin}</span>
                        </p>
                        <Badge
                          variant={
                            item.language === "english"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {languageMap[item.language]}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-card/80">
                 <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-[250px] pl-6">Từ</TableHead>
                          <TableHead>Ngôn ngữ</TableHead>
                          <TableHead>Từ loại</TableHead>
                          <TableHead>Phát âm</TableHead>
                          <TableHead>Tiếng Việt</TableHead>
                          <TableHead className="text-right w-[100px] pr-6">
                            Hành động
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id} onClick={() => handleEdit(item)} className="cursor-pointer">
                            <TableCell className="font-medium pl-6">
                              <div className="flex items-center gap-2">
                                <span>{item.word}</span>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={(e) => playAudio(e, item)}>
                                        {speakingId === item.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Volume2 className="h-4 w-4"/>}
                                    </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  item.language === "english"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {languageMap[item.language]}
                              </Badge>
                            </TableCell>
                            <TableCell><span className="font-mono text-xs px-1.5 py-0.5 rounded-sm">{item.partOfSpeech}</span></TableCell>
                            <TableCell>{item.ipa || item.pinyin}</TableCell>
                            <TableCell>{item.vietnameseTranslation}</TableCell>
                            <TableCell className="text-right pr-4">
                               <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenuItem onClick={() => handleEdit(item)}>
                                            <Edit className="mr-2 h-4 w-4"/> Sửa
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => removeVocabularyItem(item.id)} className="text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4"/> Xóa
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
}

