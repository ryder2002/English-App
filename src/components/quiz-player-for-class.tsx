"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import type { VocabularyItem, QuizDirection } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ClipboardCheck, Loader2, CheckCircle2, XCircle } from "lucide-react";

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[] | null | undefined): T[] {
    // Safety check: ensure array is valid
    if (!array || !Array.isArray(array) || array.length === 0) {
        console.warn('shuffleArray: Invalid input, returning empty array', array);
        return [];
    }
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = newArray[i];
        newArray[i] = newArray[j];
        newArray[j] = temp;
    }
    return newArray;
}

type QuestionType = 'word_to_meaning' | 'meaning_to_word';

interface QuizQuestion {
    prompt: string;
    questionText: string;
    ipa?: string;
    questionType: QuestionType;
    options: string[];
    correctAnswer: string;
    originalItem: VocabularyItem;
}

interface QuizAnswer {
    vocabularyId: number | null;
    questionText: string;
    questionType: QuestionType;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
}

interface QuizPlayerForClassProps {
    vocabulary: VocabularyItem[];
    quizDirection: QuizDirection;
    onComplete: (answers: QuizAnswer[]) => void;
    resultId: number;
}

export function QuizPlayerForClass({ 
    vocabulary, 
    quizDirection, 
    onComplete,
    resultId 
}: QuizPlayerForClassProps) {
    const [quizDeck, setQuizDeck] = useState<VocabularyItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [answers, setAnswers] = useState<QuizAnswer[]>([]);
    const [isFinished, setIsFinished] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [submittedAnswers, setSubmittedAnswers] = useState<QuizAnswer[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [isMounted, setIsMounted] = useState(false); // New state for hydration

    const fullDeck = useMemo(() => {
        // Ensure vocabulary is an array
        if (!vocabulary || !Array.isArray(vocabulary)) {
            return [];
        }
        return vocabulary.filter(item => item && item.word && item.vietnameseTranslation);
    }, [vocabulary]);

    const startNewGame = (deckToUse: VocabularyItem[] | undefined = fullDeck) => {
        setIsLoading(true);
        setQuizDeck([]);
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setIsFinished(false);
        setAnswers([]);
        setSubmittedAnswers([]);
        setShowResults(false);

        // Ensure deckToUse is a valid array
        const safeDeck = Array.isArray(deckToUse) && deckToUse.length > 0 
            ? deckToUse 
            : (Array.isArray(fullDeck) && fullDeck.length > 0 ? fullDeck : []);
        
        if (safeDeck.length >= 4) {
            // Only shuffle on client side to avoid hydration mismatch
            if (typeof window !== 'undefined') {
                const shuffled = shuffleArray(safeDeck);
                setQuizDeck(shuffled.length > 0 ? shuffled : safeDeck);
            } else {
                setQuizDeck(safeDeck); // On server, keep order for consistency
            }
        } else {
            setQuizDeck([]);
        }
        setIsLoading(false);
    };

    // Ensure component is mounted (client-side only)
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted && fullDeck && Array.isArray(fullDeck) && fullDeck.length > 0) {
            startNewGame(fullDeck);
        } else if (isMounted && (!fullDeck || !Array.isArray(fullDeck) || fullDeck.length === 0)) {
            // If no vocabulary, set empty deck and stop loading
            setQuizDeck([]);
            setIsLoading(false);
        }
    }, [isMounted, vocabulary, quizDirection, fullDeck]);

    const currentQuestion: QuizQuestion | null = useMemo(() => {
        // Don't generate question during SSR or before mount
        if (!isMounted || isLoading || quizDeck.length === 0 || currentIndex >= quizDeck.length) return null;
        
        const questionItem = quizDeck[currentIndex];
        
        let questionType: QuestionType;
        if (quizDirection === 'random') {
            // Use a deterministic approach based on index to avoid hydration mismatch
            questionType = (currentIndex % 2 === 0) ? 'word_to_meaning' : 'meaning_to_word';
        } else {
            questionType = quizDirection === 'en-vi' ? 'word_to_meaning' : 'meaning_to_word';
        }
        
        const isWordToMeaning = questionType === 'word_to_meaning';

        const correctAnswer = isWordToMeaning ? questionItem.vietnameseTranslation : questionItem.word;
        const answerPool = Array.isArray(fullDeck) ? fullDeck.filter(item => item && item.id !== questionItem.id) : [];

        // Get unique wrong answers - shuffle only on client
        let shuffledPool = answerPool;
        if (typeof window !== 'undefined') {
            shuffledPool = shuffleArray([...answerPool]);
        }
        
        const wrongAnswerCandidates = shuffledPool.map(item => 
            item && (isWordToMeaning ? item.vietnameseTranslation : item.word)
        ).filter(Boolean); // Filter out null/undefined from map
        const uniqueWrongAnswers = [...new Set(wrongAnswerCandidates)].filter(ans => ans !== correctAnswer);
        
        const wrongAnswers = uniqueWrongAnswers.slice(0, 3);

        let options = [correctAnswer, ...wrongAnswers];
        // Shuffle only on client
        if (typeof window !== 'undefined') {
            options = shuffleArray([...options]);
        }
        
        // Ensure 4 unique options if possible
        if (options.length < 4 && Array.isArray(fullDeck) && fullDeck.length >= 4) {
            const moreCandidates = [...new Set(fullDeck.map(item => item && (isWordToMeaning ? item.vietnameseTranslation : item.word)).filter(Boolean))];
            let moreWrongAnswers = moreCandidates.filter(ans => !options.includes(ans));
            
            if (typeof window !== 'undefined') {
                moreWrongAnswers = shuffleArray([...moreWrongAnswers]);
            }
            
            options.push(...moreWrongAnswers.slice(0, 4 - options.length));
        }

        return {
            prompt: isWordToMeaning ? "Nghĩa của từ sau là gì?" : "Từ nào có nghĩa là:",
            questionText: isWordToMeaning ? questionItem.word : questionItem.vietnameseTranslation,
            ipa: isWordToMeaning ? questionItem.ipa : undefined,
            questionType,
            options: typeof window !== 'undefined' ? shuffleArray([...options]) : options, // Shuffle options only on client
            correctAnswer,
            originalItem: questionItem,
        };

    }, [quizDeck, currentIndex, fullDeck, isLoading, quizDirection, isMounted]); // Added isMounted to dependency array

    const handleAnswerSelect = (answer: string) => {
        if (selectedAnswer || !currentQuestion) return;

        setSelectedAnswer(answer);

        // Save answer (calculate isCorrect but don't show it until submit)
        const isCorrect = answer === currentQuestion.correctAnswer;
        const answerData: QuizAnswer = {
            vocabularyId: currentQuestion.originalItem.id ? parseInt(currentQuestion.originalItem.id) : null,
            questionText: currentQuestion.questionText,
            questionType: currentQuestion.questionType,
            selectedAnswer: answer,
            correctAnswer: currentQuestion.correctAnswer,
            isCorrect: isCorrect,
        };

        const newAnswers = [...answers, answerData];
        setAnswers(newAnswers);

        // Move to next question after a short delay
        setTimeout(() => {
            if (currentIndex < quizDeck.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setSelectedAnswer(null);
            } else {
                // All questions answered, ready to submit
                setIsFinished(true);
                setSubmittedAnswers(newAnswers);
            }
        }, 500);
    };

    const handleSubmit = () => {
        // Call onComplete with all answers
        onComplete(submittedAnswers.length > 0 ? submittedAnswers : answers);
        setShowResults(true);
    };

    if (!isMounted || isLoading) { // Check isMounted here
        return (
            <div className="flex flex-col items-center justify-center text-center p-10 h-96">
                <Loader2 className="h-12 w-12 text-muted-foreground animate-spin mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Đang tải bài kiểm tra...</p>
            </div>
        )
    }
    
    if (fullDeck.length < 4) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg h-96 bg-card">
                <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Không đủ từ vựng để kiểm tra.</p>
                <p className="text-sm text-muted-foreground">
                    Cần có ít nhất 4 từ khác nhau để bắt đầu bài trắc nghiệm.
                </p>
            </div>
        );
    }

    if (showResults && submittedAnswers.length > 0) {
        const correctCount = submittedAnswers.filter(a => a.isCorrect).length;
        const totalCount = submittedAnswers.length;
        const accuracy = totalCount > 0 ? ((correctCount / totalCount) * 100).toFixed(0) : 0;

        return (
            <div className="max-w-4xl mx-auto space-y-4">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Kết quả bài kiểm tra</CardTitle>
                        <CardDescription>Bạn đã hoàn thành bài kiểm tra</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-primary mb-2">
                                {correctCount} / {totalCount}
                            </div>
                            <p className="text-muted-foreground">
                                Tỷ lệ chính xác: {accuracy}%
                            </p>
                        </div>

                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {submittedAnswers.map((answer, index) => (
                                <Card 
                                    key={index} 
                                    className={cn(
                                        "p-4",
                                        answer.isCorrect ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                            {answer.isCorrect ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold mb-1">
                                                Câu {index + 1}: {answer.questionText}
                                                <span className="ml-2 text-xs text-muted-foreground">
                                                    ({answer.questionType === 'word_to_meaning' ? 'Từ → Nghĩa' : 'Nghĩa → Từ'})
                                                </span>
                                            </div>
                                            <div className="text-sm space-y-1">
                                                <div>
                                                    <span className="text-muted-foreground">Đáp án của bạn: </span>
                                                    <span className={answer.isCorrect ? "text-green-600 dark:text-green-400 font-medium" : "text-red-600 dark:text-red-400 font-medium"}>
                                                        {answer.selectedAnswer}
                                                    </span>
                                                </div>
                                                {!answer.isCorrect && (
                                                    <div>
                                                        <span className="text-muted-foreground">Đáp án đúng: </span>
                                                        <span className="text-green-600 dark:text-green-400 font-medium">
                                                            {answer.correctAnswer}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={() => onComplete(submittedAnswers)} className="w-full">
                            Quay về lớp học
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (!currentQuestion) {
       return (
             <div className="flex flex-col items-center justify-center text-center p-10 h-96">
                <Loader2 className="h-12 w-12 text-muted-foreground animate-spin mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Đang tạo câu hỏi...</p>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-4 space-y-2">
                <Progress value={((currentIndex + 1) / quizDeck.length) * 100} />
                <p className="text-right text-sm text-muted-foreground">Câu {currentIndex + 1} trên {quizDeck.length}</p>
            </div>
            <Card>
                <CardHeader>
                    <CardDescription>{currentQuestion.prompt}</CardDescription>
                    <CardTitle className={cn(
                        "text-4xl md:text-5xl font-bold text-center py-10 min-h-[180px] flex flex-col items-center justify-center",
                        currentQuestion.questionType === 'word_to_meaning' ? "font-headline" : ""
                    )}>
                        <span>{currentQuestion.questionText}</span>
                        {currentQuestion.ipa && (
                            <span className="text-2xl text-muted-foreground font-normal mt-2">
                                {currentQuestion.ipa}
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {currentQuestion.options.map((option, index) => {
                       const isSelected = option === selectedAnswer;
                       
                       return (
                            <Button
                                key={index}
                                variant="outline"
                                className={cn("h-auto p-4 justify-start text-base whitespace-normal text-left",
                                    isSelected && "border-primary text-primary-foreground bg-primary/10", // Highlight selected answer
                                )}
                                onClick={() => handleAnswerSelect(option)}
                                disabled={!!selectedAnswer}
                            >
                                <div className="flex-grow">{option}</div>
                                {isSelected && <CheckCircle2 className="h-5 w-5 text-primary ml-2 shrink-0" />}
                            </Button>
                       )
                   })}
                </CardContent>
                {isFinished && (
                    <CardFooter className="flex justify-end">
                        <Button onClick={handleSubmit}>Nộp bài</Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
