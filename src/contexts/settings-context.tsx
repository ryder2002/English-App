
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
                 // On some browsers (especially mobile), getVoices() is async and needs a nudge.
                 // We will retry after a short delay.
                setTimeout(populateVoiceList, 100);
                return;
            }
            
            const categorized: Record<Language, SpeechSynthesisVoice[]> = {
                english: voices.filter(v => v.lang.startsWith('en-')),
                chinese: voices.filter(v => v.lang.startsWith('zh-')),
                vietnamese: voices.filter(v => v.lang.startsWith('vi-')),
            };

            setVoicesByLang(categorized);
            setIsTTSLoading(false);
            
            // This needs to be a function to get the latest state
            setSelectedVoices(currentSelectedVoices => {
                let changed = false;
                const updatedSelectedVoices = { ...currentSelectedVoices };

                (Object.keys(categorized) as Language[]).forEach(lang => {
                    if (!updatedSelectedVoices[lang] && categorized[lang].length > 0) {
                        updatedSelectedVoices[lang] = categorized[lang][0].voiceURI;
                        changed = true;
                    }
                });

                if (changed) {
                    try {
                        localStorage.setItem("cn-selected-voices", JSON.stringify(updatedSelectedVoices));
                    } catch (error) {
                        console.error("Failed to save default settings to localStorage", error);
                    }
                    return updatedSelectedVoices;
                }
                return currentSelectedVoices; // No change needed
            });
        };

        // This is a workaround for some mobile browsers that need a "kickstart"
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            // Speak an empty utterance to wake up the synthesis engine on mobile
            const utterance = new SpeechSynthesisUtterance('');
            utterance.volume = 0; // Make it silent
            window.speechSynthesis.speak(utterance);
        }

        populateVoiceList();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = populateVoiceList;
        }

        return () => {
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.onvoiceschanged = null;
            }
        }
    }, []);

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
