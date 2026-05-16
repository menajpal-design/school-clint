'use client';

import { Languages } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="fixed right-4 top-4 z-[100] flex items-center gap-2 rounded-full border border-border bg-background/95 px-3 py-2 text-sm shadow-md backdrop-blur">
      <Languages className="h-4 w-4 text-muted-foreground" />
      <span className="hidden text-muted-foreground sm:inline">{t('Language')}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as 'en' | 'bn')}
        className="bg-transparent text-sm font-medium outline-none"
        aria-label="Language"
        title="Language"
      >
        <option value="en">English</option>
        <option value="bn">বাংলা</option>
      </select>
    </div>
  );
}
