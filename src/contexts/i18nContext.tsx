import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language } from '@/constants/translations';

interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const useI18n = () => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within I18nProvider');
    }
    return context;
};

interface I18nProviderProps {
    children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('ko');

    useEffect(() => {
        // Load saved language
        (async () => {
            try {
                const saved = await AsyncStorage.getItem('app_language');
                if (saved && (saved === 'ko' || saved === 'en')) {
                    setLanguageState(saved);
                }
            } catch (e) {
                // Default to Korean
            }
        })();
    }, []);

    const setLanguage = async (lang: Language) => {
        setLanguageState(lang);
        try {
            await AsyncStorage.setItem('app_language', lang);
        } catch (e) {
            console.error('Failed to save language');
        }
    };

    const t = (key: string): string => {
        const translation = translations[language][key as keyof typeof translations.ko];
        return translation || key;
    };

    return (
        <I18nContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </I18nContext.Provider>
    );
};

