'use client'

import { createContext, useState, useEffect, type ReactNode } from 'react'
import { type Language, getTranslations } from '@/lib/i18n'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: ReturnType<typeof getTranslations>
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Default to English, but detect Greek users
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    // Check for saved language preference
    const savedLang = localStorage.getItem('language') as Language
    if (savedLang && ['en', 'el'].includes(savedLang)) {
      setLanguageState(savedLang)
    } else {
      // Auto-detect language based on browser/location
      const browserLang = navigator.language.toLowerCase()
      if (browserLang.startsWith('el') || browserLang.includes('gr')) {
        setLanguageState('el')
      }
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  const t = getTranslations(language)

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}
