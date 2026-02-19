import { FormatSimple, Tolgee } from '@tolgee/react';
import en from './i18n/en.json';
import sv from './i18n/sv.json';

const languageStorageKey = 'clarus.language';

const getInitialLanguage = () => {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const storedLanguage = window.localStorage.getItem(languageStorageKey);
  return storedLanguage === 'sv' || storedLanguage === 'en' ? storedLanguage : 'en';
};

export const tolgee = Tolgee()
  .use(FormatSimple())
  .init({
    language: getInitialLanguage(),
    fallbackLanguage: 'en',
    staticData: {
      en,
      sv,
    },
  });
