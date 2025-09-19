
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
import { Edit, Loader2, MoreVertical, Trash2, Volume2 } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import type { VocabularyItem } from "@/lib/types";
import { useMemo, useState, useRef, useEffect } from "react";
import { SaveVocabularyDialog } from "./save-vocabulary-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface VocabularyFolderListProps {
    folderName: string;
}

export function VocabularyFolderList({ folderName }: VocabularyFolderListProps) {
  const { vocabulary, removeVocabularyItem } = useVocabulary();
  const isMobile = useIsMobile();
  const [itemToEdit, setItemToEdit] = useState<VocabularyItem | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const { toast } = useToast();
  const [audioState, setAudioState] = useState<{ id: string | null; status: 'playing' | 'loading' | 'idle' }>({ id: null, status: 'idle' });
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Cleanup speechSynthesis on component unmount
    return () => {
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
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

  const playAudio = async (e: React.MouseEvent, text: string, lang: string, id: string) => {
    e.stopPropagation();
    if (!('speechSynthesis' in window)) {
        toast({ variant: "destructive", title: "Lỗi", description: "Trình duyệt của bạn không hỗ trợ phát âm thanh." });
        return;
    }

    if (audioState.status === 'playing' && audioState.id === id) {
        speechSynthesis.cancel();
        setAudioState({ id: null, status: 'idle' });
        return;
    }
    
    // Stop any currently playing audio
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    const langMap = {
        english: 'en-US',
        chinese: 'zh-CN',
        vietnamese: 'vi-VN'
    };
    utterance.lang = langMap[lang as keyof typeof langMap] || 'en-US';

    utterance.onstart = () => {
        setAudioState({ id, status: 'playing' });
    };

    utterance.onend = () => {
        setAudioState({ id: null, status: 'idle' });
        utteranceRef.current = null;
    };
    
    utterance.onerror = () => {
        setAudioState({ id: null, status: 'idle' });
        toast({ variant: "destructive", title: "Lỗi phát âm", description: "Không thể phát âm thanh. Vui lòng thử lại." });
    };
    
    setAudioState({ id, status: 'loading' });
    speechSynthesis.speak(utterance);
  };


  const items = useMemo(() => {
    return vocabulary.filter(item => item.folder === folderName);
  }, [vocabulary, folderName]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg bg-card mt-6">
        <p className="text-muted-foreground">Thư mục này chưa có từ vựng nào.</p>
        <p className="text-sm text-muted-foreground">
          Hãy thêm từ mới vào thư mục này nhé!
        </p>
      </div>
    );
  }

  const languageMap = {
    english: 'Tiếng Anh',
    chinese: 'Tiếng Trung',
    vietnamese: 'Tiếng Việt',
  };

  return (
    <>
        <div className="mt-6">
            {isMobile ? (
              <div className="space-y-3 pt-2">
                {items.map((item) => (
                  <Card key={item.id} className="bg-card/80">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div onClick={() => handleEdit(item)} className="flex-grow cursor-pointer pr-2">
                          <h3 className="font-bold text-lg flex items-center gap-2">
                            {item.word}
                             <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={(e) => playAudio(e, item.word, item.language, item.id)} disabled={audioState.status === 'loading'}>
                                {(audioState.id === item.id && (audioState.status === 'loading' || audioState.status === 'playing')) ? <Loader2 className="h-4 w-4 animate-spin"/> : <Volume2 className="h-4 w-4"/>}
                            </Button>
                          </h3>
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
                                    <Edit className="mr-2 h-4 w-4"/> Sửa
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => removeVocabularyItem(item.id)} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4"/> Xóa
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
                          {languageMap[item.language]}
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
              <Card className="bg-card/80">
                 <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-[250px] pl-6">Từ</TableHead>
                          <TableHead>Ngôn ngữ</TableHead>
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
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={(e) => playAudio(e, item.word, item.language, item.id)} disabled={audioState.status === 'loading'}>
                                    {(audioState.id === item.id && (audioState.status === 'loading' || audioState.status === 'playing')) ? <Loader2 className="h-4 w-4 animate-spin"/> : <Volume2 className="h-4 w-4"/>}
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
        </div>
        <SaveVocabularyDialog 
            open={isSaveDialogOpen}
            onOpenChange={handleDialogChange}
            itemToEdit={itemToEdit}
        />
    </>
  );
}
