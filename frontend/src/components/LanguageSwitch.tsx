import { useTolgee, useTranslate } from '@tolgee/react';
import { useEffect } from 'react';

const languageStorageKey = 'clarus.language';

const languages = [
  { code: 'en', shortLabel: 'EN', labelKey: 'languageSwitch.english' },
  { code: 'sv', shortLabel: 'SV', labelKey: 'languageSwitch.swedish' },
];

type LanguageSwitchProps = {
  className?: string;
};

const LanguageSwitch = ({ className }: LanguageSwitchProps) => {
  const tolgee = useTolgee(['language']);
  const { t } = useTranslate();
  const currentLanguage = tolgee.getLanguage() ?? 'en';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = currentLanguage;
    }
  }, [currentLanguage]);

  const handleChange = (language: string) => {
    if (language === currentLanguage) return;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(languageStorageKey, language);
    }
    void tolgee.changeLanguage(language);
  };

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-[rgba(167,185,180,0.7)] bg-white/90 p-1 text-xs font-semibold text-[#0f7a6a] shadow-[0_10px_24px_rgba(31,41,55,0.08)] ${
        className ?? ''
      }`}
      role="group"
      aria-label={t('languageSwitch.label')}
    >
      {languages.map((language) => {
        const isActive = currentLanguage === language.code;
        return (
          <button
            key={language.code}
            type="button"
            aria-pressed={isActive}
            aria-label={t(language.labelKey)}
            onClick={() => handleChange(language.code)}
            className={`rounded-full px-3 py-1 transition-all ${
              isActive
                ? 'bg-[#0f7a6a] text-white shadow-[0_8px_16px_rgba(15,122,106,0.25)]'
                : 'text-[#0f7a6a] hover:bg-[#e8f3f0]'
            }`}
          >
            {language.shortLabel}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSwitch;
