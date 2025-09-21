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
    const [selectedFolderId, setSelectedFolderId] = useState<string>("all");
    
    const sortedFolders = [...folders].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <h1 className="text-3xl font-bold font-headline tracking-tight bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-transparent bg-clip-text">
                    Flashcards
                </h1>
                 <div className="w-full sm:w-auto sm:min-w-[250px]">
                    <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn một thư mục để học" />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="all">Tất cả từ vựng</SelectItem>
                            {sortedFolders.map(folder => (
                                <SelectItem key={folder.id} value={folder.id}>
                                    {folder.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 </div>
            </div>
            <FlashcardPlayer selectedFolderId={selectedFolderId} />
        </div>
    );
}
