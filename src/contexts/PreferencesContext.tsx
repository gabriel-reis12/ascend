import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  LANGUAGE_KEY,
  PreferencesContext,
  THEME_KEY,
  translations,
  type AppLanguage,
  type AppTheme,
  type PreferencesContextValue,
} from './preferences';

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === 'light' ? 'light' : 'dark';
  });
  const [language] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (saved === 'en-US' || saved === 'pt-BR') return saved;
    return navigator.language.toLowerCase().startsWith('en') ? 'en-US' : 'pt-BR';
  });

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('theme-dark', theme === 'dark');
    root.classList.toggle('theme-light', theme === 'light');
    root.style.colorScheme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem(LANGUAGE_KEY, language);
  }, [language]);

  const handleSetLanguage = (newLang: AppLanguage) => {
    localStorage.setItem(LANGUAGE_KEY, newLang);
    window.location.reload();
  };

  const value = useMemo<PreferencesContextValue>(() => ({
    theme,
    language,
    setTheme,
    setLanguage: handleSetLanguage,
    t: (key) => translations[key][language],
  }), [language, theme]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
