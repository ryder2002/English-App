"use client";

import React, { useEffect, useMemo, useState } from 'react';
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

const DirectionSelector = ({ value, onValueChange }) => (
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
  const router = useRouter();
  const { data: tests = [], isLoading, error } = useSWR('/api/tests', fetcher);
  const { folders = [] } = useVocabulary() || {};
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [quizCode, setQuizCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [mcDirection, setMcDirection] = useState("en-vi");
  const [spDirection, setSpDirection] = useState("en-vi");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleJoinTest = () => {
    setCodeError('');
    if (!quizCode.trim()) {
      setCodeError('Vui lòng nhập mã đề.');
      return;
    }
    // Chuyển hướng sang trang kiểm tra theo mã (dành cho đề admin phát)
    router.push(`/tests/${quizCode.trim()}`);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (tests || []).filter((t: any) => {
      if (!q) return true;
      return (
        String(t.title).toLowerCase().includes(q) ||
        String(t.quizCode).toLowerCase().includes(q) ||
        String(t.clazz?.name || '').toLowerCase().includes(q)
      );
    });
  }, [tests, query]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));
  const start = (current - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  return (
    <AppShell>
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
          <div>
            <h1 className="text-2xl font-bold">Kiểm tra</h1>
            <p className="text-sm text-muted-foreground">Chọn chế độ kiểm tra hoặc nhập mã đề để vào bài kiểm tra được phát.</p>
            <div className="flex items-center gap-2 mt-2">
              <Input
                placeholder="Nhập mã đề kiểm tra..."
                value={quizCode}
                onChange={e => setQuizCode(e.target.value)}
                className="max-w-xs"
              />
              <Button onClick={handleJoinTest}>Vào bài kiểm tra</Button>
            </div>
            {codeError && <div className="text-destructive text-sm mt-1">{codeError}</div>}
          </div>
          <div className="w-full sm:w-auto sm:min-w-[250px] mt-4 md:mt-0">
            <Select value={selectedFolder} onValueChange={setSelectedFolder}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn một thư mục để kiểm tra" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả từ vựng</SelectItem>
                {(folders || []).map(folder => (
                  <SelectItem key={folder} value={folder}>{folder}</SelectItem>
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
        )}
      </div>
    </AppShell>
  );
}
