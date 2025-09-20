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
import { Loader2, PlusCircle, Save, Trash2 } from "lucide-react";
import { useVocabulary } from "@/contexts/vocabulary-context";
import { useToast } from "@/hooks/use-toast";
import { getPronunciationAction } from "@/app/actions";
import type { Language } from "@/lib/types";

type SheetRow = {
  id: number;
  word: string;
  language: "english" | "chinese";
  pronunciation: string;
  pronunciationLoading: boolean;
  vietnameseTranslation: string;
  folder: string;
};

let nextId = 1;

export function ManualAddSheet() {
  const { addManyVocabularyItems, folders } = useVocabulary();
  const { toast } = useToast();
  const [rows, setRows] = useState<SheetRow[]>([
    {
      id: 0,
      word: "",
      language: "english",
      pronunciation: "",
      pronunciationLoading: false,
      vietnameseTranslation: "",
      folder: folders.includes("Cơ bản") ? "Cơ bản" : folders[0] || "",
    },
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const sortedFolders = [...folders].sort();

  useEffect(() => {
    // When folders load, if the default folder on the first row is empty, set it.
    if (folders.length > 0 && rows.length > 0 && !rows[0].folder) {
      const defaultFolder = folders.includes("Cơ bản") ? "Cơ bản" : folders[0];
      setRows(prevRows =>
        prevRows.map((row, index) => (index === 0 ? { ...row, folder: defaultFolder } : row))
      );
    }
  }, [folders, rows]);


  const handleInputChange = (
    index: number,
    field: keyof SheetRow,
    value: string
  ) => {
    const newRows = [...rows];
    (newRows[index] as any)[field] = value;
    setRows(newRows);
  };

  const handleWordBlur = async (index: number) => {
    const row = rows[index];
    if (!row.word || (row.language !== 'english' && row.language !== 'chinese')) return;

    handleInputChange(index, "pronunciationLoading", "true"); // It's a string from HTML
    const pronunciation = await getPronunciationAction(row.word, row.language);
    
    const newRows = [...rows];
    newRows[index].pronunciation = pronunciation || "";
    newRows[index].pronunciationLoading = false;
    setRows(newRows);
  };

  const addRow = () => {
    const lastRow = rows[rows.length - 1];
    setRows([
      ...rows,
      {
        id: nextId++,
        word: "",
        language: lastRow?.language || "english",
        pronunciation: "",
        pronunciationLoading: false,
        vietnameseTranslation: "",
        folder: lastRow?.folder || (folders.includes("Cơ bản") ? "Cơ bản" : folders[0] || ""),
      },
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
        
        // We can save all to the same folder for simplicity, or group by folder
        // For now, let's just do a simple batch add. The context will handle folder creation.
        // This assumes addMany can handle items for different folders, which it can't right now.
        // Let's group them first.
        
        const groupedByFolder: Record<string, typeof itemsToSave> = {};
        for(const item of itemsToSave) {
            if(!groupedByFolder[item.folder]) {
                groupedByFolder[item.folder] = [];
            }
            groupedByFolder[item.folder].push(item);
        }

        for (const folder in groupedByFolder) {
            await addManyVocabularyItems(groupedByFolder[folder], folder);
        }

        toast({
            title: "Lưu thành công!",
            description: `${validRows.length} từ đã được thêm vào từ vựng của bạn.`,
        });

        // Reset to a single blank row
        setRows([
            {
            id: nextId++,
            word: "",
            language: "english",
            pronunciation: "",
            pronunciationLoading: false,
            vietnameseTranslation: "",
            folder: folders.includes("Cơ bản") ? "Cơ bản" : folders[0] || "",
            },
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
        {value: 'chinese', label: 'Tiếng Trung'}
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
              <TableHead className="w-[200px]">Nghĩa tiếng Việt</TableHead>
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
                      handleInputChange(index, "language", value)
                      // Refetch pronunciation if word exists
                      if (rows[index].word) {
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
                  <div className="flex items-center">
                    {row.pronunciationLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Input
                        value={row.pronunciation}
                        readOnly
                        className="bg-muted/50 border-none"
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    value={row.vietnameseTranslation}
                    onChange={(e) =>
                      handleInputChange(index, "vietnameseTranslation", e.target.value)
                    }
                    placeholder="ví dụ: xin chào"
                    disabled={isSaving}
                  />
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
                      {sortedFolders.map((folder) => (
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
