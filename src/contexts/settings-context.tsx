"use client";

import type { Language } from "@/lib/types";
import { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from "react";

type SelectedVoices = Record<Language, string | null>;

interface SettingsContextType {
    selectedVoices: SelectedVoices;
    setSelectedVoice: (lang: Language, voiceURI: string) => void;
    voicesByLang: Record<Language, SpeechSynthesisVoice[]>;
    isTTSLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultVoices: SelectedVoices = {
    english: null,
    chinese: null,
    vietnamese: null,
};

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [selectedVoices, setSelectedVoices] = useState<SelectedVoices>(defaultVoices);
    const [voicesByLang, setVoicesByLang] = useState<Record<Language, SpeechSynthesisVoice[]>>({
        english: [],
        chinese: [],
        vietnamese: [],
    });
    const [isTTSLoading, setIsTTSLoading] = useState(true);

    // Load saved settings from localStorage
    useEffect(() => {
        try {
            const savedVoices = localStorage.getItem("cn-selected-voices");
            if (savedVoices) {
                setSelectedVoices(JSON.parse(savedVoices));
            }
        } catch (error) {
            console.error("Failed to load settings from localStorage", error);
        }
    }, []);

    // Get available system voices
    useEffect(() => {
        const populateVoiceList = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length === 0) {
                setIsTTSLoading(true);
                return;
            }
            
            const categorized: Record<Language, SpeechSynthesisVoice[]> = {
                english: voices.filter(v => v.lang.startsWith('en-')),
                chinese: voices.filter(v => v.lang.startsWith('zh-')),
                vietnamese: voices.filter(v => v.lang.startsWith('vi-')),
            };

            setVoicesByLang(categorized);
            setIsTTSLoading(false);

            // Set default voice if none is selected for a language
            const updatedSelectedVoices = { ...selectedVoices };
            let changed = false;
            (Object.keys(categorized) as Language[]).forEach(lang => {
                if (!selectedVoices[lang] && categorized[lang].length > 0) {
                    updatedSelectedVoices[lang] = categorized[lang][0].voiceURI;
                    changed = true;
                }
            });

            if (changed) {
                setSelectedVoices(updatedSelectedVoices);
                 try {
                    localStorage.setItem("cn-selected-voices", JSON.stringify(updatedSelectedVoices));
                } catch (error) {
                    console.error("Failed to save default settings to localStorage", error);
                }
            }
        };

        populateVoiceList();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = populateVoiceList;
        }

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        }
    }, []); // Run only once

    const setSelectedVoice = useCallback((lang: Language, voiceURI: string) => {
        const newSelectedVoices = { ...selectedVoices, [lang]: voiceURI };
        setSelectedVoices(newSelectedVoices);
        try {
            localStorage.setItem("cn-selected-voices", JSON.stringify(newSelectedVoices));
        } catch (error) {
            console.error("Failed to save settings to localStorage", error);
        }
    }, [selectedVoices]);

    const contextValue = {
        selectedVoices,
        setSelectedVoice,
        voicesByLang,
        isTTSLoading,
    };

    return (
        <SettingsContext.Provider value={contextValue}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
}
