"use client";

import { useVocabulary } from "@/contexts/vocabulary-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

export function VocabularyList() {
  const { vocabulary, removeVocabularyItem } = useVocabulary();
  const isMobile = useIsMobile();

  if (vocabulary.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">Your vocabulary list is empty.</p>
        <p className="text-sm text-muted-foreground">
          Click "Add Word" to start learning!
        </p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-4">
        {vocabulary.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{item.word}</h3>
                  <p className="text-muted-foreground">{item.vietnameseTranslation}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeVocabularyItem(item.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="mt-2 text-sm space-y-1">
                <Badge variant={item.language === 'english' ? 'secondary' : 'outline'}>{item.language}</Badge>
                {item.ipa && <p><span className="font-semibold">IPA:</span> {item.ipa}</p>}
                {item.pinyin && <p><span className="font-semibold">Pinyin:</span> {item.pinyin}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Word</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Pronunciation</TableHead>
              <TableHead>Vietnamese</TableHead>
              <TableHead className="text-right w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vocabulary.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.word}</TableCell>
                <TableCell>
                  <Badge variant={item.language === 'english' ? 'secondary' : 'outline'}>{item.language}</Badge>
                </TableCell>
                <TableCell>{item.ipa || item.pinyin}</TableCell>
                <TableCell>{item.vietnameseTranslation}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => removeVocabularyItem(item.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
