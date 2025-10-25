"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { AppShell } from "@/components/app-shell";
import { MultipleChoicePlayer } from "@/components/multiple-choice-player";
import { MatchingGamePlayer } from "@/components/matching-game-player";
import { SpellingPracticePlayer } from "@/components/spelling-practice-player";
import { useVocabulary } from "@/contexts/vocabulary-context";

// Add this type definition if not imported from elsewhere
type QuizDirection = "en-vi" | "vi-en" | "random";
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

const fetcher = (url: string) => fetch(url).then(res => res.json());

type DirectionSelectorProps = {
  value: string;
  onValueChange: (value: string) => void;
};

const DirectionSelector = ({ value, onValueChange }: DirectionSelectorProps) => (
  <RadioGroup value={value} onValueChange={onValueChange} className="flex items-center space-x-4 mb-4 justify-center">
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="en-vi" id={`r1-${value}`} />
      <Label htmlFor={`r1-${value}`}>Anh - Việt</Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="vi-en" id={`r2-${value}`} />
      <Label htmlFor={`r2-${value}`}>Việt - Anh</Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="random" id={`r3-${value}`}/>
      <Label htmlFor={`r3-${value}`}>Ngẫu nhiên</Label>
    </div>
  </RadioGroup>
);

export default function UserTestsPage() {
  const { folderObjects = [], buildFolderTree } = useVocabulary() || {};
  const folderTree = buildFolderTree();
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [mcDirection, setMcDirection] = useState("en-vi");
  const [spDirection, setSpDirection] = useState("en-vi");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <AppShell>
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
                {folderTree.map((folder: any) => (
                  <React.Fragment key={folder.id}>
                    <SelectItem value={folder.name}>{folder.name}</SelectItem>
                    {folder.children && folder.children.map((child: any) => (
                      <SelectItem key={child.id} value={child.name}>
                        &nbsp;&nbsp;└ {child.name}
                      </SelectItem>
                    ))}
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {mounted && (
          <Tabs defaultValue="multiple-choice" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto">
              <TabsTrigger value="multiple-choice">Trắc nghiệm</TabsTrigger>
              <TabsTrigger value="matching-game">Ghép thẻ</TabsTrigger>
              <TabsTrigger value="spelling-practice">Luyện viết</TabsTrigger>
            </TabsList>
            <TabsContent value="multiple-choice" className="mt-6">
              <DirectionSelector value={mcDirection} onValueChange={setMcDirection} />
              <MultipleChoicePlayer selectedFolder={selectedFolder} quizDirection={mcDirection as QuizDirection} />
            </TabsContent>
            <TabsContent value="matching-game" className="mt-6">
              <MatchingGamePlayer selectedFolder={selectedFolder} />
            </TabsContent>
            <TabsContent value="spelling-practice" className="mt-6">
              <DirectionSelector value={spDirection} onValueChange={setSpDirection} />
              <SpellingPracticePlayer selectedFolder={selectedFolder} direction={spDirection as QuizDirection} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppShell>
  );
}
