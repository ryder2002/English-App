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
import { FolderSelectItems } from "@/components/folder-select-items";

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
  <div className="flex items-center justify-center p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800">
    <RadioGroup value={value} onValueChange={onValueChange} className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 md:space-x-6 w-full">
      <div className="flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200">
        <RadioGroupItem value="en-vi" id={`r1-${value}`} className="border-2 border-purple-400 h-4 w-4 sm:h-5 sm:w-5" />
        <Label htmlFor={`r1-${value}`} className="font-semibold cursor-pointer text-xs sm:text-sm md:text-base whitespace-nowrap">🇬🇧 Anh - Việt</Label>
      </div>
      <div className="flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200">
        <RadioGroupItem value="vi-en" id={`r2-${value}`} className="border-2 border-purple-400 h-4 w-4 sm:h-5 sm:w-5" />
        <Label htmlFor={`r2-${value}`} className="font-semibold cursor-pointer text-xs sm:text-sm md:text-base whitespace-nowrap">🇻🇳 Việt - Anh</Label>
      </div>
      <div className="flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200">
        <RadioGroupItem value="random" id={`r3-${value}`} className="border-2 border-purple-400 h-4 w-4 sm:h-5 sm:w-5"/>
        <Label htmlFor={`r3-${value}`} className="font-semibold cursor-pointer text-xs sm:text-sm md:text-base whitespace-nowrap">🎲 Ngẫu nhiên</Label>
      </div>
    </RadioGroup>
  </div>
);

export default function UserTestsPage() {
  const auth = useAuth();
  const router = useRouter();
  const { folderObjects = [], buildFolderTree } = useVocabulary() || {};
  const folderTree = buildFolderTree ? buildFolderTree() : [];
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
      <div className="min-h-screen relative overflow-hidden">
        {/* Artistic Background với animated elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 via-pink-50 to-yellow-50 dark:from-gray-900 dark:via-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20">
          {/* Floating animated shapes */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300/30 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDuration: '4s' }}></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-pink-300/30 dark:bg-pink-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDuration: '6s' }}></div>
          <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-blue-300/30 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDuration: '5s' }}></div>
          <div className="absolute bottom-40 right-1/3 w-64 h-64 bg-yellow-300/30 dark:bg-yellow-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDuration: '7s' }}></div>
          
          {/* Decorative floating emojis */}
          <div className="absolute top-32 left-1/4 text-4xl animate-bounce-slow opacity-30" style={{ animationDuration: '3s' }}>📚</div>
          <div className="absolute top-60 right-1/4 text-5xl animate-bounce-slow opacity-30" style={{ animationDuration: '4s', animationDelay: '1s' }}>✍️</div>
          <div className="absolute bottom-32 left-1/3 text-4xl animate-bounce-slow opacity-30" style={{ animationDuration: '5s', animationDelay: '0.5s' }}>🎯</div>
          <div className="absolute bottom-60 right-1/4 text-5xl animate-bounce-slow opacity-30" style={{ animationDuration: '6s', animationDelay: '1.5s' }}>⭐</div>
          <div className="absolute top-1/2 left-10 text-3xl animate-bounce-slow opacity-30" style={{ animationDuration: '4.5s', animationDelay: '2s' }}>💡</div>
          <div className="absolute top-1/3 right-10 text-4xl animate-bounce-slow opacity-30" style={{ animationDuration: '5.5s', animationDelay: '0.8s' }}>🎓</div>
        </div>
        
        <div className="relative z-10 container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:p-6 lg:p-8">
          {/* Header với gradient và artistic design */}
          <div className="mb-4 sm:mb-6 md:mb-8 rounded-xl sm:rounded-2xl md:rounded-3xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-2xl p-4 sm:p-5 md:p-6 lg:p-8 border-2 border-purple-200/50 dark:border-purple-800/50 relative overflow-hidden">
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10">
              <div className="absolute top-0 left-0 w-full h-full" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}></div>
            </div>
            <div className="relative z-10 flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-glow-green animate-pulse-slow relative flex-shrink-0">
                  <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl relative z-10">📝</span>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl sm:rounded-2xl"></div>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent drop-shadow-sm leading-tight">
                    Kiểm tra
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1 sm:mt-2 font-medium leading-relaxed">
                    Tự kiểm tra với từ vựng của bạn. Để làm bài kiểm tra trong lớp học, vui lòng vào{' '}
                    <Link href="/classes" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline transition-colors">
                      Lớp học
                    </Link>.
                  </p>
                </div>
              </div>
              <div className="w-full">
                <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                  <SelectTrigger className="w-full bg-white/90 dark:bg-gray-800/90 border-2 border-purple-200 dark:border-purple-800 rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-sm sm:text-base">
                    <SelectValue placeholder="📁 Chọn thư mục để kiểm tra" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
                    <FolderSelectItems
                      folders={folderObjects || []}
                      folderTree={folderTree}
                      valueKey="name"
                      showAllOption={true}
                      allOptionLabel="📚 Tất cả từ vựng"
                    />
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {mounted && (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl border-2 border-purple-200/50 dark:border-purple-800/50 p-4 sm:p-5 md:p-6 lg:p-8 relative overflow-hidden">
              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none">
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20.5z'/%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>
              </div>
              <div className="relative z-10">
              <Tabs defaultValue="multiple-choice" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-pink-900/30 rounded-lg sm:rounded-xl p-0.5 sm:p-1 border-2 border-purple-200 dark:border-purple-800 gap-0.5 sm:gap-1">
                  <TabsTrigger 
                    value="multiple-choice"
                    className="rounded-md sm:rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 font-semibold text-xs sm:text-sm md:text-base py-2 sm:py-2.5"
                  >
                    <span className="hidden sm:inline">✅ Trắc nghiệm</span>
                    <span className="sm:hidden">✅</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="matching-game"
                    className="rounded-md sm:rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 font-semibold text-xs sm:text-sm md:text-base py-2 sm:py-2.5"
                  >
                    <span className="hidden sm:inline">🎯 Ghép thẻ</span>
                    <span className="sm:hidden">🎯</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="spelling-practice"
                    className="rounded-md sm:rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 font-semibold text-xs sm:text-sm md:text-base py-2 sm:py-2.5"
                  >
                    <span className="hidden sm:inline">✍️ Luyện viết</span>
                    <span className="sm:hidden">✍️</span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="multiple-choice" className="mt-4 sm:mt-6 md:mt-8">
                  <div className="mb-4 sm:mb-6">
                    <DirectionSelector value={mcDirection} onValueChange={setMcDirection} />
                  </div>
                  <MultipleChoicePlayer selectedFolder={selectedFolder} quizDirection={mcDirection as QuizDirection} />
                </TabsContent>
                <TabsContent value="matching-game" className="mt-4 sm:mt-6 md:mt-8">
                  <MatchingGamePlayer selectedFolder={selectedFolder} />
                </TabsContent>
                <TabsContent value="spelling-practice" className="mt-4 sm:mt-6 md:mt-8">
                  <div className="mb-4 sm:mb-6">
                    <DirectionSelector value={spDirection} onValueChange={setSpDirection} />
                  </div>
                  <SpellingPracticePlayer selectedFolder={selectedFolder} direction={spDirection as QuizDirection} />
                </TabsContent>
              </Tabs>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
