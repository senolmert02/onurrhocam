'use client';

import { CircleAlert, CircleCheck, Info, Loader2, TriangleAlert } from 'lucide-react';
import { Toaster } from 'sonner';

import { useMediaQuery } from './hooks/useMediaQuery';

/*
 * Sonner kendi stilini katmansız (`@layer` dışı) enjekte eder; Tailwind
 * yardımcıları `@layer utilities` içinde kaldığından yalnızca `!` (important)
 * ile üstüne çıkar. Tüm renkler --color-ots-* tokenlarından (spec §4.6).
 */
const TOAST =
  'bg-ots-panel! text-ots-panel-ink! border! border-ots-panel-line! shadow-ots-sheet! ' +
  'rounded-[10px]! font-sans! text-[14px]! leading-snug!';

/** Sonner'ın 16px ikon kutusuna oturan lucide ikonları — durum rengi + metin birlikte. */
const IKON = { size: 16, strokeWidth: 2, 'aria-hidden': true } as const;

/**
 * ÖTS toast katmanı — spec §4.6. `(panel)/layout.tsx`'e bir kez konur; root
 * layout'a KONMAZ (portfolyo dokunulmaz).
 *
 * Konum: lg altında `top-center` (alt sekme çubuğuyla çakışmaz), lg+ `bottom-right`.
 * `richColors` yok — durum rengi yalnızca ikonda, anlam metinde.
 * Sunucuda konum bilinmez (`undefined`) → mobil varsayılanı; toast zaten
 * kullanıcı eyleminden sonra çıkar.
 */
export function OtsToaster() {
  const genis = useMediaQuery('(min-width:1024px)');

  return (
    <Toaster
      position={genis ? 'bottom-right' : 'top-center'}
      theme="dark"
      richColors={false}
      duration={3200}
      visibleToasts={2}
      expand={false}
      className="yazdirma-disi"
      /* Çentikli telefonlarda üst güvenli alanın altına iner */
      mobileOffset={{ top: 'calc(env(safe-area-inset-top) + 12px)', left: 16, right: 16, bottom: 16 }}
      icons={{
        success: <CircleCheck {...IKON} className="text-ots-yesil" />,
        error: <CircleAlert {...IKON} className="text-ots-kirmizi" />,
        warning: <TriangleAlert {...IKON} className="text-ots-turuncu" />,
        info: <Info {...IKON} className="text-ots-panel-soft" />,
        loading: <Loader2 {...IKON} className="animate-spin text-ots-gold-bright" />,
      }}
      toastOptions={{
        className: TOAST,
        classNames: {
          title: 'font-semibold! text-ots-panel-ink!',
          description: 'text-[13px]! text-ots-panel-soft!',
        },
      }}
    />
  );
}
