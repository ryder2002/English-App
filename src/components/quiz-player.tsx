"use client";

import { useVocabulary } from "@/contexts/vocabulary-context";
import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import type { VocabularyItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CheckCircle, RefreshCw, XCircle, ClipboardCheck } from "lucide-react";

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

interface QuizPlayerProps {
    selectedFolder: string;
}

export function QuizPlayer({ selectedFolder }: QuizPlayerProps) {
    const { vocabulary } = useVocabulary();
    const [quizDeck, setQuizDeck] = useState<VocabularyItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isFinished, setIsFinished] = useState(false);
    const [incorrectAnswers, setIncorrectAnswers] = useState<VocabularyItem[]>([]);


    const fullDeck = useMemo(() => {
        if (selectedFolder === 'all') {
            return vocabulary;
        }
        return vocabulary.filter(item => item.folder === selectedFolder);
    }, [vocabulary, selectedFolder]);


    const startNewGame = (deckToUse: VocabularyItem[] = fullDeck) => {
        if (deckToUse.length < 4) { // Need at least 4 items to generate 3 wrong answers
            setQuizDeck([]);
            return;
        }
        setQuizDeck(shuffleArray(deckToUse));
        setCurrentIndex(0);
        setScore(0);
        setSelectedAnswer(null);
        setIsFinished(false);
        setIncorrectAnswers([]);
    };

    useEffect(() => {
        startNewGame(fullDeck);
    }, [fullDeck]);

    const currentQuestion = useMemo(() => {
        if (quizDeck.length === 0 || currentIndex >= quizDeck.length) return null;
        
        const questionItem = quizDeck[currentIndex];
        const correctAnswer = questionItem.vietnameseTranslation;

        // Get 3 wrong answers from the full deck to ensure variety
        const wrongAnswers = shuffleArray(
            fullDeck.filter(item => item.id !== questionItem.id)
        )
        .slice(0, 3)
        .map(item => item.vietnameseTranslation);

        const options = shuffleArray([correctAnswer, ...wrongAnswers]);

        return {
            word: questionItem.word,
            correctAnswer,
            options,
        };
    }, [quizDeck, currentIndex, fullDeck]);

    const handleAnswerSelect = (answer: string) => {
        if (selectedAnswer) return; // Already answered

        setSelectedAnswer(answer);
        if (answer === currentQuestion?.correctAnswer) {
            setScore(prev => prev + 1);
        } else {
            // Add the incorrect item to the list for later review
            const incorrectItem = quizDeck[currentIndex];
            if (incorrectItem) {
                setIncorrectAnswers(prev => [...prev, incorrectItem]);
            }
        }
    };

    const handleNextQuestion = () => {
        if (currentIndex < quizDeck.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(null);
        } else {
            setIsFinished(true);
        }
    };

    const handleRetryIncorrect = () => {
        // Only start if there are incorrect answers
        if (incorrectAnswers.length > 0) {
            // If there are fewer than 4 incorrect words, we can't make a full quiz.
            // In a real scenario, you might want a different UI for this case,
            // but for now, we'll just start the quiz if possible.
            if (incorrectAnswers.length < 4 && incorrectAnswers.length > 0) {
                 startNewGame(incorrectAnswers);
            } else {
                startNewGame(incorrectAnswers);
            }
        }
    };
    
    if (fullDeck.length < 4) {
        return (
             <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg h-96 bg-card">
                <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Không đủ từ vựng để kiểm tra.</p>
                <p className="text-sm text-muted-foreground">
                Cần có ít nhất 4 từ trong thư mục này để bắt đầu một bài kiểm tra.
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
                        <CardDescription>Bạn đã hoàn thành bài kiểm tra.</CardDescription>
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
                                <RefreshCw className="mr-2 h-4 w-4" /> Kiểm tra lại {incorrectAnswers.length} từ sai
                            </Button>
                        )}
                    </CardFooter>
                 </Card>
            </div>
        )
    }

    if (!currentQuestion) {
        // This can happen if the deck is too small and gets filtered to < 4 items
         if (quizDeck.length > 0 && quizDeck.length < 4) {
            return (
                <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg h-96 bg-card">
                    <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">Không đủ từ để tiếp tục.</p>
                    <p className="text-sm text-muted-foreground">
                        Cần ít nhất 4 từ để tạo một bài kiểm tra. Bộ từ hiện tại của bạn quá nhỏ.
                    </p>
                    <Button onClick={() => startNewGame(fullDeck)} className="mt-4">
                        <RefreshCw className="mr-2 h-4 w-4" /> Quay lại từ đầu
                    </Button>
                </div>
            );
        }
        return null;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-4 space-y-2">
                <Progress value={(currentIndex / quizDeck.length) * 100} />
                <p className="text-right text-sm text-muted-foreground">Câu {currentIndex + 1} trên {quizDeck.length}</p>
            </div>
            <Card>
                <CardHeader>
                    <CardDescription>Từ sau đây có nghĩa là gì?</CardDescription>
                    <CardTitle className="text-4xl md:text-5xl font-bold text-center py-10 font-headline">
                        {currentQuestion.word}
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {currentQuestion.options.map((option, index) => {
                       const isCorrect = option === currentQuestion.correctAnswer;
                       const isSelected = option === selectedAnswer;
                       
                       return (
                            <Button
                                key={index}
                                variant="outline"
                                className={cn("h-auto p-4 justify-start text-base whitespace-normal",
                                    selectedAnswer && isCorrect && "bg-green-100 border-green-400 text-green-800 hover:bg-green-200 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300",
                                    selectedAnswer && isSelected && !isCorrect && "bg-red-100 border-red-400 text-red-800 hover:bg-red-200 dark:bg-red-900/50 dark:border-red-700 dark:text-red-300",
                                )}
                                onClick={() => handleAnswerSelect(option)}
                                disabled={!!selectedAnswer}
                            >
                                <div className="flex-grow">{option}</div>
                                {selectedAnswer && isCorrect && <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400"/>}
                                {selectedAnswer && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-600 dark:text-red-400"/>}
                            </Button>
                       )
                   })}
                </CardContent>
                {selectedAnswer && (
                     <CardFooter>
                        <Button onClick={handleNextQuestion} className="w-full">
                            {currentIndex === quizDeck.length - 1 ? 'Xem kết quả' : 'Câu tiếp theo'}
                        </Button>
                     </CardFooter>
                )}
            </Card>
        </div>
    );
}
