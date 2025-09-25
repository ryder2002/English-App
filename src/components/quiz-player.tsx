
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

type QuestionType = 'word_to_meaning' | 'meaning_to_word';

interface QuizQuestion {
    prompt: string;
    questionText: string;
    questionType: QuestionType;
    options: string[];
    correctAnswer: string;
    originalItem: VocabularyItem;
}


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
        if (deckToUse.length === 0) {
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

    const currentQuestion: QuizQuestion | null = useMemo(() => {
        if (quizDeck.length === 0 || currentIndex >= quizDeck.length) return null;
        
        const questionItem = quizDeck[currentIndex];
        
        // Randomly decide the question type
        const questionType: QuestionType = Math.random() < 0.5 ? 'word_to_meaning' : 'meaning_to_word';
        
        const isWordToMeaning = questionType === 'word_to_meaning';

        const correctAnswer = isWordToMeaning ? questionItem.vietnameseTranslation : questionItem.word;
        const answerPool = fullDeck.filter(item => item.id !== questionItem.id);

        // Get unique wrong answers
        const wrongAnswerCandidates = shuffleArray(answerPool).map(item => isWordToMeaning ? item.vietnameseTranslation : item.word);
        const uniqueWrongAnswers = [...new Set(wrongAnswerCandidates)].filter(ans => ans !== correctAnswer);
        
        const wrongAnswers = uniqueWrongAnswers.slice(0, 3);

        let options = shuffleArray([correctAnswer, ...wrongAnswers]);
        
        // Ensure 4 unique options if possible
        if (options.length < 4) {
            const moreWrongAnswers = shuffleArray(
                [...new Set(fullDeck.map(item => isWordToMeaning ? item.vietnameseTranslation : item.word))]
            ).filter(ans => !options.includes(ans));
            
            options.push(...moreWrongAnswers.slice(0, 4 - options.length));
        }

        // Final check for duplicates, although highly unlikely now
        options = [...new Set(options)];
        // Fill with random if still not enough (edge case for very small decks)
        let i = 0;
        while (options.length < 4 && fullDeck.length > 1) {
            const randomItem = fullDeck[Math.floor(Math.random() * fullDeck.length)];
            const randomAnswer = isWordToMeaning ? randomItem.vietnameseTranslation : randomItem.word;
            if (!options.includes(randomAnswer)) {
                options.push(randomAnswer);
            }
            if (i++ > 10) break; // safety break
        }


        return {
            prompt: isWordToMeaning ? "Nghĩa của từ sau là gì?" : "Từ nào có nghĩa là:",
            questionText: isWordToMeaning ? questionItem.word : questionItem.vietnameseTranslation,
            questionType,
            options: shuffleArray(options),
            correctAnswer,
            originalItem: questionItem,
        };

    }, [quizDeck, currentIndex, fullDeck]);

    const handleAnswerSelect = (answer: string) => {
        if (selectedAnswer || !currentQuestion) return; // Already answered

        setSelectedAnswer(answer);
        if (answer === currentQuestion.correctAnswer) {
            setScore(prev => prev + 1);
        } else {
            const incorrectItem = currentQuestion.originalItem;
            if (incorrectItem && !incorrectAnswers.find(item => item.id === incorrectItem.id)) {
                setIncorrectAnswers(prev => [...prev, incorrectItem]);
            }
        }
        setTimeout(() => {
            if (currentIndex < quizDeck.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setSelectedAnswer(null);
            } else {
                setIsFinished(true);
            }
        }, 1000);
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
        if (incorrectAnswers.length > 0) {
            startNewGame(incorrectAnswers);
        }
    };
    
    if (fullDeck.length === 0) { // Check fullDeck for initial message
        return (
             <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg h-96 bg-card">
                <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Không có từ vựng để kiểm tra.</p>
                <p className="text-sm text-muted-foreground">
                Hãy thêm từ vào thư mục này để tạo bài kiểm tra.
                </p>
            </div>
        );
    }
    
    // This case handles when the deck is too small to even start.
    if (quizDeck.length === 0 && !isFinished) {
         return (
            <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg h-96 bg-card">
                <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Không đủ từ để bắt đầu.</p>
                <p className="text-sm text-muted-foreground">
                    Cần có ít nhất 1 từ để bắt đầu bài kiểm tra.
                </p>
                <Button onClick={() => startNewGame(fullDeck)} className="mt-4">
                    <RefreshCw className="mr-2 h-4 w-4" /> Bắt đầu lại
                </Button>
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
        // This handles the case where the memoization is running or something went wrong.
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
                    <CardDescription>{currentQuestion.prompt}</CardDescription>
                    <CardTitle className={cn(
                        "text-4xl md:text-5xl font-bold text-center py-10",
                        currentQuestion.questionType === 'word_to_meaning' ? "font-headline" : ""
                    )}>
                        {currentQuestion.questionText}
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
                                className={cn("h-auto p-4 justify-start text-base whitespace-normal text-left",
                                    selectedAnswer && isCorrect && "bg-green-100 border-green-400 text-green-800 hover:bg-green-200 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300",
                                    selectedAnswer && isSelected && !isCorrect && "bg-red-100 border-red-400 text-red-800 hover:bg-red-200 dark:bg-red-900/50 dark:border-red-700 dark:text-red-300",
                                )}
                                onClick={() => handleAnswerSelect(option)}
                                disabled={!!selectedAnswer}
                            >
                                <div className="flex-grow">{option}</div>
                                {selectedAnswer && isCorrect && <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 ml-2 shrink-0"/>}
                                {selectedAnswer && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 ml-2 shrink-0"/>}
                            </Button>
                       )
                   })}
                </CardContent>
            </Card>
        </div>
    );
}
