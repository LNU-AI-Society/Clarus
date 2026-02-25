import { FormatSimple, Tolgee } from '@tolgee/react';
import de from './i18n/de.json';
import en from './i18n/en.json';
import es from './i18n/es.json';
import fi from './i18n/fi.json';
import nl from './i18n/nl.json';
import sv from './i18n/sv.json';
import zh from './i18n/zh.json';
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, normalizeSupportedLanguage } from './i18n/languages';

const getInitialLanguage = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return normalizeSupportedLanguage(storedLanguage) ?? DEFAULT_LANGUAGE;
};

export const tolgee = Tolgee()
  .use(FormatSimple())
  .init({
    language: getInitialLanguage(),
    fallbackLanguage: DEFAULT_LANGUAGE,
    staticData: {
      de,
      en,
      es,
      fi,
      nl,
      sv,
      zh,
    },
  });
