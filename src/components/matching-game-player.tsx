'use client';

import { useVocabulary } from "@/contexts/vocabulary-context";
import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { cn } from "@/lib/utils";
import { RefreshCw, Trophy } from "lucide-react";
import { VocabularyItem } from "@/lib/types";

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

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

    const fullDeck = useMemo(() => {
        let deck = selectedFolder === 'all'
            ? vocabulary
            : vocabulary.filter(item => item.folder === selectedFolder);
        // Ensure even number for pairing, we'll take a max of 6 pairs (12 cards) for a good layout
        const maxPairs = 6;
        deck = shuffleArray(deck).slice(0, maxPairs);

        if (deck.length < 2) return [];
        
        return deck;
    }, [vocabulary, selectedFolder]);

    const startNewGame = (deckToUse: VocabularyItem[]) => {
        if (deckToUse.length === 0) {
            setGameCards([]);
            return;
        }

        const pairs: GameCard[] = deckToUse.flatMap(item => [
            { id: `word-${item.id}`, pairId: item.id, type: 'word', content: item.word, isMatched: false },
            { id: `meaning-${item.id}`, pairId: item.id, type: 'meaning', content: item.vietnameseTranslation, isMatched: false }
        ]);

        setGameCards(shuffleArray(pairs));
        setSelectedIndex(null);
        setIsFinished(false);
        setMoves(0);
    };

    useEffect(() => {
        startNewGame(fullDeck);
    }, [fullDeck]);

    const handleCardClick = (clickedIndex: number) => {
        if (gameCards[clickedIndex].isMatched || selectedIndex === clickedIndex) {
            return;
        }
        
        if (selectedIndex === null) {
            // First card selected
            setSelectedIndex(clickedIndex);
        } else {
            // Second card selected
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
                // No match, just select the new card
                setSelectedIndex(clickedIndex);
            }
        }
    };
    
    if (fullDeck.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg h-96 bg-card">
                <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Không có từ vựng để chơi.</p>
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
                        <CardTitle className="text-2xl">Tuyệt vời!</CardTitle>
                        <CardDescription>Bạn đã ghép đúng tất cả các thẻ.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-4xl font-bold">
                            {moves}
                        </p>
                        <p className="text-muted-foreground mt-2">
                           lượt đoán
                        </p>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                         <Button onClick={() => startNewGame(fullDeck)} className="w-full">
                            <RefreshCw className="mr-2 h-4 w-4" /> Chơi lại
                        </Button>
                    </CardFooter>
                 </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center gap-6">
             <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-4 w-full max-w-3xl mx-auto">
                {gameCards.map((card, index) => (
                    <Button
                        key={card.id}
                        variant="outline"
                        onClick={() => handleCardClick(index)}
                        disabled={card.isMatched}
                        className={cn(
                            "h-20 md:h-24 text-base font-semibold p-2 flex items-center justify-center text-center whitespace-normal",
                            selectedIndex === index && !card.isMatched && "ring-2 ring-primary border-primary",
                            card.isMatched && "bg-green-100 dark:bg-green-900/50 border-green-500 text-green-700 dark:text-green-300 opacity-60 cursor-not-allowed",
                        )}
                    >
                        {card.content}
                    </Button>
                ))}
            </div>
             <div className="flex justify-center mt-4">
                <Button variant="ghost" onClick={() => startNewGame(fullDeck)}>
                    <RefreshCw className="mr-2 h-4 w-4"/> Chơi lại từ đầu
                </Button>
            </div>
        </div>
    );
}
