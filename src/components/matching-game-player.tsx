'use client';

import { useVocabulary } from "@/contexts/vocabulary-context";
import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
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
  id: string; // Unique ID for the card itself, e.g., "word-1" or "meaning-1"
  pairId: string; // The ID of the original VocabularyItem
  type: CardType;
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MatchingGamePlayerProps {
    selectedFolder: string;
}

export function MatchingGamePlayer({ selectedFolder }: MatchingGamePlayerProps) {
    const { vocabulary } = useVocabulary();
    const [gameCards, setGameCards] = useState<GameCard[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [isFinished, setIsFinished] = useState(false);
    const [moves, setMoves] = useState(0);

    const fullDeck = useMemo(() => {
        let deck = selectedFolder === 'all'
            ? vocabulary
            : vocabulary.filter(item => item.folder === selectedFolder);
        // Ensure even number for pairing
        if (deck.length % 2 !== 0 && deck.length > 1) {
            deck = deck.slice(0, -1);
        }
        return deck;
    }, [vocabulary, selectedFolder]);

    const startNewGame = (deckToUse: VocabularyItem[]) => {
        if (deckToUse.length === 0) {
            setGameCards([]);
            return;
        }

        const pairs: GameCard[] = deckToUse.flatMap(item => [
            { id: `word-${item.id}`, pairId: item.id, type: 'word', content: item.word, isFlipped: false, isMatched: false },
            { id: `meaning-${item.id}`, pairId: item.id, type: 'meaning', content: item.vietnameseTranslation, isFlipped: false, isMatched: false }
        ]);

        setGameCards(shuffleArray(pairs));
        setFlippedIndices([]);
        setIsFinished(false);
        setMoves(0);
    };

    useEffect(() => {
        startNewGame(fullDeck);
    }, [fullDeck]);

    const handleCardClick = (index: number) => {
        if (flippedIndices.length >= 2 || gameCards[index].isFlipped || gameCards[index].isMatched) {
            return;
        }

        const newFlippedIndices = [...flippedIndices, index];
        const newGameCards = [...gameCards];
        newGameCards[index].isFlipped = true;

        setGameCards(newGameCards);
        setFlippedIndices(newFlippedIndices);
    };

    useEffect(() => {
        if (flippedIndices.length === 2) {
            setMoves(prev => prev + 1);
            const [firstIndex, secondIndex] = flippedIndices;
            const firstCard = gameCards[firstIndex];
            const secondCard = gameCards[secondIndex];

            if (firstCard.pairId === secondCard.pairId) {
                // Match found
                const newGameCards = gameCards.map(card =>
                    card.pairId === firstCard.pairId ? { ...card, isMatched: true } : card
                );
                setGameCards(newGameCards);
                setFlippedIndices([]);
                if (newGameCards.every(card => card.isMatched)) {
                    setIsFinished(true);
                }
            } else {
                // No match, flip back after a delay
                setTimeout(() => {
                    const newGameCards = [...gameCards];
                    newGameCards[firstIndex].isFlipped = false;
                    newGameCards[secondIndex].isFlipped = false;
                    setGameCards(newGameCards);
                    setFlippedIndices([]);
                }, 1000);
            }
        }
    }, [flippedIndices, gameCards]);
    
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
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4 w-full">
                {gameCards.map((card, index) => (
                    <div
                        key={card.id}
                        className="w-full aspect-square cursor-pointer group"
                        style={{ perspective: "1000px" }}
                        onClick={() => handleCardClick(index)}
                    >
                        <div
                            className={cn(
                                "relative w-full h-full transition-transform duration-500 ease-in-out",
                                card.isFlipped || card.isMatched ? "rotate-y-180" : ""
                            )}
                            style={{ transformStyle: "preserve-3d" }}
                        >
                            {/* Card Back */}
                            <div className="absolute w-full h-full flex items-center justify-center bg-primary rounded-lg shadow-md" style={{ backfaceVisibility: "hidden" }}>
                                <span className="text-3xl font-bold text-primary-foreground">?</span>
                            </div>

                            {/* Card Front */}
                            <div className={cn(
                                "absolute w-full h-full flex items-center justify-center text-center p-2 rounded-lg shadow-md",
                                card.isMatched ? "bg-green-100 dark:bg-green-900/50 border-2 border-green-500" : "bg-card",
                                "rotate-y-180"
                            )} style={{ backfaceVisibility: "hidden" }}>
                                <p className={cn("font-semibold text-sm md:text-base", card.isMatched ? "text-green-700 dark:text-green-300" : "")}>{card.content}</p>
                            </div>
                        </div>
                    </div>
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

// Custom CSS in a style tag to avoid CSS file modification
const style = document.createElement('style');
style.innerHTML = `
  .rotate-y-180 {
    transform: rotateY(180deg);
  }
`;
document.head.appendChild(style);
