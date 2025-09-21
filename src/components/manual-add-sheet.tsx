"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, PlusCircle, Save, Sparkles, Trash2 } from "lucide-react";
import { useVocabulary } from "@/contexts/vocabulary-context";
import { useToast } from "@/hooks/use-toast";
import { getIpaAction, getPinyinAction, getVocabularyDetailsAction } from "@/app/actions";
import type { Language } from "@/lib/types";

type SheetRow = {
  id: number;
  word: string;
  language: "english" | "chinese" | "vietnamese";
  pronunciation: string;
  pronunciationLoading: boolean;
  vietnameseTranslation: string;
  translationLoading: boolean;
  folder: string;
};

let nextId = 1;

export function ManualAddSheet() {
  const { addManyVocabularyItems, folders } = useVocabulary();
  const { toast } = useToast();
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Initialize with one blank row, setting a default folder if available.
    if (folders.length > 0) {
      setRows([createBlankRow(folders[0])]);
    } else {
      setRows([createBlankRow("")]);
    }
  }, [folders]);

  const createBlankRow = (defaultFolder: string): SheetRow => ({
    id: nextId++,
    word: "",
    language: "english",
    pronunciation: "",
    pronunciationLoading: false,
    vietnameseTranslation: "",
    translationLoading: false,
    folder: defaultFolder,
  });


  const handleInputChange = (
    index: number,
    field: keyof SheetRow,
    value: any
  ) => {
    const newRows = [...rows];
    (newRows[index] as any)[field] = value;

    // When language changes to Vietnamese, clear pronunciation fields
    if (field === 'language' && value === 'vietnamese') {
        newRows[index].pronunciation = '';
        newRows[index].pronunciationLoading = false;
        newRows[index].vietnameseTranslation = newRows[index].word;
    }
    
    // If the word is cleared, clear the translation too
    if (field === 'word' && value === '') {
        newRows[index].vietnameseTranslation = '';
    }

    setRows(newRows);
  };

  const fetchPronunciation = async (index: number) => {
    const row = rows[index];
    if (!row.word || row.language === 'vietnamese') {
        handleInputChange(index, "pronunciationLoading", false);
        return;
    }

    handleInputChange(index, "pronunciationLoading", true);
    let pronunciation: string | undefined;

    try {
        if (row.language === 'english') {
            pronunciation = await getIpaAction(row.word);
        } else if (row.language === 'chinese') {
            pronunciation = await getPinyinAction(row.word);
        }
    } catch (error) {
        console.error("Pronunciation fetch error:", error);
    } finally {
        const newRows = [...rows];
        newRows[index].pronunciation = pronunciation || "";
        newRows[index].pronunciationLoading = false;
        setRows(newRows);
    }
  };

  const fetchTranslation = async (index: number) => {
      const row = rows[index];
      if (!row.word || row.language === 'vietnamese') {
          handleInputChange(index, "translationLoading", false);
          return;
      }
      
      handleInputChange(index, "translationLoading", true);
      try {
          const details = await getVocabularyDetailsAction(row.word, row.language, "vietnamese");
          if (details && details.translation) {
              handleInputChange(index, "vietnameseTranslation", details.translation);
          }
      } catch (error) {
          console.error("Translation fetch error", error);
      } finally {
          handleInputChange(index, "translationLoading", false);
      }
  };
  
  const handleWordBlur = async (index: number) => {
      await fetchPronunciation(index);
      await fetchTranslation(index);
  }

  const addRow = () => {
    const lastRow = rows[rows.length - 1];
    setRows([
      ...rows,
      createBlankRow(lastRow?.folder || (folders.length > 0 ? folders[0] : "")),
    ]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const validRows = rows.filter(
      (row) => row.word && row.vietnameseTranslation && row.folder
    );

    if (validRows.length === 0) {
      toast({
        variant: "destructive",
        title: "Không có gì để lưu",
        description: "Vui lòng điền ít nhất một hàng hoàn chỉnh.",
      });
      return;
    }

    setIsSaving(true);
    try {
        const itemsToSave = validRows.map(row => ({
            word: row.word,
            language: row.language as Language,
            vietnameseTranslation: row.vietnameseTranslation,
            folder: row.folder,
            ipa: row.language === 'english' ? row.pronunciation : undefined,
            pinyin: row.language === 'chinese' ? row.pronunciation : undefined,
        }));
        
        await addManyVocabularyItems(itemsToSave);

        toast({
            title: "Lưu thành công!",
            description: `${validRows.length} từ đã được thêm vào từ vựng của bạn.`,
        });

        // Reset to a single blank row
        setRows([
            createBlankRow(folders.length > 0 ? folders[0] : ""),
        ]);

    } catch (error) {
      console.error("Manual save error:", error);
      toast({
        variant: "destructive",
        title: "Ôi! Đã có lỗi xảy ra.",
        description: "Không thể lưu các từ của bạn. Vui lòng thử lại.",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
    const languageOptions = [
        {value: 'english', label: 'Tiếng Anh'},
        {value: 'chinese', label: 'Tiếng Trung'},
        {value: 'vietnamese', label: 'Tiếng Việt'},
    ]

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Từ vựng</TableHead>
              <TableHead className="w-[150px]">Ngôn ngữ</TableHead>
              <TableHead className="w-[180px]">Phát âm (AI)</TableHead>
              <TableHead className="w-[200px]">Nghĩa tiếng Việt (AI)</TableHead>
              <TableHead className="w-[180px]">Thư mục</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Input
                    value={row.word}
                    onChange={(e) => handleInputChange(index, "word", e.target.value)}
                    onBlur={() => handleWordBlur(index)}
                    placeholder="ví dụ: hello"
                    disabled={isSaving}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={row.language}
                    onValueChange={(value) => {
                      handleInputChange(index, "language", value);
                      const newRows = [...rows];
                      newRows[index].language = value as any;
                      setRows(newRows);
                       // Refetch pronunciation and translation if word exists
                      if (newRows[index].word) {
                         handleWordBlur(index);
                      }
                    }}
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                     <Input
                        value={row.pronunciation}
                        onChange={(e) => handleInputChange(index, "pronunciation", e.target.value)}
                        className="bg-muted/50"
                        placeholder={row.language === 'vietnamese' ? 'N/A' : '...'}
                        disabled={isSaving || row.pronunciationLoading}
                      />
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => fetchPronunciation(index)} 
                        disabled={isSaving || row.pronunciationLoading || !row.word || row.language === 'vietnamese'}
                        className="h-8 w-8"
                        aria-label="Tạo phát âm"
                    >
                        {row.pronunciationLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4" />}
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Input
                      value={row.vietnameseTranslation}
                      onChange={(e) =>
                        handleInputChange(index, "vietnameseTranslation", e.target.value)
                      }
                      placeholder="ví dụ: xin chào"
                      disabled={isSaving || row.translationLoading}
                    />
                     <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => fetchTranslation(index)} 
                        disabled={isSaving || row.translationLoading || !row.word || row.language === 'vietnamese'}
                        className="h-8 w-8"
                        aria-label="Tạo nghĩa"
                    >
                        {row.translationLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4" />}
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={row.folder}
                    onValueChange={(value) =>
                      handleInputChange(index, "folder", value)
                    }
                    disabled={isSaving || folders.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn thư mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {folders.map((folder) => (
                        <SelectItem key={folder} value={folder}>
                          {folder}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(index)}
                    disabled={rows.length <= 1 || isSaving}
                    aria-label="Remove row"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={addRow} disabled={isSaving}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Thêm hàng
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Lưu tất cả
        </Button>
      </div>
    </div>
  );
}
