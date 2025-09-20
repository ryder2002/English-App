"use client";

import { useSettings } from "@/contexts/settings-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { Language } from "@/lib/types";

export function VoiceSettings() {
    const { voicesByLang, selectedVoices, setSelectedVoice, isTTSLoading } = useSettings();

    const handleVoiceChange = (lang: Language, voiceURI: string) => {
        setSelectedVoice(lang, voiceURI);
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
                        <Select
                            value={selectedVoices.english || ''}
                            onValueChange={(value) => handleVoiceChange('english', value)}
                        >
                            <SelectTrigger id="english-voice">
                                <SelectValue placeholder="Chọn một giọng đọc" />
                            </SelectTrigger>
                            <SelectContent>
                                {voicesByLang.english?.map(voice => (
                                    <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                                        {voice.name} ({voice.lang})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="chinese-voice">Giọng đọc Tiếng Trung</Label>
                        <Select
                             value={selectedVoices.chinese || ''}
                             onValueChange={(value) => handleVoiceChange('chinese', value)}
                        >
                            <SelectTrigger id="chinese-voice">
                                <SelectValue placeholder="Chọn một giọng đọc" />
                            </SelectTrigger>
                            <SelectContent>
                                {voicesByLang.chinese?.map(voice => (
                                    <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                                        {voice.name} ({voice.lang})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="vietnamese-voice">Giọng đọc Tiếng Việt</Label>
                        <Select
                             value={selectedVoices.vietnamese || ''}
                             onValueChange={(value) => handleVoiceChange('vietnamese', value)}
                        >
                            <SelectTrigger id="vietnamese-voice">
                                <SelectValue placeholder="Chọn một giọng đọc" />
                            </SelectTrigger>
                            <SelectContent>
                                {voicesByLang.vietnamese?.map(voice => (
                                    <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                                        {voice.name} ({voice.lang})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
