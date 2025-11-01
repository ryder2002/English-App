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
import { useAuth } from "@/contexts/auth-context";

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
  <div className="flex items-center justify-center p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800">
    <RadioGroup value={value} onValueChange={onValueChange} className="flex items-center space-x-6">
      <div className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200">
        <RadioGroupItem value="en-vi" id={`r1-${value}`} className="border-2 border-purple-400" />
        <Label htmlFor={`r1-${value}`} className="font-semibold cursor-pointer">🇬🇧 Anh - Việt</Label>
      </div>
      <div className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200">
        <RadioGroupItem value="vi-en" id={`r2-${value}`} className="border-2 border-purple-400" />
        <Label htmlFor={`r2-${value}`} className="font-semibold cursor-pointer">🇻🇳 Việt - Anh</Label>
      </div>
      <div className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200">
        <RadioGroupItem value="random" id={`r3-${value}`} className="border-2 border-purple-400"/>
        <Label htmlFor={`r3-${value}`} className="font-semibold cursor-pointer">🎲 Ngẫu nhiên</Label>
      </div>
    </RadioGroup>
  </div>
);

export default function UserTestsPage() {
  const auth = useAuth();
  const router = useRouter();
  const { folderObjects = [], buildFolderTree } = useVocabulary() || {};
  const folderTree = buildFolderTree();
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [mcDirection, setMcDirection] = useState("en-vi");
  const [spDirection, setSpDirection] = useState("en-vi");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { 
    setMounted(true);
    // Redirect admin to admin panel if they try to access user tests
    if (auth?.user && auth.user.role === 'admin') {
      router.replace('/admin/tests');
    }
  }, [auth, router]);
  
  // Don't render if admin (will redirect)
  if (auth?.user?.role === 'admin') {
    return null;
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          {/* Header với gradient */}
          <div className="mb-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft p-6 border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md shadow-glow-green animate-pulse-slow">
                  <span className="text-3xl">📝</span>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Kiểm tra
                  </h1>
                  <p className="text-sm text-muted-foreground mt-2">
                    Tự kiểm tra với từ vựng của bạn. Để làm bài kiểm tra trong lớp học, vui lòng vào{' '}
                    <Link href="/classes" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                      Lớp học
                    </Link>.
                  </p>
                </div>
              </div>
              <div className="w-full sm:w-auto sm:min-w-[280px]">
                <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                  <SelectTrigger className="w-full bg-white/90 dark:bg-gray-800/90 border-2 border-purple-200 dark:border-purple-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                    <SelectValue placeholder="📁 Chọn thư mục để kiểm tra" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
                    <SelectItem value="all">📚 Tất cả từ vựng</SelectItem>
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
          </div>
          
          {mounted && (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-gray-200/50 dark:border-gray-700/50 p-6">
              <Tabs defaultValue="multiple-choice" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-pink-900/30 rounded-xl p-1 border-2 border-purple-200 dark:border-purple-800">
                  <TabsTrigger 
                    value="multiple-choice"
                    className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 font-semibold"
                  >
                    ✅ Trắc nghiệm
                  </TabsTrigger>
                  <TabsTrigger 
                    value="matching-game"
                    className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 font-semibold"
                  >
                    🎯 Ghép thẻ
                  </TabsTrigger>
                  <TabsTrigger 
                    value="spelling-practice"
                    className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 font-semibold"
                  >
                    ✍️ Luyện viết
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="multiple-choice" className="mt-8">
                  <div className="mb-6">
                    <DirectionSelector value={mcDirection} onValueChange={setMcDirection} />
                  </div>
                  <MultipleChoicePlayer selectedFolder={selectedFolder} quizDirection={mcDirection as QuizDirection} />
                </TabsContent>
                <TabsContent value="matching-game" className="mt-8">
                  <MatchingGamePlayer selectedFolder={selectedFolder} />
                </TabsContent>
                <TabsContent value="spelling-practice" className="mt-8">
                  <div className="mb-6">
                    <DirectionSelector value={spDirection} onValueChange={setSpDirection} />
                  </div>
                  <SpellingPracticePlayer selectedFolder={selectedFolder} direction={spDirection as QuizDirection} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
