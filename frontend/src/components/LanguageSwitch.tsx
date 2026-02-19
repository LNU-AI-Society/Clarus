import { useTolgee, useTranslate } from '@tolgee/react';
import { ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const languageStorageKey = 'clarus.language';

const languages = [
  { code: 'en', shortLabel: 'EN', labelKey: 'languageSwitch.english', flag: '🇬🇧' },
  { code: 'sv', shortLabel: 'SV', labelKey: 'languageSwitch.swedish', flag: '🇸🇪' },
];

type LanguageSwitchProps = {
  className?: string;
};

const LanguageSwitch = ({ className }: LanguageSwitchProps) => {
  const tolgee = useTolgee(['language']);
  const { t } = useTranslate();
  const currentLanguage = tolgee.getLanguage() ?? 'en';
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const current = useMemo(
    () => languages.find((language) => language.code === currentLanguage) ?? languages[0],
    [currentLanguage],
  );

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = currentLanguage;
    }
  }, [currentLanguage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleChange = (language: string) => {
    if (language === currentLanguage) return;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(languageStorageKey, language);
    }
    void tolgee.changeLanguage(language);
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center ${className ?? ''}`}
      aria-label={t('languageSwitch.label')}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="inline-flex items-center gap-2 rounded-full border border-[rgba(167,185,180,0.7)] bg-white/90 px-3 py-2 text-xs font-semibold text-[#0f7a6a] shadow-[0_10px_24px_rgba(31,41,55,0.08)] transition-all hover:-translate-y-[1px] hover:shadow-[0_14px_30px_rgba(31,41,55,0.12)]"
      >
        <span className="text-base leading-none" aria-hidden="true">
          {current.flag}
        </span>
        <span>{current.shortLabel}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div
        role="menu"
        aria-hidden={!isOpen}
        className={`absolute right-0 top-full z-20 mt-2 w-52 rounded-2xl border border-[rgba(229,222,216,0.8)] bg-white/95 p-2 text-sm text-[#1f2937] shadow-[0_18px_40px_rgba(31,41,55,0.16)] backdrop-blur-sm transition-all duration-150 ${
          isOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-1 opacity-0'
        }`}
      >
        {languages.map((language) => {
          const isActive = currentLanguage === language.code;
          return (
            <button
              key={language.code}
              type="button"
              role="menuitemradio"
              aria-checked={isActive}
              onClick={() => {
                handleChange(language.code);
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                isActive
                  ? 'bg-[#e8f3f0] text-[#0f7a6a]'
                  : 'text-[#5c6664] hover:bg-[#f5f1ec]'
              }`}
            >
              <span className="text-base leading-none" aria-hidden="true">
                {language.flag}
              </span>
              <span className="flex-1 font-medium">{t(language.labelKey)}</span>
              {isActive && (
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[#0f7a6a]"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LanguageSwitch;
