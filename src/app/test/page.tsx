'use client';

import { QuizPlayer } from "@/components/quiz-player";
import { MatchingGamePlayer } from "@/components/matching-game-player";
import { useVocabulary } from "@/contexts/vocabulary-context";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function TestPage() {
    const { folders } = useVocabulary();
    const [selectedFolder, setSelectedFolder] = useState<string>("all");

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                <h1 className="text-3xl font-bold font-headline tracking-tight text-gradient">
                    Kiểm tra
                </h1>
                <div className="w-full sm:w-auto sm:min-w-[250px]">
                    <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn một thư mục để kiểm tra" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả từ vựng</SelectItem>
                            {folders.map(folder => (
                                <SelectItem key={folder} value={folder}>
                                    {folder}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 </div>
            </div>

            <Tabs defaultValue="multiple-choice" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-lg mx-auto">
                    <TabsTrigger value="multiple-choice">Trắc nghiệm</TabsTrigger>
                    <TabsTrigger value="matching-game">Ghép thẻ</TabsTrigger>
                </TabsList>
                <TabsContent value="multiple-choice" className="mt-6">
                    <QuizPlayer selectedFolder={selectedFolder} />
                </TabsContent>
                <TabsContent value="matching-game" className="mt-6">
                    <MatchingGamePlayer selectedFolder={selectedFolder} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
