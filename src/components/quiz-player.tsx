
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
    const [shuffledDeck, setShuffledDeck] = useState<VocabularyItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isFinished, setIsFinished] = useState(false);

    const deck = useMemo(() => {
        if (selectedFolder === 'all') {
            return vocabulary;
        }
        return vocabulary.filter(item => item.folder === selectedFolder);
    }, [vocabulary, selectedFolder]);


    const startNewGame = () => {
        if (deck.length < 4) { // Need at least 4 items to generate 3 wrong answers
            setShuffledDeck([]);
            return;
        }
        setShuffledDeck(shuffleArray(deck));
        setCurrentIndex(0);
        setScore(0);
        setSelectedAnswer(null);
        setIsFinished(false);
    };

    useEffect(() => {
        startNewGame();
    }, [deck]);

    const currentQuestion = useMemo(() => {
        if (shuffledDeck.length === 0 || currentIndex >= shuffledDeck.length) return null;
        
        const questionItem = shuffledDeck[currentIndex];
        const correctAnswer = questionItem.vietnameseTranslation;

        // Get 3 wrong answers from the current deck
        const wrongAnswers = shuffleArray(
            deck.filter(item => item.id !== questionItem.id)
        )
        .slice(0, 3)
        .map(item => item.vietnameseTranslation);

        const options = shuffleArray([correctAnswer, ...wrongAnswers]);

        return {
            word: questionItem.word,
            correctAnswer,
            options,
        };
    }, [shuffledDeck, currentIndex, deck]);

    const handleAnswerSelect = (answer: string) => {
        if (selectedAnswer) return; // Already answered

        setSelectedAnswer(answer);
        if (answer === currentQuestion?.correctAnswer) {
            setScore(prev => prev + 1);
        }
    };

    const handleNextQuestion = () => {
        if (currentIndex < shuffledDeck.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(null);
        } else {
            setIsFinished(true);
        }
    };
    
    if (deck.length < 4) {
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
                            {score} / {shuffledDeck.length}
                        </p>
                        <p className="text-muted-foreground mt-2">
                           Tỷ lệ chính xác: {((score / shuffledDeck.length) * 100).toFixed(0)}%
                        </p>
                    </CardContent>
                    <CardFooter>
                         <Button onClick={startNewGame} className="w-full">
                            <RefreshCw className="mr-2 h-4 w-4" /> Làm lại bài kiểm tra
                        </Button>
                    </CardFooter>
                 </Card>
            </div>
        )
    }

    if (!currentQuestion) {
        return null;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-4 space-y-2">
                <Progress value={(currentIndex / shuffledDeck.length) * 100} />
                <p className="text-right text-sm text-muted-foreground">Câu {currentIndex + 1} trên {shuffledDeck.length}</p>
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
                            {currentIndex === shuffledDeck.length - 1 ? 'Xem kết quả' : 'Câu tiếp theo'}
                        </Button>
                     </CardFooter>
                )}
            </Card>
        </div>
    );
}
