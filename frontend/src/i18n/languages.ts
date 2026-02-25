export const LANGUAGE_STORAGE_KEY = 'clarus.language';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', shortLabel: 'EN', labelKey: 'languageSwitch.english', flag: '🇬🇧', name: 'English' },
  { code: 'de', shortLabel: 'DE', labelKey: 'languageSwitch.german', flag: '🇩🇪', name: 'German' },
  { code: 'es', shortLabel: 'ES', labelKey: 'languageSwitch.spanish', flag: '🇪🇸', name: 'Spanish' },
  { code: 'fi', shortLabel: 'FI', labelKey: 'languageSwitch.finnish', flag: '🇫🇮', name: 'Finnish' },
  { code: 'nl', shortLabel: 'NL', labelKey: 'languageSwitch.dutch', flag: '🇳🇱', name: 'Dutch' },
  { code: 'sv', shortLabel: 'SV', labelKey: 'languageSwitch.swedish', flag: '🇸🇪', name: 'Swedish' },
  { code: 'zh', shortLabel: 'ZH', labelKey: 'languageSwitch.mandarin', flag: '🇨🇳', name: 'Chinese' },
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

export const DEFAULT_LANGUAGE: SupportedLanguageCode = 'en';

const supportedLanguageSet = new Set(SUPPORTED_LANGUAGES.map((language) => language.code));

export const normalizeLanguageTag = (value?: string | null): string | null => {
  const trimmed = value?.trim().toLowerCase();
  if (!trimmed) return null;
  const base = trimmed.split('-')[0];
  return base || null;
};

export const normalizeSupportedLanguage = (value?: string | null): SupportedLanguageCode | null => {
  const base = normalizeLanguageTag(value);
  if (!base) return null;
  return supportedLanguageSet.has(base as SupportedLanguageCode)
    ? (base as SupportedLanguageCode)
    : null;
};

export const LANGUAGE_NAME_MAP: Record<SupportedLanguageCode, string> = SUPPORTED_LANGUAGES.reduce(
  (acc, language) => {
    acc[language.code] = language.name;
    return acc;
  },
  {} as Record<SupportedLanguageCode, string>,
);

export const getLanguageLabel = (code: string): string => {
  const normalized = normalizeSupportedLanguage(code);
  if (normalized) {
    return LANGUAGE_NAME_MAP[normalized];
  }
  return code;
};
