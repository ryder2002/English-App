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

export function FlashcardPlayer() {
  const { vocabulary } = useVocabulary();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledDeck, setShuffledDeck] = useState<typeof vocabulary>([]);

  useEffect(() => {
    const shuffle = (array: typeof vocabulary) => {
      return [...array].sort(() => Math.random() - 0.5);
    };
    setShuffledDeck(shuffle(vocabulary));
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [vocabulary]);

  const currentCard = useMemo(() => {
    return shuffledDeck.length > 0 ? shuffledDeck[currentIndex] : null;
  }, [shuffledDeck, currentIndex]);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % shuffledDeck.length);
    }, 150); // wait for flip animation
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(
        (prev) => (prev - 1 + shuffledDeck.length) % shuffledDeck.length
      );
    }, 150);
  };
  
  const handleShuffle = () => {
    const shuffle = (array: typeof vocabulary) => {
      return [...array].sort(() => Math.random() - 0.5);
    };
    setShuffledDeck(shuffle(vocabulary));
    setCurrentIndex(0);
    setIsFlipped(false);
    };

  if (vocabulary.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg h-96">
        <p className="text-muted-foreground">No vocabulary to practice.</p>
        <p className="text-sm text-muted-foreground">
          Add some words to your vocabulary list to start practicing with
          flashcards.
        </p>
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full max-w-2xl">
        <div
          className="relative w-full"
          style={{ perspective: "1000px" }}
        >
          <Card
            className={`w-full h-80 transition-transform duration-500 ease-in-out ${
              isFlipped ? "transform -rotate-y-180" : ""
            }`}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Front of card */}
            <CardContent
              className="absolute w-full h-full flex flex-col items-center justify-center text-center p-6 bg-card rounded-lg"
              style={{ backfaceVisibility: "hidden" }}
            >
              <p className="text-4xl md:text-5xl font-bold">{currentCard.word}</p>
            </CardContent>

            {/* Back of card */}
            <CardContent
              className="absolute w-full h-full flex flex-col items-center justify-center text-center p-6 bg-card rounded-lg"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <p className="text-3xl md:text-4xl font-semibold text-primary">
                {currentCard.vietnameseTranslation}
              </p>
              <p className="text-muted-foreground text-lg mt-2">
                {currentCard.ipa || currentCard.pinyin}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="w-full max-w-2xl space-y-4">
        <Progress value={((currentIndex + 1) / vocabulary.length) * 100} />

        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="icon" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            className="px-8 bg-accent hover:bg-accent/90"
            onClick={() => setIsFlipped(!isFlipped)}
            aria-label="Flip card"
          >
            <FlipHorizontal className="mr-2 h-4 w-4" /> Flip
          </Button>

          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-center">
            <Button variant="ghost" onClick={handleShuffle}>
                <RefreshCw className="mr-2 h-4 w-4"/> Shuffle Deck
            </Button>
        </div>
      </div>
    </div>
  );
}
