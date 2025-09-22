'use client';

import { FlashcardPlayer } from "@/components/flashcard-player";
import { useVocabulary } from "@/contexts/vocabulary-context";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardStackPlusIcon } from "@radix-ui/react-icons";


export default function FlashcardsPage() {
    const { folders } = useVocabulary();
    const [selectedFolder, setSelectedFolder] = useState<string>("all");

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-center justify-center mb-6 gap-4">
                <h1 className="text-3xl font-bold font-headline tracking-tight text-gradient">
                    Flashcards
                </h1>
                 <div className="w-full sm:w-auto sm:min-w-[250px]">
                    <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn một thư mục để học" />
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
            <FlashcardPlayer selectedFolder={selectedFolder} />
        </div>
    );
}
