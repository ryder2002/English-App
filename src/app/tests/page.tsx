'use client';

import { useState, useEffect } from 'react';
import { MultipleChoicePlayer } from '@/components/multiple-choice-player';
import { MatchingGamePlayer } from '@/components/matching-game-player';
import { SpellingPracticePlayer } from '@/components/spelling-practice-player';
import { useVocabulary } from '@/contexts/vocabulary-context';
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderSelectItems } from "@/components/folder-select-items";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';
import { QuizDirection } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const DirectionSelector = ({ value, onValueChange }: { value: string, onValueChange: (val: string) => void }) => (
  <div className="flex justify-center mb-6">
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-purple-100 dark:border-purple-900/50">
      <RadioGroup value={value} onValueChange={onValueChange} className="flex flex-col sm:flex-row gap-4 sm:gap-8">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="en-vi" id="r1" className="text-blue-600 border-blue-600" />
          <Label htmlFor="r1" className="cursor-pointer font-medium">🇬🇧 Anh → 🇻🇳 Việt</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="vi-en" id="r2" className="text-purple-600 border-purple-600" />
          <Label htmlFor="r2" className="cursor-pointer font-medium">🇻🇳 Việt → 🇬🇧 Anh</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="random" id="r3" className="text-pink-600 border-pink-600" />
          <Label htmlFor="r3" className="cursor-pointer font-medium">🔀 Hỗn hợp</Label>
        </div>
      </RadioGroup>
    </div>
  </div>
);

export default function TestsPage() {
  const { folderObjects, buildFolderTree } = useVocabulary();
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [mcDirection, setMcDirection] = useState<string>('random');
  const [spDirection, setSpDirection] = useState<string>('random');

  useEffect(() => {
    setMounted(true);
  }, []);

  const folderTree = buildFolderTree();

  return (
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
                <div className="w-full max-w-2xl mx-auto mb-6 sm:mb-8 flex justify-center">
                  <TabsList className="inline-flex h-auto bg-gradient-to-r from-blue-50/80 via-purple-50/80 to-pink-50/80 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-xl p-1.5 border border-purple-200/60 dark:border-purple-700/60 gap-1.5">
                    <TabsTrigger
                      value="multiple-choice"
                      className="flex items-center justify-center rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 font-semibold text-sm sm:text-base py-2.5 sm:py-3 px-4 sm:px-6 whitespace-nowrap data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-700 dark:data-[state=inactive]:text-gray-300 data-[state=inactive]:hover:bg-white/50 dark:data-[state=inactive]:hover:bg-gray-700/30"
                    >
                      ✅ Trắc nghiệm
                    </TabsTrigger>
                    <TabsTrigger
                      value="matching-game"
                      className="flex items-center justify-center rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 font-semibold text-sm sm:text-base py-2.5 sm:py-3 px-4 sm:px-6 whitespace-nowrap data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-700 dark:data-[state=inactive]:text-gray-300 data-[state=inactive]:hover:bg-white/50 dark:data-[state=inactive]:hover:bg-gray-700/30"
                    >
                      🎯 Ghép thẻ
                    </TabsTrigger>
                    <TabsTrigger
                      value="spelling-practice"
                      className="flex items-center justify-center rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 font-semibold text-sm sm:text-base py-2.5 sm:py-3 px-4 sm:px-6 whitespace-nowrap data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-700 dark:data-[state=inactive]:text-gray-300 data-[state=inactive]:hover:bg-white/50 dark:data-[state=inactive]:hover:bg-gray-700/30"
                    >
                      ✍️ Luyện viết
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="multiple-choice" className="mt-6 sm:mt-8">
                  <DirectionSelector value={mcDirection} onValueChange={setMcDirection} />
                  <MultipleChoicePlayer selectedFolder={selectedFolder} quizDirection={mcDirection as QuizDirection} />
                </TabsContent>
                <TabsContent value="matching-game" className="mt-6 sm:mt-8">
                  <MatchingGamePlayer selectedFolder={selectedFolder} />
                </TabsContent>
                <TabsContent value="spelling-practice" className="mt-6 sm:mt-8">
                  <DirectionSelector value={spDirection} onValueChange={setSpDirection} />
                  <SpellingPracticePlayer selectedFolder={selectedFolder} direction={spDirection as QuizDirection} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
