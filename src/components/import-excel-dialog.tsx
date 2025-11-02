"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useVocabulary } from "@/contexts/vocabulary-context";
import { FolderSelectItems } from "@/components/folder-select-items";
import { Loader2, Upload, FileSpreadsheet, AlertCircle, Download } from "lucide-react";
import type { Language } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  file: z.instanceof(File).refine((file) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return validExtensions.includes(extension);
  }, "Vui lòng chọn file Excel (.xlsx, .xls) hoặc CSV"),
  folder: z.string().min(1, { message: "Thư mục không được để trống." }),
});

type ImportExcelFormValues = z.infer<typeof formSchema>;

interface ExcelRow {
  word: string;
  language: string;
  partOfSpeech?: string;
  pronunciation?: string;
  vietnameseTranslation: string;
}

interface ImportExcelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportExcelDialog({
  open,
  onOpenChange,
}: ImportExcelDialogProps) {
  const { addVocabularyItem, folderObjects, buildFolderTree, addFolder } = useVocabulary();
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [errorRows, setErrorRows] = useState<Array<{ row: number; error: string }>>([]);
  const [newFolderName, setNewFolderName] = useState("");

  const folderTree = buildFolderTree ? buildFolderTree() : [];
  
  // Memoize default folder to prevent infinite loops - use folderObjects directly instead of folderTree
  const defaultFolderName = useMemo(() => {
    if (folderObjects && folderObjects.length > 0) {
      // Find first folder without parent (root folder)
      const rootFolder = folderObjects.find(f => !f.parentId) || folderObjects[0];
      return rootFolder?.name || "";
    }
    return "";
  }, [folderObjects]);

  const form = useForm<ImportExcelFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      file: undefined as any,
      folder: "",
    },
  });
  
  // Update form when dialog opens - only set default folder once when opening
  useEffect(() => {
    if (open && defaultFolderName && !form.getValues("folder")) {
      form.setValue("folder", defaultFolderName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectedFolder = form.watch("folder");

  const parseExcelFile = async (file: File): Promise<ExcelRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          // Expect header row: Từ, ngôn ngữ, từ loại, phát âm, tiếng việt
          if (jsonData.length === 0) {
            reject(new Error("File Excel trống hoặc không có dữ liệu."));
            return;
          }

          // Skip header row and parse data
          const rows: ExcelRow[] = [];
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;
            
            const word = String(row[0] || "").trim();
            const language = String(row[1] || "").trim().toLowerCase();
            const partOfSpeech = row[2] ? String(row[2]).trim() : undefined;
            const pronunciation = row[3] ? String(row[3]).trim() : undefined;
            const vietnameseTranslation = String(row[4] || "").trim();
            
            // Skip empty rows
            if (!word && !vietnameseTranslation) continue;
            
            rows.push({
              word,
              language,
              partOfSpeech,
              pronunciation,
              vietnameseTranslation,
            });
          }
          
          resolve(rows);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error("Không thể đọc file."));
      reader.readAsBinaryString(file);
    });
  };

  const downloadTemplate = () => {
    // Create template data
    const templateData = [
      ['Từ', 'Ngôn ngữ', 'Từ loại', 'Phát âm', 'Tiếng Việt'],
      ['hello', 'english', 'noun', '/həˈloʊ/', 'xin chào'],
      ['你好', 'chinese', 'pronoun', 'nǐ hǎo', 'xin chào'],
      ['world', 'english', 'noun', '/wɜːrld/', 'thế giới'],
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // Từ
      { wch: 12 }, // Ngôn ngữ
      { wch: 12 }, // Từ loại
      { wch: 18 }, // Phát âm
      { wch: 20 }, // Tiếng Việt
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    
    // Download file
    XLSX.writeFile(wb, 'template_tu_vung.xlsx');
    
    toast({
      title: "Đã tải template",
      description: "File template_tu_vung.xlsx đã được tải xuống.",
    });
  };

  const normalizeLanguage = (lang: string): Language => {
    const normalized = lang.toLowerCase().trim();
    if (normalized.includes('english') || normalized.includes('tiếng anh') || normalized === 'en' || normalized === 'english') {
      return 'english';
    }
    if (normalized.includes('chinese') || normalized.includes('tiếng trung') || normalized === 'zh' || normalized === 'chinese') {
      return 'chinese';
    }
    if (normalized.includes('vietnamese') || normalized.includes('tiếng việt') || normalized === 'vi' || normalized === 'vietnamese') {
      return 'vietnamese';
    }
    // Default to english if unclear
    return 'english';
  };

  const onSubmit = async (values: ImportExcelFormValues) => {
    setIsImporting(true);
    setImportedCount(0);
    setErrorRows([]);
    
    try {
      let targetFolder = values.folder;
      
      // Handle new folder creation
      if (targetFolder === 'new_folder' && newFolderName) {
        const folderExists = folderObjects?.some((f) => f.name.toLowerCase() === newFolderName.toLowerCase());
        if (!folderExists) {
          await addFolder(newFolderName);
        }
        targetFolder = newFolderName;
      }

      // Parse Excel file
      const rows = await parseExcelFile(values.file);
      
      if (rows.length === 0) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "File Excel không có dữ liệu hợp lệ.",
        });
        setIsImporting(false);
        return;
      }

      // Import each row
      const errors: Array<{ row: number; error: string }> = [];
      let successCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // +2 because Excel rows start at 2 (1 is header)
        
        try {
          // Validate row
          if (!row.word || row.word.trim() === '') {
            errors.push({ row: rowNumber, error: "Thiếu từ" });
            continue;
          }
          
          if (!row.vietnameseTranslation || row.vietnameseTranslation.trim() === '') {
            errors.push({ row: rowNumber, error: "Thiếu nghĩa Tiếng Việt" });
            continue;
          }

          const language = normalizeLanguage(row.language || 'english');
          
          // Determine pronunciation field based on language
          let ipa: string | undefined = undefined;
          let pinyin: string | undefined = undefined;
          
          if (row.pronunciation) {
            if (language === 'english') {
              ipa = row.pronunciation;
            } else if (language === 'chinese') {
              pinyin = row.pronunciation;
            }
          }

          const vocabularyData = {
            word: row.word.trim(),
            language,
            folder: targetFolder,
            vietnameseTranslation: row.vietnameseTranslation.trim(),
            partOfSpeech: row.partOfSpeech?.trim() || undefined,
            ipa,
            pinyin,
          };

          const result = await addVocabularyItem(vocabularyData);
          if (result) {
            successCount++;
          } else {
            errors.push({ row: rowNumber, error: "Không thể thêm từ vựng" });
          }
        } catch (error) {
          errors.push({ row: rowNumber, error: error instanceof Error ? error.message : "Lỗi không xác định" });
        }
      }

      setImportedCount(successCount);
      setErrorRows(errors);

      if (successCount > 0) {
        toast({
          title: "Import thành công!",
          description: `Đã thêm ${successCount} từ vựng vào thư mục "${targetFolder}".${errors.length > 0 ? ` ${errors.length} dòng có lỗi.` : ''}`,
        });
        
        if (errors.length === 0) {
          form.reset();
          onOpenChange(false);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Import thất bại",
          description: `Không thể thêm từ vựng nào. ${errors.length > 0 ? `${errors.length} dòng có lỗi.` : ''}`,
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      toast({
        variant: "destructive",
        title: "Lỗi import",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra khi import file Excel.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import từ vựng từ Excel
          </DialogTitle>
          <DialogDescription>
            Upload file Excel với các cột: <strong>Từ</strong>, <strong>Ngôn ngữ</strong>, <strong>Từ loại</strong>, <strong>Phát âm</strong>, <strong>Tiếng Việt</strong>
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={downloadTemplate}
              className="ml-2 h-auto p-0 text-blue-600 hover:text-blue-700"
            >
              <Download className="mr-1 h-3 w-3" />
              Tải template mẫu
            </Button>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>File Excel</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onChange(file);
                          }
                        }}
                        disabled={isImporting}
                        className="cursor-pointer"
                        {...field}
                      />
                      {value && (
                        <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {value.name}
                        </span>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Định dạng: Từ | Ngôn ngữ (english/chinese/vietnamese) | Từ loại | Phát âm (IPA cho tiếng Anh, Pinyin cho tiếng Trung) | Tiếng Việt
                  </p>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="folder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thư mục</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isImporting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn một thư mục" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <FolderSelectItems
                        folders={folderObjects || []}
                        folderTree={folderTree}
                        valueKey="name"
                        showNewFolderOption={true}
                        newFolderLabel="+ Tạo thư mục mới..."
                      />
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedFolder === "new_folder" && open && (
              <FormItem>
                <FormLabel>Tên thư mục mới</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ví dụ: Từ vựng Import"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    disabled={isImporting}
                  />
                </FormControl>
              </FormItem>
            )}
            
            {errorRows.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{errorRows.length} dòng có lỗi:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {errorRows.slice(0, 10).map((err, idx) => (
                      <li key={idx} className="text-xs">
                        Dòng {err.row}: {err.error}
                      </li>
                    ))}
                    {errorRows.length > 10 && (
                      <li className="text-xs">... và {errorRows.length - 10} lỗi khác</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {importedCount > 0 && (
              <Alert>
                <AlertDescription className="text-green-600 dark:text-green-400">
                  ✅ Đã import thành công <strong>{importedCount}</strong> từ vựng!
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setErrorRows([]);
                  setImportedCount(0);
                  onOpenChange(false);
                }}
                disabled={isImporting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isImporting}>
                {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

