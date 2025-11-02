"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import type { VocabularyItem, QuizDirection } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ClipboardCheck, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "./ui/badge";

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
    quizId?: number; // Quiz ID for real-time answer submission
    timePerQuestion?: number; // Time in seconds, 0 or undefined = no auto-advance
    isPaused?: boolean; // If quiz is paused by admin
    onHome?: () => void; // Callback when user wants to go home
    onAnswerSubmitted?: (answer: QuizAnswer, newScore: number) => void; // Callback when answer is submitted
}

export function QuizPlayerForClass({ 
    vocabulary, 
    quizDirection, 
    onComplete,
    resultId,
    quizId,
    timePerQuestion = 0,
    isPaused = false,
    onHome,
    onAnswerSubmitted
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
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null); // Timer for auto-advance
    const [currentScore, setCurrentScore] = useState(0); // Real-time score
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null); // Current answer feedback

    const fullDeck = useMemo(() => {
        // Ensure vocabulary is an array
        if (!vocabulary || !Array.isArray(vocabulary)) {
            return [];
        }
        return vocabulary.filter(item => item && item.word && item.vietnameseTranslation);
    }, [vocabulary]);

    const startNewGame = (deckToUse: VocabularyItem[] | undefined = fullDeck) => {
        setIsLoading(true);
        
        // Ensure deckToUse is a valid array
        const safeDeck = Array.isArray(deckToUse) && deckToUse.length > 0 
            ? deckToUse 
            : (Array.isArray(fullDeck) && fullDeck.length > 0 ? fullDeck : []);
        
        if (safeDeck.length >= 4) {
            // Only shuffle on client side ONCE when starting the game
            // Shuffle the deck deterministically or randomly based on client-side
            if (typeof window !== 'undefined') {
                // Shuffle once and store it - this prevents re-shuffling on every render
                const shuffled = shuffleArray([...safeDeck]);
                setQuizDeck(shuffled.length > 0 ? shuffled : safeDeck);
            } else {
                // Server-side: keep order for consistency
                setQuizDeck(safeDeck);
            }
            
            // Reset game state
            setCurrentIndex(0);
            setSelectedAnswer(null);
            setIsFinished(false);
            setAnswers([]);
            setSubmittedAnswers([]);
            setShowResults(false);
            setTimeRemaining(null);
            setCurrentScore(0);
            setFeedback(null);
        } else {
            setQuizDeck([]);
        }
        setIsLoading(false);
    };

    // Ensure component is mounted (client-side only)
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Initialize game once when mounted and vocabulary is ready
    useEffect(() => {
        if (!isMounted) return;
        
        if (fullDeck && Array.isArray(fullDeck) && fullDeck.length > 0 && quizDeck.length === 0) {
            // Only start if deck is empty (first time or reset)
            startNewGame(fullDeck);
        } else if ((!fullDeck || !Array.isArray(fullDeck) || fullDeck.length === 0) && quizDeck.length > 0) {
            // If vocabulary becomes empty, clear deck
            setQuizDeck([]);
            setIsLoading(false);
        }
        // Only run when mounted state or vocabulary changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMounted, vocabulary]);

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

        // Get unique wrong answers - use deterministic order based on currentIndex to avoid re-shuffling
        const wrongAnswerCandidates = answerPool.map(item => 
            item && (isWordToMeaning ? item.vietnameseTranslation : item.word)
        ).filter(Boolean); // Filter out null/undefined from map
        
        // Use Set to ensure uniqueness, then sort deterministically by currentIndex
        const uniqueWrongAnswers = [...new Set(wrongAnswerCandidates)]
            .filter(ans => ans !== correctAnswer)
            .sort() // Deterministic sort
            .slice(0, 10); // Get more candidates, we'll pick from them
        
        // Pick wrong answers deterministically based on currentIndex
        const wrongAnswers = uniqueWrongAnswers
            .slice((currentIndex % uniqueWrongAnswers.length), (currentIndex % uniqueWrongAnswers.length) + 3)
            .concat(uniqueWrongAnswers.slice(0, Math.max(0, 3 - (uniqueWrongAnswers.length - (currentIndex % uniqueWrongAnswers.length)))))
            .slice(0, 3);

        let options = [correctAnswer, ...wrongAnswers];
        
        // Shuffle options deterministically based on currentIndex (for same question, same order)
        // This ensures the same question always shows options in the same order
        if (typeof window !== 'undefined') {
            // Use a seeded shuffle based on currentIndex for consistency
            const seed = currentIndex;
            for (let i = options.length - 1; i > 0; i--) {
                const j = (seed + i) % (i + 1);
                const temp = options[i];
                options[i] = options[j];
                options[j] = temp;
            }
        }
        
        // Ensure 4 unique options if possible
        if (options.length < 4 && Array.isArray(fullDeck) && fullDeck.length >= 4) {
            const moreCandidates = [...new Set(fullDeck.map(item => item && (isWordToMeaning ? item.vietnameseTranslation : item.word)).filter(Boolean))];
            const moreWrongAnswers = moreCandidates
                .filter(ans => !options.includes(ans))
                .sort()
                .slice(0, 4 - options.length);
            
            options.push(...moreWrongAnswers);
        }

        return {
            prompt: isWordToMeaning ? "🇬🇧 Nghĩa của từ sau là gì?" : "🇻🇳 Từ nào có nghĩa là:",
            questionText: isWordToMeaning ? questionItem.word : questionItem.vietnameseTranslation,
            ipa: isWordToMeaning ? questionItem.ipa : undefined,
            questionType,
            options: options,
            correctAnswer,
            originalItem: questionItem,
        };

    }, [quizDeck, currentIndex, fullDeck, isLoading, quizDirection, isMounted]); // Added isMounted to dependency array

    // Use ref to avoid recreating function and causing timer resets
    const handleAutoAdvanceRef = useRef<() => void>();
    
    useEffect(() => {
        handleAutoAdvanceRef.current = () => {
            if (selectedAnswer || !currentQuestion) return;
            
            // Auto-select first option (or random) - or just skip
            // For now, we'll just move to next question
            if (currentIndex < quizDeck.length - 1) {
                // Save empty answer
                const answerData: QuizAnswer = {
                    vocabularyId: currentQuestion.originalItem.id ? parseInt(currentQuestion.originalItem.id) : null,
                    questionText: currentQuestion.questionText,
                    questionType: currentQuestion.questionType,
                    selectedAnswer: '', // No answer selected
                    correctAnswer: currentQuestion.correctAnswer,
                    isCorrect: false,
                };
                
                setAnswers(prev => [...prev, answerData]);
                
                setCurrentIndex(prev => prev + 1);
                setSelectedAnswer(null);
            } else {
                // All questions answered, ready to submit
                setIsFinished(true);
                setSubmittedAnswers(prev => [...prev]);
            }
        };
    }, [selectedAnswer, currentQuestion, currentIndex, quizDeck.length]);

    // Track previous index to detect actual question changes
    const prevIndexRef = useRef<number>(-1);
    
    // Auto-advance timer effect
    useEffect(() => {
        // Stop timer if conditions are met
        if (isPaused || isFinished || selectedAnswer || !currentQuestion) {
            setTimeRemaining(null);
            prevIndexRef.current = currentIndex; // Update ref even when stopping
            return;
        }

        // Only start/reset timer if:
        // 1. currentIndex actually changed (new question)
        // 2. timePerQuestion is set
        const indexChanged = prevIndexRef.current !== currentIndex;
        
        if (timePerQuestion && timePerQuestion > 0) {
            if (indexChanged) {
                // New question - reset timer
                prevIndexRef.current = currentIndex;
                setTimeRemaining(timePerQuestion);
            }
            
            // Start interval if timer isn't already running
            const interval = setInterval(() => {
                // Re-check conditions inside interval
                if (isPaused || isFinished || selectedAnswer || !currentQuestion) {
                    setTimeRemaining(null);
                    return;
                }
                
                setTimeRemaining(prev => {
                    // If timer was reset externally (shouldn't happen), use timePerQuestion
                    if (prev === null || prev === undefined) {
                        return timePerQuestion;
                    }
                    
                    if (prev <= 1) {
                        // Time's up, auto-advance
                        if (handleAutoAdvanceRef.current) {
                            handleAutoAdvanceRef.current();
                        }
                        return null;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(interval);
        } else {
            setTimeRemaining(null);
            prevIndexRef.current = currentIndex;
        }
        // Only depend on currentIndex and conditions, NOT currentQuestion or handleAutoAdvance
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, isPaused, isFinished, selectedAnswer, timePerQuestion]);

    const handleAnswerSelect = async (answer: string) => {
        if (selectedAnswer || !currentQuestion) return;

        setSelectedAnswer(answer);
        setTimeRemaining(null); // Stop timer

        // Calculate isCorrect immediately
        const isCorrect = answer === currentQuestion.correctAnswer;
        const answerData: QuizAnswer = {
            vocabularyId: currentQuestion.originalItem.id ? parseInt(currentQuestion.originalItem.id) : null,
            questionText: currentQuestion.questionText,
            questionType: currentQuestion.questionType,
            selectedAnswer: answer,
            correctAnswer: currentQuestion.correctAnswer,
            isCorrect: isCorrect,
        };

        // Show feedback immediately
        setFeedback(isCorrect ? 'correct' : 'incorrect');
        
        // Update score immediately
        const newScore = isCorrect ? currentScore + 1 : currentScore;
        setCurrentScore(newScore);

        const newAnswers = [...answers, answerData];
        setAnswers(newAnswers);

        // Submit answer to server in real-time if quizId is provided
        if (quizId) {
            try {
                const res = await fetch(`/api/quizzes/${quizId}/answer`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        resultId,
                        answer: answerData,
                    }),
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.currentScore !== undefined) {
                        setCurrentScore(data.currentScore);
                    }
                    // Callback to notify parent component
                    if (onAnswerSubmitted) {
                        onAnswerSubmitted(answerData, data.currentScore || newScore);
                    }
                }
            } catch (error) {
                console.error('Failed to submit answer:', error);
            }
        }

        // Move to next question after showing feedback
        const feedbackDelay = 1000; // Show feedback for 1 second
        const nextQuestionDelay = (isPaused || !timePerQuestion || timePerQuestion === 0) ? 800 : 500;
        
        setTimeout(() => {
            setFeedback(null); // Clear feedback
            
            if (currentIndex < quizDeck.length - 1) {
                // Use functional update to ensure we're using the latest state
                setCurrentIndex(prevIndex => {
                    if (prevIndex < quizDeck.length - 1) {
                        return prevIndex + 1;
                    }
                    return prevIndex;
                });
                setSelectedAnswer(null);
            } else {
                // All questions answered, ready to submit
                setIsFinished(true);
                setSubmittedAnswers(newAnswers);
            }
        }, feedbackDelay + nextQuestionDelay);
    };

    const handleSubmit = async () => {
        // Final submission - submit all answers if not already submitted
        const finalAnswers = submittedAnswers.length > 0 ? submittedAnswers : answers;
        
        // Call onComplete to submit final results
        onComplete(finalAnswers);
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
        const isExcellent = Number(accuracy) >= 80;
        const isGood = Number(accuracy) >= 60;

        return (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in-0 zoom-in-95 duration-500">
                <Card className={cn(
                    "border-2 shadow-soft overflow-hidden",
                    isExcellent && "border-green-400 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20",
                    !isExcellent && isGood && "border-yellow-400 bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-amber-900/20",
                    !isGood && "border-red-400 bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 dark:from-red-900/20 dark:via-rose-900/20 dark:to-pink-900/20"
                )}>
                    <CardHeader className="text-center pb-6">
                        <div className="mb-4">
                            {isExcellent && (
                                <div className="text-6xl mb-4 animate-bounce-slow">🎉</div>
                            )}
                            {!isExcellent && isGood && (
                                <div className="text-6xl mb-4 animate-bounce-slow">👍</div>
                            )}
                            {!isGood && (
                                <div className="text-6xl mb-4 animate-bounce-slow">💪</div>
                            )}
                        </div>
                        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                            Kết quả bài kiểm tra
                        </CardTitle>
                        <CardDescription className="text-lg">Bạn đã hoàn thành bài kiểm tra!</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="text-center space-y-4">
                            <div className="inline-flex flex-col items-center gap-2 px-8 py-6 rounded-2xl bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-pink-900/30 border-2 border-blue-200 dark:border-blue-800 shadow-lg">
                                <div className={cn(
                                    "text-6xl font-bold mb-2 bg-gradient-to-r bg-clip-text text-transparent",
                                    isExcellent && "from-green-600 to-emerald-600",
                                    !isExcellent && isGood && "from-yellow-600 to-orange-600",
                                    !isGood && "from-red-600 to-rose-600"
                                )}>
                                    {correctCount} / {totalCount}
                                </div>
                                <div className="text-2xl font-semibold text-muted-foreground">
                                    Tỷ lệ chính xác: <span className={cn(
                                        "font-bold",
                                        isExcellent && "text-green-600",
                                        !isExcellent && isGood && "text-yellow-600",
                                        !isGood && "text-red-600"
                                    )}>{accuracy}%</span>
                                </div>
                            </div>
                        </div>
                        
                        {onHome && (
                            <div className="flex justify-center pt-4">
                                <Button 
                                    onClick={onHome} 
                                    size="lg"
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-lg px-8 py-6 rounded-xl"
                                >
                                    🏠 Quay về trang chủ
                                </Button>
                            </div>
                        )}

                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {submittedAnswers.map((answer, index) => (
                                <Card 
                                    key={index} 
                                    className={cn(
                                        "p-5 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] shadow-sm",
                                        answer.isCorrect 
                                            ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700 hover:shadow-glow-green" 
                                            : "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-300 dark:border-red-700 hover:shadow-glow-red"
                                    )}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-md",
                                            answer.isCorrect 
                                                ? "bg-gradient-to-br from-green-500 to-emerald-600" 
                                                : "bg-gradient-to-br from-red-500 to-rose-600"
                                        )}>
                                            {answer.isCorrect ? (
                                                <CheckCircle2 className="h-5 w-5 text-white" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-white" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-lg mb-2">
                                                <span className="text-muted-foreground">Câu {index + 1}:</span>{' '}
                                                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                    {answer.questionText}
                                                </span>
                                                <span className="ml-2 text-xs text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                                                    {answer.questionType === 'word_to_meaning' ? '📝 Từ → Nghĩa' : '📚 Nghĩa → Từ'}
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-muted-foreground font-medium">Đáp án của bạn:</span>
                                                    <Badge className={cn(
                                                        "font-semibold",
                                                        answer.isCorrect 
                                                            ? "bg-green-500 text-white" 
                                                            : "bg-red-500 text-white"
                                                    )}>
                                                        {answer.selectedAnswer}
                                                    </Badge>
                                                </div>
                                                {!answer.isCorrect && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-muted-foreground font-medium">Đáp án đúng:</span>
                                                        <Badge className="bg-green-500 text-white font-semibold">
                                                            {answer.correctAnswer}
                                                        </Badge>
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
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Progress và thông tin với gradient */}
            <div className="space-y-4 p-6 rounded-2xl bg-gradient-to-r from-white/80 via-blue-50/80 to-purple-50/80 dark:from-gray-800/80 dark:via-blue-900/20 dark:to-purple-900/20 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-soft">
                <Progress 
                    value={((currentIndex + 1) / quizDeck.length) * 100} 
                    className="h-3 rounded-full bg-gray-200 dark:bg-gray-700"
                />
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200 dark:border-blue-800 shadow-sm">
                            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                Câu {currentIndex + 1}/{quizDeck.length}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-800 shadow-sm">
                            <span className="text-sm font-semibold text-green-700 dark:text-green-300">Điểm:</span>
                            <span className="text-2xl font-bold text-green-900 dark:text-green-100">{currentScore}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {timeRemaining !== null && timePerQuestion && timePerQuestion > 0 && !isPaused && (
                            <div className={cn(
                                "px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-sm",
                                timeRemaining <= 3 
                                    ? "bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 animate-pulse" 
                                    : "bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                            )}>
                                <span className="text-sm">⏱️ </span>
                                <span className={cn(
                                    "font-bold text-lg",
                                    timeRemaining <= 3 && "animate-pulse"
                                )}>
                                    {timeRemaining}s
                                </span>
                            </div>
                        )}
                        {isPaused && (
                            <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 font-semibold shadow-sm">
                                ⏸️ Đã tạm dừng
                            </div>
                        )}
                        {feedback === 'correct' && (
                            <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-base shadow-md shadow-glow-green animate-bounce">
                                ✅ Đúng!
                            </div>
                        )}
                        {feedback === 'incorrect' && (
                            <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold text-base shadow-md shadow-glow-red animate-bounce">
                                ❌ Sai
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Question Card với animations */}
            <Card className={cn(
                "border-2 shadow-soft transition-all duration-500 overflow-hidden",
                feedback === 'correct' && 'border-green-400 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 shadow-glow-green',
                feedback === 'incorrect' && 'border-red-400 bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 dark:from-red-900/20 dark:via-rose-900/20 dark:to-pink-900/20 shadow-glow-red',
                !feedback && 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            )}>
                <CardHeader className="pb-6">
                    <CardDescription className="text-lg font-medium text-center mb-4">
                        {currentQuestion.prompt}
                    </CardDescription>
                    <CardTitle className={cn(
                        "text-5xl md:text-6xl font-bold text-center py-12 min-h-[200px] flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl mx-4",
                        currentQuestion.questionType === 'word_to_meaning' ? "font-headline" : "",
                        "animate-in fade-in-0 zoom-in-95 duration-300"
                    )}>
                        <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            {currentQuestion.questionText}
                        </span>
                        {currentQuestion.ipa && (
                            <span className="text-3xl text-muted-foreground font-normal mt-3 opacity-75">
                                [{currentQuestion.ipa}]
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
                   {currentQuestion.options.map((option, index) => {
                       const isSelected = option === selectedAnswer;
                       const isCorrect = option === currentQuestion.correctAnswer;
                       const showFeedback = feedback !== null && isSelected;
                       
                       return (
                            <Button
                                key={index}
                                variant="outline"
                                className={cn(
                                    "h-auto p-6 justify-start text-lg whitespace-normal text-left transition-all duration-300 rounded-xl font-medium shadow-sm border-2",
                                    "hover:scale-105 hover:shadow-md",
                                    showFeedback && isCorrect && "bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-green-600 text-white shadow-glow-green animate-pulse-slow",
                                    showFeedback && !isCorrect && "bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 border-red-600 text-white shadow-glow-red",
                                    !showFeedback && isSelected && "bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500 text-blue-700 dark:text-blue-300 shadow-md",
                                    !showFeedback && !isSelected && "hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50 dark:hover:from-gray-700 dark:hover:to-blue-900/20 border-gray-200 dark:border-gray-700"
                                )}
                                onClick={() => handleAnswerSelect(option)}
                                disabled={!!selectedAnswer}
                            >
                                <div className="flex items-center gap-3 flex-grow">
                                    <div className={cn(
                                        "h-10 w-10 rounded-lg flex items-center justify-center font-bold text-lg shrink-0 transition-all duration-300",
                                        showFeedback && isCorrect && "bg-white/20",
                                        showFeedback && !isCorrect && "bg-white/20",
                                        !showFeedback && isSelected && "bg-blue-500 text-white",
                                        !showFeedback && !isSelected && "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                    )}>
                                        {String.fromCharCode(65 + index)}
                                    </div>
                                    <div className="flex-grow text-left">{option}</div>
                                </div>
                                <div className="ml-3 shrink-0">
                                    {showFeedback && isCorrect && (
                                        <CheckCircle2 className="h-6 w-6 animate-in zoom-in-95 duration-300" />
                                    )}
                                    {showFeedback && !isCorrect && (
                                        <XCircle className="h-6 w-6 animate-in zoom-in-95 duration-300" />
                                    )}
                                    {!showFeedback && isSelected && (
                                        <div className="h-6 w-6 rounded-full bg-blue-500 border-2 border-blue-700 animate-pulse" />
                                    )}
                                </div>
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
