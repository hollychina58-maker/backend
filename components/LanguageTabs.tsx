'use client';

const LOCALES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'zh', label: '中文', name: 'Chinese' },
  { code: 'ru', label: 'RU', name: 'Русский' },
  { code: 'ar', label: 'AR', name: 'العربية' },
  { code: 'fa', label: 'FA', name: 'فارسی' },
  { code: 'la', label: 'LA', name: 'Latina' },
];

interface LanguageTabsProps {
  languages: string[];
  activeLanguage: string;
  onLanguageChange: (lang: string) => void;
}

export function LanguageTabs({ languages, activeLanguage, onLanguageChange }: LanguageTabsProps) {
  const availableLocales = LOCALES.filter((l) => languages.includes(l.code));

  return (
    <div className="flex border-b border-slate-200 dark:border-slate-700">
      {availableLocales.map((locale) => (
        <button
          key={locale.code}
          onClick={() => onLanguageChange(locale.code)}
          className={`
            px-4 py-2 text-sm font-medium border-b-2 transition-colors
            ${
              activeLanguage === locale.code
                ? 'border-[#0066ff] text-[#0066ff]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }
          `}
          title={locale.name}
        >
          {locale.label}
        </button>
      ))}
    </div>
  );
}
