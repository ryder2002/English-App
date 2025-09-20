import { BatchAddForm } from "@/components/batch-add-form";
import { ManualAddSheet } from "@/components/manual-add-sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Thêm từ vựng - RYDER",
};

export default function AddVocabularyPage() {
    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold font-headline tracking-tight bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-transparent bg-clip-text">
                    Thêm từ vựng
                </h1>
            </div>

            <Tabs defaultValue="batch" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-lg mx-auto">
                    <TabsTrigger value="batch">Thêm hàng loạt</TabsTrigger>
                    <TabsTrigger value="manual">Thêm thủ công</TabsTrigger>
                </TabsList>
                <TabsContent value="batch" className="mt-6">
                     <div className="text-center max-w-2xl mx-auto mb-6">
                        <p className="text-sm text-muted-foreground">Người dùng nhập danh sách từ vựng vào ô bên dưới, AI sẽ tự động tạo các phần còn lại (dịch nghĩa, phát âm, âm thanh).</p>
                    </div>
                    <BatchAddForm />
                </TabsContent>
                <TabsContent value="manual" className="mt-6">
                    <div className="text-center max-w-3xl mx-auto mb-6">
                        <p className="text-sm text-muted-foreground">Người dùng tự điền các cột, AI sẽ chỉ hỗ trợ tạo tự động phần phát âm (IPA/Pinyin).</p>
                    </div>
                    <ManualAddSheet />
                </TabsContent>
            </Tabs>
        </div>
    );
}
