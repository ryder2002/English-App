import { BatchAddForm } from "@/components/batch-add-form";
import { ManualAddTable } from "@/components/manual-add-table";
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
                    <TabsTrigger value="batch">Thêm hàng loạt (AI)</TabsTrigger>
                    <TabsTrigger value="manual">Thêm thủ công</TabsTrigger>
                </TabsList>
                <TabsContent value="batch" className="mt-6">
                     <div className="text-center max-w-2xl mx-auto mb-6">
                        <p className="text-sm text-muted-foreground">Nhập danh sách từ, AI sẽ tự động tạo các phần còn lại (dịch nghĩa, phát âm, âm thanh).</p>
                    </div>
                    <BatchAddForm />
                </TabsContent>
                <TabsContent value="manual" className="mt-6">
                    <div className="text-center max-w-3xl mx-auto mb-6">
                        <p className="text-sm text-muted-foreground">Tự điền các cột như một bảng tính. AI sẽ hỗ trợ tạo tự động phần phát âm và nghĩa khi bạn nhập xong từ.</p>
                    </div>
                    <ManualAddTable />
                </TabsContent>
            </Tabs>
        </div>
    );
}
