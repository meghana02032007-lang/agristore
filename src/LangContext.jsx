import { createContext, useContext, useState } from 'react';
import { translations } from './i18n';

const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(
    () => localStorage.getItem('agristore_lang') || 'English'
  );

  function setLang(newLang) {
    localStorage.setItem('agristore_lang', newLang);
    setLangState(newLang);
  }

  const t = translations[lang] || translations.English;

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
