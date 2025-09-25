
'use client';

import { useVocabulary } from "@/contexts/vocabulary-context";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { cn } from "@/lib/utils";
import { RefreshCw, Trophy, ArrowRightCircle } from "lucide-react";
import type { VocabularyItem } from "@/lib/types";

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

const CARDS_PER_GAME = 8; // Number of pairs per game session

type CardType = 'word' | 'meaning';

interface GameCard {
  id: string; 
  pairId: string; 
  type: CardType;
  content: string;
  isMatched: boolean;
}

interface MatchingGamePlayerProps {
    selectedFolder: string;
}

export function MatchingGamePlayer({ selectedFolder }: MatchingGamePlayerProps) {
    const { vocabulary } = useVocabulary();
    const [gameCards, setGameCards] = useState<GameCard[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [isFinished, setIsFinished] = useState(false);
    const [moves, setMoves] = useState(0);
    const [incorrectPair, setIncorrectPair] = useState<[number, number] | null>(null);

    const [unplayedDeck, setUnplayedDeck] = useState<VocabularyItem[]>([]);
    const [sessionDeck, setSessionDeck] = useState<VocabularyItem[]>([]);

    const fullDeck = useMemo(() => {
        return selectedFolder === 'all'
            ? vocabulary
            : vocabulary.filter(item => item.folder === selectedFolder);
    }, [vocabulary, selectedFolder]);

    // This effect initializes or resets the game when the source deck changes (e.g., folder switch)
    useEffect(() => {
        handleRestartAll();
    }, [fullDeck]);

    const startNewGame = useCallback((deck: VocabularyItem[]) => {
        if (deck.length === 0) {
            setGameCards([]);
            setSessionDeck([]);
            // This can happen if the last session used up all cards.
            // We can consider this "finished" in a way.
            setIsFinished(true);
            return;
        }

        const newGamePairs = deck.flatMap(item => [
            { id: `word-${item.id}`, pairId: item.id, type: 'word', content: item.word, isMatched: false },
            { id: `meaning-${item.id}`, pairId: item.id, type: 'meaning', content: item.vietnameseTranslation, isMatched: false }
        ]);

        setGameCards(shuffleArray(newGamePairs));
        setSelectedIndex(null);
        setIsFinished(false);
        setMoves(0);
        setIncorrectPair(null);
    }, []);

    const handleNextSession = () => {
        const nextSessionItems = unplayedDeck.slice(0, CARDS_PER_GAME);
        setSessionDeck(nextSessionItems);
        setUnplayedDeck(prev => prev.slice(CARDS_PER_GAME));
        startNewGame(nextSessionItems);
    };

    const handleRestartAll = () => {
        const shuffledFullDeck = shuffleArray(fullDeck);
        const nextSessionItems = shuffledFullDeck.slice(0, CARDS_PER_GAME);
        
        setUnplayedDeck(shuffledFullDeck.slice(CARDS_PER_GAME));
        setSessionDeck(nextSessionItems);
        startNewGame(nextSessionItems);
    };

    const handleCardClick = (clickedIndex: number) => {
        if (gameCards[clickedIndex].isMatched || selectedIndex === clickedIndex || incorrectPair) {
            return;
        }
        
        if (selectedIndex === null) {
            setSelectedIndex(clickedIndex);
        } else {
            setMoves(prev => prev + 1);
            const firstCard = gameCards[selectedIndex];
            const secondCard = gameCards[clickedIndex];

            if (firstCard.pairId === secondCard.pairId) {
                // Match found
                const newGameCards = gameCards.map(card => 
                    card.pairId === firstCard.pairId ? { ...card, isMatched: true } : card
                );
                setGameCards(newGameCards);
                setSelectedIndex(null);
                 if (newGameCards.every(card => card.isMatched)) {
                    setIsFinished(true);
                }
            } else {
                // No match
                setIncorrectPair([selectedIndex, clickedIndex]);
                setTimeout(() => {
                    setIncorrectPair(null);
                    setSelectedIndex(null);
                }, 800);
            }
        }
    };
    
    if (fullDeck.length < 2) {
        return (
             <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg h-96 bg-card">
                <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Không đủ từ vựng để chơi.</p>
                <p className="text-sm text-muted-foreground">
                    Cần có ít nhất 2 từ trong thư mục này để bắt đầu trò chơi ghép thẻ.
                </p>
            </div>
        );
    }
    
     if (isFinished) {
        return (
            <div className="max-w-2xl mx-auto">
                 <Card>
                    <CardHeader className="items-center">
                        <CardTitle className="text-2xl">
                             {sessionDeck.length > 0 ? "Tuyệt vời!" : "Hoàn thành!"}
                        </CardTitle>
                        <CardDescription>
                            {sessionDeck.length > 0
                                ? "Bạn đã ghép đúng tất cả các thẻ."
                                : "Bạn đã ôn tập tất cả các từ trong thư mục này."
                            }
                        </CardDescription>
                    </CardHeader>
                     {sessionDeck.length > 0 && (
                        <CardContent className="text-center">
                            <p className="text-4xl font-bold">
                                {moves}
                            </p>
                            <p className="text-muted-foreground mt-2">
                            lượt đoán
                            </p>
                        </CardContent>
                     )}
                    <CardFooter className="flex flex-col gap-2">
                         {unplayedDeck.length > 0 && (
                            <Button onClick={handleNextSession} className="w-full">
                                <ArrowRightCircle className="mr-2 h-4 w-4" /> Chơi tiếp ({unplayedDeck.length} từ còn lại)
                            </Button>
                         )}
                         <Button onClick={handleRestartAll} className="w-full" variant={unplayedDeck.length > 0 ? "outline" : "default"}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Chơi lại từ đầu
                        </Button>
                    </CardFooter>
                 </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center gap-6">
             <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-4 w-full max-w-3xl mx-auto">
                {gameCards.map((card, index) => {
                    const isIncorrect = incorrectPair?.includes(index) ?? false;
                    return (
                        <Button
                            key={card.id}
                            variant="outline"
                            onClick={() => handleCardClick(index)}
                            disabled={card.isMatched}
                            className={cn(
                                "h-20 md:h-24 text-base font-semibold p-2 flex items-center justify-center text-center whitespace-normal transition-all duration-300",
                                selectedIndex === index && !card.isMatched && "ring-2 ring-primary border-primary",
                                card.isMatched && "bg-green-100 dark:bg-green-900/50 border-green-500 text-green-700 dark:text-green-300 opacity-60 cursor-not-allowed",
                                isIncorrect && "bg-red-100 dark:bg-red-900/50 border-red-500 text-red-700 dark:text-red-300 animate-in fade-in"
                            )}
                        >
                            {card.content}
                        </Button>
                    )
                })}
            </div>
             <div className="flex justify-center mt-4">
                <Button variant="ghost" onClick={handleRestartAll}>
                    <RefreshCw className="mr-2 h-4 w-4"/> Chơi lại từ đầu
                </Button>
            </div>
        </div>
    );
}
