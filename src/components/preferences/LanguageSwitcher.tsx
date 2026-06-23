import { Languages } from 'lucide-react';
import { usePreferences } from '@/contexts/preferences';

interface LanguageSwitcherProps {
  compact?: boolean;
  className?: string;
}

export function LanguageSwitcher({ compact = false, className = '' }: LanguageSwitcherProps) {
  const { language, setLanguage } = usePreferences();

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-xl border border-white/10 bg-black/30 p-1 backdrop-blur-xl ${className}`}
      role="group"
      aria-label={language === 'en-US' ? 'Select language' : 'Selecionar idioma'}
    >
      {!compact && <Languages className="mx-1 h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />}
      {(['pt-BR', 'en-US'] as const).map(locale => {
        const active = language === locale;
        return (
          <button
            key={locale}
            type="button"
            onClick={() => setLanguage(locale)}
            aria-pressed={active}
            className={`rounded-lg px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] transition-colors ${
              active
                ? 'bg-cyan-400 text-slate-950'
                : 'text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {locale === 'pt-BR' ? 'PT' : 'EN'}
          </button>
        );
      })}
    </div>
  );
}
