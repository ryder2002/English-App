
"use client";

import { useVocabulary } from "@/contexts/vocabulary-context";
import {
  ChevronLeft,
  ChevronRight,
  FlipHorizontal,
  RefreshCw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { CardStackPlusIcon } from "@radix-ui/react-icons";

interface FlashcardPlayerProps {
    selectedFolder: string;
}

export function FlashcardPlayer({ selectedFolder }: FlashcardPlayerProps) {
  const { vocabulary } = useVocabulary();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const deck = useMemo(() => {
    if (selectedFolder === 'all') {
        return vocabulary;
    }
    return vocabulary.filter(item => item.folder === selectedFolder);
  }, [vocabulary, selectedFolder]);


  const [shuffledDeck, setShuffledDeck] = useState<typeof vocabulary>([]);

  const shuffleDeck = (deckToShuffle: typeof vocabulary) => {
    return [...deckToShuffle].sort(() => Math.random() - 0.5);
  };
  
  useEffect(() => {
    setShuffledDeck(shuffleDeck(deck));
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [deck]);

  const currentCard = useMemo(() => {
    return shuffledDeck.length > 0 ? shuffledDeck[currentIndex] : null;
  }, [shuffledDeck, currentIndex]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (shuffledDeck.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % shuffledDeck.length);
    }, 150); // wait for flip animation
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (shuffledDeck.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(
        (prev) => (prev - 1 + shuffledDeck.length) % shuffledDeck.length
      );
    }, 150);
  };
  
  const handleShuffle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShuffledDeck(shuffleDeck(deck));
    setCurrentIndex(0);
    setIsFlipped(false);
  };
  
  const handleFlip = () => {
    if (!currentCard) return;
    setIsFlipped(prev => !prev);
  }

  if (deck.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg h-96 bg-card">
        <CardStackPlusIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Chưa có từ vựng để luyện tập.</p>
        <p className="text-sm text-muted-foreground">
          Hãy thêm từ vào thư mục này để bắt đầu học nhé.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full max-w-2xl">
        <div
          className="relative w-full cursor-pointer group"
          style={{ perspective: "1000px" }}
          onClick={handleFlip}
        >
          <Card
            className={`w-full h-80 transition-transform duration-500 ease-in-out relative ${
              isFlipped ? "[transform:rotateY(180deg)]" : ""
            }`}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Front of card */}
            <CardContent
              className="absolute w-full h-full flex flex-col items-center justify-center text-center p-6 bg-card rounded-lg shadow-lg"
              style={{ backfaceVisibility: "hidden" }}
            >
              <p className="text-4xl md:text-5xl font-bold">{currentCard?.word}</p>
            </CardContent>

            {/* Back of card */}
            <CardContent
              className="absolute w-full h-full flex flex-col items-center justify-center text-center p-6 bg-card rounded-lg shadow-lg"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <p className="text-3xl md:text-4xl font-semibold text-primary">
                {currentCard?.vietnameseTranslation}
              </p>
              <p className="text-muted-foreground text-lg mt-2">
                {currentCard?.ipa || currentCard?.pinyin}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="w-full max-w-2xl space-y-4">
        <Progress value={shuffledDeck.length > 0 ? ((currentIndex + 1) / shuffledDeck.length) * 100 : 0} />

        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="icon" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            className="px-8 bg-accent hover:bg-accent/90"
            onClick={(e) => { e.stopPropagation(); handleFlip(); }}
            aria-label="Flip card"
          >
            <FlipHorizontal className="mr-2 h-4 w-4" /> Lật thẻ
          </Button>

          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-center">
            <Button variant="ghost" onClick={handleShuffle}>
                <RefreshCw className="mr-2 h-4 w-4"/> Xáo trộn
            </Button>
        </div>
      </div>
    </div>
  );
}
