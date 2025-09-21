
"use client";

import { useSettings } from "@/contexts/settings-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { Language } from "@/lib/types";
import { Button } from "./ui/button";
import { Loader2, Volume2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function VoiceSettings() {
    const { voicesByLang, selectedVoices, setSelectedVoice, isTTSLoading } = useSettings();
    const [speakingLang, setSpeakingLang] = useState<Language | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        // Stop speech synthesis on component unmount
        return () => {
            if (utteranceRef.current) {
                utteranceRef.current.onend = null;
                utteranceRef.current.onerror = null;
            }
            window.speechSynthesis.cancel();
        };
    }, []);


    const handleVoiceChange = (lang: Language, voiceURI: string) => {
        setSelectedVoice(lang, voiceURI);
    };

    const playTestAudio = (lang: Language) => {
        if (speakingLang === lang) {
            window.speechSynthesis.cancel();
            setSpeakingLang(null);
            return;
        }

        window.speechSynthesis.cancel();

        const testPhrases: Record<Language, string> = {
            english: "This is a test of the English voice.",
            chinese: "这是一个中文语音测试。",
            vietnamese: "Đây là phần đọc thử giọng Tiếng Việt."
        };

        const utterance = new SpeechSynthesisUtterance(testPhrases[lang]);
        utteranceRef.current = utterance;

        const langCodeMap: Record<Language, string> = {
            english: 'en-US',
            chinese: 'zh-CN',
            vietnamese: 'vi-VN',
        };
        utterance.lang = langCodeMap[lang];

        const voiceURI = selectedVoices[lang];
        if (voiceURI) {
            const voices = window.speechSynthesis.getVoices();
            const selectedVoice = voices.find(v => v.voiceURI === voiceURI);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
        }
        
        utterance.onstart = () => setSpeakingLang(lang);
        utterance.onend = () => {
            setSpeakingLang(null);
            utteranceRef.current = null;
        };
        utterance.onerror = (event) => {
            console.error("SpeechSynthesis Error", event);
            setSpeakingLang(null);
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

    if (isTTSLoading) {
        return (
            <div className="max-w-2xl mx-auto">
                <p>Đang tải danh sách giọng đọc...</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Tùy chỉnh giọng đọc</CardTitle>
                    <CardDescription>
                        Chọn giọng đọc mặc định cho từng ngôn ngữ. Các giọng đọc này được cung cấp bởi trình duyệt và hệ điều hành của bạn.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="english-voice">Giọng đọc Tiếng Anh</Label>
                        <div className="flex items-center gap-2">
                            <Select
                                value={selectedVoices.english || ''}
                                onValueChange={(value) => handleVoiceChange('english', value)}
                                disabled={voicesByLang.english.length === 0}
                            >
                                <SelectTrigger id="english-voice">
                                    <SelectValue placeholder={voicesByLang.english.length > 0 ? "Chọn một giọng đọc" : "Không có giọng đọc nào"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {voicesByLang.english?.map(voice => (
                                        <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                                            {voice.name} ({voice.lang})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button size="icon" variant="outline" onClick={() => playTestAudio('english')} disabled={!selectedVoices.english}>
                                {speakingLang === 'english' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Volume2 className="h-5 w-5" />}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="chinese-voice">Giọng đọc Tiếng Trung</Label>
                         <div className="flex items-center gap-2">
                            <Select
                                value={selectedVoices.chinese || ''}
                                onValueChange={(value) => handleVoiceChange('chinese', value)}
                                disabled={voicesByLang.chinese.length === 0}
                            >
                                <SelectTrigger id="chinese-voice">
                                     <SelectValue placeholder={voicesByLang.chinese.length > 0 ? "Chọn một giọng đọc" : "Không có giọng đọc nào"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {voicesByLang.chinese?.map(voice => (
                                        <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                                            {voice.name} ({voice.lang})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                             <Button size="icon" variant="outline" onClick={() => playTestAudio('chinese')} disabled={!selectedVoices.chinese}>
                                {speakingLang === 'chinese' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Volume2 className="h-5 w-5" />}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="vietnamese-voice">Giọng đọc Tiếng Việt</Label>
                         <div className="flex items-center gap-2">
                            <Select
                                value={selectedVoices.vietnamese || ''}
                                onValueChange={(value) => handleVoiceChange('vietnamese', value)}
                                disabled={voicesByLang.vietnamese.length === 0}
                            >
                                <SelectTrigger id="vietnamese-voice">
                                     <SelectValue placeholder={voicesByLang.vietnamese.length > 0 ? "Chọn một giọng đọc" : "Không có giọng đọc nào"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {voicesByLang.vietnamese?.map(voice => (
                                        <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                                            {voice.name} ({voice.lang})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                             <Button size="icon" variant="outline" onClick={() => playTestAudio('vietnamese')} disabled={!selectedVoices.vietnamese}>
                                {speakingLang === 'vietnamese' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Volume2 className="h-5 w-5" />}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
