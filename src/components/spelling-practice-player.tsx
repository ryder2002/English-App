
'use client';

import { useVocabulary } from "@/contexts/vocabulary-context";
import { useEffect, useMemo, useState, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import type { VocabularyItem, QuizDirection } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CheckCircle, RefreshCw, XCircle, ClipboardCheck, Loader2 } from "lucide-react";
import { Input } from "./ui/input";

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

interface SpellingPracticePlayerProps {
    selectedFolder: string;
    direction: QuizDirection;
}

export function SpellingPracticePlayer({ selectedFolder, direction }: SpellingPracticePlayerProps) {
    const { vocabulary, folderObjects } = useVocabulary();
    const [quizDeck, setQuizDeck] = useState<VocabularyItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [submittedAnswer, setSubmittedAnswer] = useState<string | null>(null);
    const [isFinished, setIsFinished] = useState(false);
    const [incorrectAnswers, setIncorrectAnswers] = useState<VocabularyItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [spellingInput, setSpellingInput] = useState("");
    const spellingInputRef = useRef<HTMLInputElement>(null);

    const fullDeck = useMemo(() => {
        // CRITICAL: Only use vocabulary that belongs to user's own folders
        // This ensures admin vocabulary never appears in user's spelling practice
        const userFolderNames = folderObjects.map(f => f.name);
        
        let filteredVocab = vocabulary.filter(item => {
            const folderName = item.folder || "";
            // Only include vocabulary with empty folder or folder owned by user
            return !folderName || userFolderNames.includes(folderName);
        });
        
        // Further filter by selectedFolder if not 'all'
        if (selectedFolder !== 'all') {
            filteredVocab = filteredVocab.filter(item => item.folder === selectedFolder);
        }
        
        return filteredVocab.filter(item => item.word && item.vietnameseTranslation);
    }, [vocabulary, selectedFolder, folderObjects]);

    const startNewGame = (deckToUse: VocabularyItem[] = fullDeck) => {
        setIsLoading(true);
        setQuizDeck([]);
        setCurrentIndex(0);
        setScore(0);
        setSubmittedAnswer(null);
        setIsFinished(false);
        setIncorrectAnswers([]);
        setSpellingInput("");

        if (deckToUse.length > 0) {
            setQuizDeck(shuffleArray(deckToUse));
        }
        setIsLoading(false);
    };

    useEffect(() => {
        startNewGame(fullDeck);
    }, [selectedFolder, vocabulary, direction]);

    const currentWord = useMemo(() => {
        if (isLoading || quizDeck.length === 0 || currentIndex >= quizDeck.length) return null;
        return quizDeck[currentIndex];
    }, [quizDeck, currentIndex, isLoading]);

    const directionForThisQuestion = useMemo(() => {
        if (direction === 'random') {
            return Math.random() < 0.5 ? 'vi-en' : 'en-vi';
        }
        return direction;
    }, [direction, currentWord]);
    
    useEffect(() => {
        spellingInputRef.current?.focus();
    }, [currentWord]);

    const handleAnswerSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (submittedAnswer || !currentWord || !spellingInput) return;

        const isViEn = directionForThisQuestion === 'vi-en';
        const correctAnswer = isViEn ? currentWord.word : currentWord.vietnameseTranslation;

        setSubmittedAnswer(spellingInput);
        const isCorrect = spellingInput.trim().toLowerCase() === correctAnswer.toLowerCase();

        if (isCorrect) {
            setScore(prev => prev + 1);
        } else {
            if (!incorrectAnswers.find(item => item.id === currentWord.id)) {
                setIncorrectAnswers(prev => [...prev, currentWord]);
            }
        }

        setTimeout(() => {
            if (currentIndex < quizDeck.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setSubmittedAnswer(null);
                setSpellingInput("");
            } else {
                setIsFinished(true);
            }
        }, 2000);
    };

    const handleRetryIncorrect = () => {
        if (incorrectAnswers.length > 0) {
            startNewGame(incorrectAnswers);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-10 h-96">
                <Loader2 className="h-12 w-12 text-muted-foreground animate-spin mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Đang tải bài kiểm tra...</p>
            </div>
        )
    }
    
    if (fullDeck.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg h-96 bg-card">
                <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Không có từ để luyện gõ.</p>
                <p className="text-sm text-muted-foreground">
                    Cần có ít nhất 1 từ để bắt đầu.
                </p>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="max-w-2xl mx-auto">
                 <Card>
                    <CardHeader className="items-center">
                        <CardTitle className="text-2xl">Hoàn thành!</CardTitle>
                        <CardDescription>Bạn đã hoàn thành phần luyện viết.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-4xl font-bold">
                            {score} / {quizDeck.length}
                        </p>
                        <p className="text-muted-foreground mt-2">
                           Tỷ lệ chính xác: {quizDeck.length > 0 ? ((score / quizDeck.length) * 100).toFixed(0) : 0}%
                        </p>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                         <Button onClick={() => startNewGame(fullDeck)} className="w-full">
                            <RefreshCw className="mr-2 h-4 w-4" /> Làm lại toàn bộ
                        </Button>
                        {incorrectAnswers.length > 0 && (
                            <Button onClick={handleRetryIncorrect} className="w-full" variant="outline">
                                <RefreshCw className="mr-2 h-4 w-4" /> Luyện lại {incorrectAnswers.length} từ sai
                            </Button>
                        )}
                    </CardFooter>
                 </Card>
            </div>
        )
    }

    if (!currentWord) {
        return (
             <div className="flex flex-col items-center justify-center text-center p-10 h-96">
                <Loader2 className="h-12 w-12 text-muted-foreground animate-spin mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Đang tạo câu hỏi...</p>
            </div>
        )
    }

    const isViEn = directionForThisQuestion === 'vi-en';
    const promptText = isViEn ? "Viết lại từ sau bằng tiếng Anh:" : "Viết lại nghĩa của từ sau bằng tiếng Việt:";
    const questionText = isViEn ? currentWord.vietnameseTranslation : currentWord.word;
    const correctAnswer = isViEn ? currentWord.word : currentWord.vietnameseTranslation;
    const isCorrect = submittedAnswer && submittedAnswer.trim().toLowerCase() === correctAnswer.toLowerCase();

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-4 space-y-2">
                <Progress value={((currentIndex + 1) / quizDeck.length) * 100} />
                <p className="text-right text-sm text-muted-foreground">Từ {currentIndex + 1} trên {quizDeck.length}</p>
            </div>
            <Card>
                <CardHeader>
                    <CardDescription>{promptText}</CardDescription>
                    <CardTitle className={cn(
                        "text-4xl md:text-5xl font-bold text-center py-10 min-h-[180px] flex flex-col items-center justify-center",
                        !isViEn ? "font-headline" : ""
                    )}>
                        <span>{questionText}</span>
                        {!isViEn && currentWord.ipa && (
                            <span className="text-2xl text-muted-foreground font-normal mt-2">
                                {currentWord.ipa}
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAnswerSubmit} className="sm:col-span-2 flex flex-col items-center gap-4">
                        <Input
                            ref={spellingInputRef}
                            value={spellingInput}
                            onChange={(e) => setSpellingInput(e.target.value)}
                            placeholder="Nhập câu trả lời..."
                            className={cn("text-lg text-center",
                                submittedAnswer && (isCorrect 
                                    ? 'border-green-500 bg-green-100 dark:bg-green-900/50'
                                    : 'border-red-500 bg-red-100 dark:bg-red-900/50')
                            )}
                            disabled={!!submittedAnswer}
                            autoFocus
                        />
                        {submittedAnswer && !isCorrect && (
                            <p className='text-lg text-center text-red-600'>
                                Đáp án đúng: <span className="font-bold">{correctAnswer}</span>
                            </p>
                        )}
                         {submittedAnswer && isCorrect && (
                            <p className='text-lg text-center text-green-600'>
                                Chính xác!
                            </p>
                        )}
                        <Button type="submit" disabled={!!submittedAnswer || !spellingInput} className="w-full sm:w-auto">
                            {submittedAnswer ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kiểm tra"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
