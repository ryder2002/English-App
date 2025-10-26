"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
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
import { getVocabularyDetailsAction } from "@/app/actions";
import type { Language } from "@/lib/types";
import { Textarea } from "./ui/textarea";
import { parseWordWithDefinition } from "@/lib/parse-word-with-definition";

type SheetRow = {
  id: number;
  word: string;
  language: "english" | "chinese" | "vietnamese";
  pronunciation: string;
  pronunciationLoading: boolean;
  partOfSpeech: string;
  partOfSpeechLoading: boolean;
  vietnameseTranslation: string;
  translationLoading: boolean;
  folder: string;
  hasCustomDefinition?: boolean; // Track if user provided custom definition
};

let nextId = 1;

export function ManualAddTable() {
  const { addVocabularyItem, folderObjects } = useVocabulary();
  const folders = folderObjects.map(f => f.name);
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const createBlankRow = (defaultFolder: string): SheetRow => ({
    id: nextId++,
    word: "",
    language: "english",
    pronunciation: "",
    pronunciationLoading: false,
    partOfSpeech: "",
    partOfSpeechLoading: false,
    vietnameseTranslation: "",
    translationLoading: false,
    folder: defaultFolder,
  });

  const [rows, setRows] = useState<SheetRow[]>(() => [
    createBlankRow(folderObjects.length > 0 ? folderObjects[0].name : "")
  ]);

  useEffect(() => {
    // Update the default folder in the initial blank row once folders are loaded.
    if (rows.length === 1 && rows[0].word === '' && folders.length > 0 && rows[0].folder === '') {
      setRows(currentRows => {
        const updatedRows = [...currentRows];
        updatedRows[0].folder = folders[0];
        return updatedRows;
      });
    }
  }, [folders]);

  const prevRowsRef = useRef<SheetRow[]>(rows);

  useEffect(() => {
    // Compare the current rows with the previous rows to detect language changes
    rows.forEach((currentRow, index) => {
      const prevRow = prevRowsRef.current[index];
      
      // If a language was selected for a row that has a word, fetch details
      if (prevRow && currentRow.language !== prevRow.language && currentRow.word) {
        fetchDetails(index);
      }
    });

    // Update the ref for the next render
    prevRowsRef.current = rows;
  }, [rows]);


  const handleInputChange = (
    index: number,
    field: keyof SheetRow,
    value: any
  ) => {
    const newRows = [...rows];
    
    // Special handling for word field - parse for synonyms
    if (field === 'word') {
      const parsed = parseWordWithDefinition(value);
      newRows[index].word = parsed.word;
      
      // Synonym is just additional context, not a replacement for translation
      // We still want AI to generate Vietnamese meaning
      if (parsed.synonyms && parsed.synonyms.length > 0) {
        newRows[index].hasCustomDefinition = true; // Mark that we have synonym context
      } else {
        if (value === '') {
          newRows[index].vietnameseTranslation = '';
          newRows[index].partOfSpeech = '';
          newRows[index].pronunciation = '';
        }
        newRows[index].hasCustomDefinition = false;
      }
    } else {
      (newRows[index] as any)[field] = value;
    }

    // When language changes, clear related fields
    if (field === 'language') {
        newRows[index].pronunciation = '';
        newRows[index].partOfSpeech = '';
        if (value === 'vietnamese') {
            newRows[index].vietnameseTranslation = newRows[index].word;
        } else {
             // Clear translation to trigger refetch
             if(newRows[index].word) {
               newRows[index].vietnameseTranslation = '';
             }
        }
    }

    setRows(newRows);
  };

  const fetchDetails = async (index: number) => {
      const row = rows[index];
      
      // Skip fetching if word is empty or language is Vietnamese
      if (!row.word || row.language === 'vietnamese') {
          const newRows = [...rows];
          newRows[index].translationLoading = false;
          newRows[index].partOfSpeechLoading = false;
          newRows[index].pronunciationLoading = false;
          if (row.language === 'vietnamese') {
            newRows[index].vietnameseTranslation = row.word;
          }
          setRows(newRows);
          return;
      }
      
      let newRows = [...rows];
      newRows[index].translationLoading = true;
      newRows[index].partOfSpeechLoading = true;
      newRows[index].pronunciationLoading = true;
      setRows(newRows);
      
      try {
          const details = await getVocabularyDetailsAction(row.word, row.language, "vietnamese");
          
          setRows(currentRows => {
            const updatedRows = [...currentRows];
            const targetRow = updatedRows[index];

            if (details && Object.keys(details).length > 0) {
                targetRow.vietnameseTranslation = details.translation || targetRow.vietnameseTranslation;
                targetRow.partOfSpeech = details.partOfSpeech || targetRow.partOfSpeech;
                targetRow.pronunciation = details.ipa || details.pinyin || targetRow.pronunciation;
            } else {
                 console.warn(`No details found for "${row.word}"`);
            }
            targetRow.translationLoading = false;
            targetRow.partOfSpeechLoading = false;
            targetRow.pronunciationLoading = false;
            return updatedRows;
        });

      } catch (error) {
            console.error("Details fetch error for word:", row.word, error);
            const errorMessage = `Từ "${row.word}" không hợp lệ hoặc không tìm thấy. Vui lòng kiểm tra lại chính tả.`;
            toast({ variant: 'destructive', title: 'Lỗi', description: errorMessage });
            
            setRows(currentRows => {
                const finalRows = [...currentRows];
                finalRows[index].translationLoading = false;
                finalRows[index].partOfSpeechLoading = false;
                finalRows[index].pronunciationLoading = false;
                return finalRows;
            });
      }
  };
  
  const handleWordBlur = async (index: number) => {
      await fetchDetails(index);
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
            partOfSpeech: row.partOfSpeech,
            folder: row.folder,
            ipa: row.language === 'english' ? row.pronunciation : undefined,
            pinyin: row.language === 'chinese' ? row.pronunciation : undefined,
        }));
        // Lưu từng từ bằng Promise.all
        await Promise.all(itemsToSave.map(item => addVocabularyItem(item)));

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

    const anyLoading = rows.some(r => r.pronunciationLoading || r.translationLoading || r.partOfSpeechLoading);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Từ vựng</TableHead>
              <TableHead className="w-[150px]">Ngôn ngữ</TableHead>
              <TableHead className="min-w-[150px]">Phát âm (AI)</TableHead>
              <TableHead className="min-w-[200px]">Nghĩa tiếng Việt (AI)</TableHead>
              <TableHead className="min-w-[150px]">Từ loại (AI)</TableHead>
              <TableHead className="w-[200px]">Thư mục</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Textarea
                    value={row.word}
                    onChange={(e) => handleInputChange(index, "word", e.target.value)}
                    onBlur={() => handleWordBlur(index)}
                    placeholder="ví dụ: hello"
                    disabled={isSaving}
                    className="text-base min-h-[80px]"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={row.language}
                    onValueChange={(value) => handleInputChange(index, "language", value)}
                    disabled={isSaving}
                  >
                    <SelectTrigger className="text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.map(opt => <SelectItem key={opt.value} value={opt.value} className="text-base">{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                     <Textarea
                        value={row.pronunciation}
                        onChange={(e) => handleInputChange(index, "pronunciation", e.target.value)}
                        className="bg-muted/50 text-base min-h-[80px]"
                        placeholder={row.language === 'vietnamese' ? 'N/A' : (row.pronunciationLoading ? '...' : '')}
                        disabled={isSaving || row.pronunciationLoading}
                      />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Textarea
                      value={row.vietnameseTranslation}
                      onChange={(e) =>
                        handleInputChange(index, "vietnameseTranslation", e.target.value)
                      }
                      placeholder={row.translationLoading ? '...' : "Nghĩa thủ công hoặc để AI điền"}
                      disabled={isSaving || row.translationLoading}
                      className="text-base min-h-[80px]"
                    />
                  </div>
                </TableCell>
                <TableCell>
                   <div className="flex items-center gap-2">
                    <Textarea
                      value={row.partOfSpeech}
                      onChange={(e) =>
                        handleInputChange(index, "partOfSpeech", e.target.value)
                      }
                      placeholder={row.partOfSpeechLoading ? '...' : "ví dụ: N, V, Adj"}
                      disabled={isSaving || row.partOfSpeechLoading}
                      className="text-base min-h-[80px]"
                    />
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
                    <SelectTrigger className="text-base">
                      <SelectValue placeholder="Chọn thư mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {folders.map((folder) => (
                        <SelectItem key={folder} value={folder} className="text-base">
                          {folder}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-center gap-2">
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => fetchDetails(index)} 
                        disabled={isSaving || anyLoading || !row.word || row.language === 'vietnamese'}
                        className="h-9 w-9 shrink-0"
                        aria-label="Tạo tất cả chi tiết"
                        title="Tạo tất cả chi tiết"
                    >
                        { (row.translationLoading || row.partOfSpeechLoading || row.pronunciationLoading) 
                            ? <Loader2 className="h-5 w-5 animate-spin"/> 
                            : <Sparkles className="h-5 w-5" />
                        }
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(index)}
                      disabled={rows.length <= 1 || isSaving}
                      aria-label="Xóa hàng"
                      title="Xóa hàng"
                    >
                      <Trash2 className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={addRow} disabled={isSaving}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Thêm hàng
        </Button>
        <Button onClick={handleSave} disabled={isSaving || anyLoading}>
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
