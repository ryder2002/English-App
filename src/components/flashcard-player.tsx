
"use client";

import { useVocabulary } from "@/contexts/vocabulary-context";
import {
  ChevronLeft,
  ChevronRight,
  FlipHorizontal,
  Loader2,
  RefreshCw,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { useToast } from "@/hooks/use-toast";
import type { VocabularyItem, Language } from "@/lib/types";
import { CardStackPlusIcon } from "@radix-ui/react-icons";
import { useSettings } from "@/contexts/settings-context";
import { type EmblaCarouselType } from 'embla-carousel-react'
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";

interface FlashcardPlayerProps {
    selectedFolder: string;
}

export function FlashcardPlayer({ selectedFolder }: FlashcardPlayerProps) {
  const { vocabulary } = useVocabulary();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const { toast } = useToast();
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const { selectedVoices } = useSettings();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const [emblaApi, setEmblaApi] = useState<CarouselApi | null>(null);

  const deck = useMemo(() => {
    if (selectedFolder === 'all') {
        return vocabulary;
    }
    return vocabulary.filter(item => item.folder === selectedFolder);
  }, [vocabulary, selectedFolder]);

  useEffect(() => {
    return () => {
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  const [shuffledDeck, setShuffledDeck] = useState<typeof vocabulary>([]);

  const shuffleDeck = (deckToShuffle: typeof vocabulary) => {
    const newDeck = [...deckToShuffle];
    for (let i = newDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
  };
  
  useEffect(() => {
    const newShuffledDeck = shuffleDeck(deck);
    setShuffledDeck(newShuffledDeck);
    setCurrentIndex(0);
    setIsFlipped(false);
    emblaApi?.reInit();
    emblaApi?.scrollTo(0, true);
  }, [deck, emblaApi]);

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    const newIndex = emblaApi.selectedScrollSnap();
    if (currentIndex !== newIndex) {
        setIsFlipped(false);
        setSpeakingId(null);
        window.speechSynthesis.cancel();
    }
    setCurrentIndex(newIndex);
  }, [currentIndex]);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on('select', onSelect);
      return () => {
        emblaApi.off('select', onSelect);
      };
    }
  }, [emblaApi, onSelect]);


  const handleFlip = (cardId: string | undefined) => {
    if (!cardId) return;
    window.speechSynthesis.cancel();
    setSpeakingId(null);
    setIsFlipped(prev => !prev);
  }
  
  const playAudio = (e: React.MouseEvent, item: VocabularyItem) => {
    e.stopPropagation();

    if (speakingId === item.id) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
        return;
    }

    window.speechSynthesis.cancel(); 

    const utterance = new SpeechSynthesisUtterance(item.word);
    utteranceRef.current = utterance;
    
    const langCodeMap: Record<Language, string> = {
        english: 'en-US',
        chinese: 'zh-CN',
        vietnamese: 'vi-VN',
    };
    utterance.lang = langCodeMap[item.language];
    
    const voiceURI = selectedVoices[item.language];
    if (voiceURI) {
        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find(v => v.voiceURI === voiceURI);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
    }


    utterance.onstart = () => {
        setSpeakingId(item.id);
    };

    utterance.onend = () => {
        setSpeakingId(null);
        utteranceRef.current = null;
    };

    utterance.onerror = (event) => {
        console.error("SpeechSynthesis Error", event);
        setSpeakingId(null);
        utteranceRef.current = null;
    };
    
    const speak = () => {
      if (window.speechSynthesis.speaking) {
        setTimeout(speak, 100);
      } else {
        window.speechSynthesis.speak(utterance);
      }
    };
    speak();
  };

  const handleShuffle = () => {
    const newShuffledDeck = shuffleDeck(deck);
    setShuffledDeck(newShuffledDeck);
    setCurrentIndex(0);
    setIsFlipped(false);
    emblaApi?.reInit();
    emblaApi?.scrollTo(0, true);
  };


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
        <Carousel 
            setApi={setEmblaApi} 
            className="w-full max-w-2xl"
            opts={{ align: 'center', loop: true }}
        >
            <CarouselContent>
                {shuffledDeck.map((cardItem, index) => (
                    <CarouselItem key={cardItem.id}>
                         <div
                            className="relative w-full cursor-pointer group"
                            style={{ perspective: "1000px" }}
                            onClick={() => handleFlip(cardItem.id)}
                        >
                            <Card
                                className={`w-full h-80 transition-transform duration-500 ease-in-out relative`}
                                style={{ 
                                    transformStyle: "preserve-3d",
                                    transform: isFlipped && currentIndex === index ? "rotateY(180deg)" : "rotateY(0deg)",
                                }}
                            >
                                {/* Front of card */}
                                <CardContent
                                className="absolute w-full h-full flex flex-col items-center justify-center text-center p-6 bg-card rounded-lg shadow-lg"
                                style={{ backfaceVisibility: "hidden" }}
                                >
                                <p className="text-4xl md:text-5xl font-bold">{cardItem?.word}</p>
                                    {cardItem && (
                                        <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        onClick={(e) => playAudio(e, cardItem)}
                                        className="absolute bottom-4 right-4 h-12 w-12 text-muted-foreground"
                                        >
                                        {speakingId === cardItem.id
                                            ? <Loader2 className="h-6 w-6 animate-spin"/> 
                                            : <Volume2 className="h-6 w-6"/>
                                        }
                                        </Button>
                                    )}
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
                                    {cardItem?.vietnameseTranslation}
                                </p>
                                <p className="text-muted-foreground text-lg mt-2">
                                    {cardItem?.ipa || cardItem?.pinyin}
                                </p>
                                </CardContent>
                            </Card>
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:inline-flex" />
            <CarouselNext className="hidden md:inline-flex" />
        </Carousel>


      <div className="w-full max-w-2xl space-y-4">
        <Progress value={shuffledDeck.length > 0 ? ((currentIndex + 1) / shuffledDeck.length) * 100 : 0} />

        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="icon" onClick={() => emblaApi?.scrollPrev()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            className="px-8 bg-accent hover:bg-accent/90"
            onClick={() => handleFlip(shuffledDeck[currentIndex]?.id)}
            aria-label="Flip card"
          >
            <FlipHorizontal className="mr-2 h-4 w-4" /> Lật thẻ
          </Button>

          <Button variant="outline" size="icon" onClick={() => emblaApi?.scrollNext()}>
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

    
