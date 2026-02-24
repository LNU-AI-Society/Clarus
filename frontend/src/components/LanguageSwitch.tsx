import { Menu } from '@base-ui/react';
import { T, useTolgee } from '@tolgee/react';
import { ChevronDown } from 'lucide-react';
import { useEffect, useMemo } from 'react';

const languageStorageKey = 'clarus.language';

const languages = [
  { code: 'en', shortLabel: 'EN', labelKey: 'languageSwitch.english', flag: '🇬🇧' },
  { code: 'de', shortLabel: 'DE', labelKey: 'languageSwitch.german', flag: '🇩🇪' },
  { code: 'es', shortLabel: 'ES', labelKey: 'languageSwitch.spanish', flag: '🇪🇸' },
  { code: 'fi', shortLabel: 'FI', labelKey: 'languageSwitch.finnish', flag: '🇫🇮' },
  { code: 'nl', shortLabel: 'NL', labelKey: 'languageSwitch.dutch', flag: '🇳🇱' },
  { code: 'sv', shortLabel: 'SV', labelKey: 'languageSwitch.swedish', flag: '🇸🇪' },
  { code: 'zh', shortLabel: 'ZH', labelKey: 'languageSwitch.mandarin', flag: '🇨🇳' },
];

type LanguageSwitchProps = {
  className?: string;
};

const LanguageSwitch = ({ className }: LanguageSwitchProps) => {
  const tolgee = useTolgee(['language']);
  const currentLanguage = tolgee.getLanguage() ?? 'en';
  const current = useMemo(
    () => languages.find((language) => language.code === currentLanguage) ?? languages[0],
    [currentLanguage],
  );

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
    <div className={`relative inline-flex items-center ${className ?? ''}`}>
      <Menu.Root>
        <Menu.Trigger
          nativeButton
          aria-label="Language switch"
          className="border-border-strong/70 bg-surface/90 text-brand shadow-soft hover:shadow-soft-hover inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-all hover:-translate-y-px"
        >
          <span className="text-base leading-none" aria-hidden="true">
            {current.flag}
          </span>
          <span>{current.shortLabel}</span>
          <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup className="border-border/80 bg-surface/95 text-ink shadow-popover absolute top-full right-0 z-20 mt-2 w-52 rounded-2xl border p-2 text-sm backdrop-blur-sm transition-all duration-150 data-[state=open]:translate-y-0 data-[state=open]:opacity-100 data-[state=closed]:pointer-events-none data-[state=closed]:translate-y-1 data-[state=closed]:opacity-0">
              {languages.map((language) => {
                const isActive = currentLanguage === language.code;
                return (
                  <Menu.Item
                    key={language.code}
                    render={
                      <button
                        type="button"
                        role="menuitemradio"
                        aria-checked={isActive}
                      />
                    }
                    onClick={() => handleChange(language.code)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${isActive ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-surface-muted'
                      }`}
                  >
                    <span className="text-base leading-none" aria-hidden="true">
                      {language.flag}
                    </span>
                    <span className="flex-1 font-medium">
                      <T keyName={language.labelKey} />
                    </span>
                    {isActive && (
                      <span className="bg-brand h-1.5 w-1.5 rounded-full" aria-hidden="true" />
                    )}
                  </Menu.Item>
                );
              })}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
};

export default LanguageSwitch;
