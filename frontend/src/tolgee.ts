import { FormatSimple, Tolgee } from '@tolgee/react';
import de from './i18n/de.json';
import en from './i18n/en.json';
import es from './i18n/es.json';
import fi from './i18n/fi.json';
import nl from './i18n/nl.json';
import sv from './i18n/sv.json';
import zh from './i18n/zh.json';

const languageStorageKey = 'clarus.language';

const getInitialLanguage = () => {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const storedLanguage = window.localStorage.getItem(languageStorageKey);
  return storedLanguage === 'sv' ||
    storedLanguage === 'en' ||
    storedLanguage === 'de' ||
    storedLanguage === 'es' ||
    storedLanguage === 'fi' ||
    storedLanguage === 'nl' ||
    storedLanguage === 'zh'
    ? storedLanguage
    : 'en';
};

export const tolgee = Tolgee()
  .use(FormatSimple())
  .init({
    language: getInitialLanguage(),
    fallbackLanguage: 'en',
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
