"use client";

import { BatchAddForm } from "@/components/batch-add-form";
import { ManualAddTable } from "@/components/manual-add-table";
import { ImportExcelDialog } from "@/components/import-excel-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Info, FileSpreadsheet } from "lucide-react";
import { useState } from "react";

export default function AddVocabularyPage() {
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-center mb-6">
                <h1 className="text-3xl font-bold font-headline tracking-tight text-gradient">
                    Thêm từ vựng
                </h1>
            </div>

            <Tabs defaultValue="batch" className="w-full">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                    <TabsList className="grid w-full grid-cols-2 max-w-lg">
                        <TabsTrigger value="batch">Thêm hàng loạt (AI)</TabsTrigger>
                        <TabsTrigger value="manual">Thêm thủ công</TabsTrigger>
                    </TabsList>
                    <Button
                        onClick={() => setIsImportDialogOpen(true)}
                        variant="outline"
                        className="w-full sm:w-auto border-2 border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-600 transition-all duration-300 hover:scale-105"
                    >
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        📊 Import Excel
                    </Button>
                </div>
                <TabsContent value="batch" className="mt-6">
                     <Alert className="max-w-2xl mx-auto mb-6">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Mẹo:</strong> Thêm từ đồng nghĩa với các ký tự <code className="bg-muted px-1 rounded">=</code>, <code className="bg-muted px-1 rounded">-</code>, <code className="bg-muted px-1 rounded">:</code>, hoặc <code className="bg-muted px-1 rounded">|</code><br/>
                            Ví dụ: <code className="text-primary bg-muted px-1 rounded">hello = hi</code> → AI sẽ tạo nghĩa tiếng Việt: "xin chào"
                        </AlertDescription>
                    </Alert>
                    <BatchAddForm />
                </TabsContent>
                <TabsContent value="manual" className="mt-6">
                    <Alert className="max-w-3xl mx-auto mb-6">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                           <strong>Mẹo:</strong> Nhập từ với đồng nghĩa (ví dụ: <code className="text-primary bg-muted px-1 rounded">hello = hi</code>) để AI hiểu rõ hơn ngữ cảnh.<br/>
                        </AlertDescription>
                    </Alert>
                    <ManualAddTable />
                </TabsContent>
            </Tabs>
            <ImportExcelDialog
                open={isImportDialogOpen}
                onOpenChange={setIsImportDialogOpen}
            />
        </div>
    );
}
