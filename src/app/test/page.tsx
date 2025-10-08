'use client';

import { MultipleChoicePlayer } from "@/components/multiple-choice-player";
import { MatchingGamePlayer } from "@/components/matching-game-player";
import { SpellingPracticePlayer } from "@/components/spelling-practice-player";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { QuizDirection } from "@/lib/types";


const DirectionSelector = ({ value, onValueChange }: { value: QuizDirection, onValueChange: (value: QuizDirection) => void }) => (
    <RadioGroup value={value} onValueChange={onValueChange} className="flex items-center space-x-4 mb-4 justify-center">
        <div className="flex items-center space-x-2">
            <RadioGroupItem value="en-vi" id={`r1-${value}`} />
            <Label htmlFor={`r1-${value}`}>Anh -> Việt</Label>
        </div>
        <div className="flex items-center space-x-2">
            <RadioGroupItem value="vi-en" id={`r2-${value}`} />
            <Label htmlFor={`r2-${value}`}>Việt -> Anh</Label>
        </div>
        <div className="flex items-center space-x-2">
            <RadioGroupItem value="random" id={`r3-${value}`} />
            <Label htmlFor={`r3-${value}`}>Ngẫu nhiên</Label>
        </div>
    </RadioGroup>
);

export default function TestPage() {
    const { folders } = useVocabulary();
    const [selectedFolder, setSelectedFolder] = useState<string>("all");
    const [mcDirection, setMcDirection] = useState<QuizDirection>("en-vi");
    const [spDirection, setSpDirection] = useState<QuizDirection>("en-vi");

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
                <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto">
                    <TabsTrigger value="multiple-choice">Trắc nghiệm</TabsTrigger>
                    <TabsTrigger value="matching-game">Ghép thẻ</TabsTrigger>
                    <TabsTrigger value="spelling-practice">Luyện viết</TabsTrigger>
                </TabsList>
                
                <TabsContent value="multiple-choice" className="mt-6">
                    <DirectionSelector value={mcDirection} onValueChange={setMcDirection} />
                    <MultipleChoicePlayer selectedFolder={selectedFolder} quizDirection={mcDirection} />
                </TabsContent>

                <TabsContent value="matching-game" className="mt-6">
                    <MatchingGamePlayer selectedFolder={selectedFolder} />
                </TabsContent>

                <TabsContent value="spelling-practice" className="mt-6">
                    <DirectionSelector value={spDirection} onValueChange={setSpDirection} />
                    <SpellingPracticePlayer selectedFolder={selectedFolder} direction={spDirection} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
