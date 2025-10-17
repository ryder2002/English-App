import { BatchAddForm } from "@/components/batch-add-form";
import { ManualAddTable } from "@/components/manual-add-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Thêm từ vựng - CN",
};

export default function AddVocabularyPage() {
    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-center mb-6">
                <h1 className="text-3xl font-bold font-headline tracking-tight text-gradient">
                    Thêm từ vựng
                </h1>
            </div>

            <Tabs defaultValue="batch" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-lg mx-auto">
                    <TabsTrigger value="batch">Thêm hàng loạt (AI)</TabsTrigger>
                    <TabsTrigger value="manual">Thêm thủ công</TabsTrigger>
                </TabsList>
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
                           AI vẫn sẽ tự động tạo nghĩa tiếng Việt, phát âm và từ loại cho bạn.
                        </AlertDescription>
                    </Alert>
                    <ManualAddTable />
                </TabsContent>
            </Tabs>
        </div>
    );
}
