"use client";

import { BatchAddForm } from "@/components/batch-add-form";
import { ManualAddTable } from "@/components/manual-add-table";
import { ImportExcelDialog } from "@/components/import-excel-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Info, FileSpreadsheet, Sparkles, PenTool, BookOpen } from "lucide-react";
import { useState } from "react";

export default function AddVocabularyPage() {
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("batch");

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4 md:p-6 lg:p-8">
            {/* Header với gradient - Compact hơn */}
            <div className="mb-4 md:mb-6 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm p-3 md:p-4 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center shadow-md">
                        <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Thêm từ vựng
                        </h1>
                        <p className="text-xs md:text-sm text-muted-foreground">
                            Thêm từ vựng mới bằng AI hoặc thủ công
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Actions & Tabs - Compact hơn */}
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1 max-w-lg">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg p-1">
                            <TabsTrigger 
                                value="batch" 
                                className="rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-600 data-[state=active]:text-white text-sm font-medium transition-all"
                            >
                                <Sparkles className="mr-2 h-3.5 w-3.5 inline" />
                                Hàng loạt (AI)
                            </TabsTrigger>
                            <TabsTrigger 
                                value="manual" 
                                className="rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white text-sm font-medium transition-all"
                            >
                                <PenTool className="mr-2 h-3.5 w-3.5 inline" />
                                Thủ công
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                <Button
                    onClick={() => setIsImportDialogOpen(true)}
                    size="sm"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all shrink-0"
                >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Import Excel
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsContent value="batch" className="mt-0">
                    <div className="space-y-3 md:space-y-4">
                        <Alert className="border-green-200 bg-green-50/50 dark:bg-green-900/20 dark:border-green-800">
                            <Info className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                            <AlertDescription className="text-xs md:text-sm">
                                <strong>Mẹo:</strong> Thêm từ đồng nghĩa với các ký tự <code className="bg-green-100 dark:bg-green-900 px-1 py-0.5 rounded text-xs">=</code>, <code className="bg-green-100 dark:bg-green-900 px-1 py-0.5 rounded text-xs">-</code>, <code className="bg-green-100 dark:bg-green-900 px-1 py-0.5 rounded text-xs">:</code>, hoặc <code className="bg-green-100 dark:bg-green-900 px-1 py-0.5 rounded text-xs">|</code><br/>
                                Ví dụ: <code className="bg-green-100 dark:bg-green-900 px-1 py-0.5 rounded text-xs">hello = hi</code> → AI sẽ tạo nghĩa tiếng Việt: "xin chào".<br/>
                                <strong>Lưu ý: mỗi từ vựng nhập trên một dòng.</strong>
                            </AlertDescription>
                        </Alert>
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-4 md:p-6">
                            <BatchAddForm />
                        </div>
                    </div>
                </TabsContent>
                
                <TabsContent value="manual" className="mt-0">
                    <div className="space-y-3 md:space-y-4">
                        <Alert className="border-purple-200 bg-purple-50/50 dark:bg-purple-900/20 dark:border-purple-800">
                            <Info className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                            <AlertDescription className="text-xs md:text-sm">
                                <strong className="text-purple-700 dark:text-purple-300">💡 Mẹo:</strong> Nhập từ với đồng nghĩa (ví dụ: <code className="bg-purple-100 dark:bg-purple-900 px-1 py-0.5 rounded text-xs">hello = hi</code>) để AI hiểu rõ hơn ngữ cảnh.
                            </AlertDescription>
                        </Alert>
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-4 md:p-6">
                            <ManualAddTable />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
            
            <ImportExcelDialog
                open={isImportDialogOpen}
                onOpenChange={setIsImportDialogOpen}
            />
        </div>
    );
}
