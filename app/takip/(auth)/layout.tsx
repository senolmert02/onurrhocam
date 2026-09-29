import type { Viewport } from 'next';
import Link from 'next/link';

import { DUGME_HAYALET } from '@/components/ots/Parcalar';
import { UYGULAMA } from '@/lib/ots/sabitler';

/**
 * Giriş/kayıt ekranlarında tarayıcı çubuğu lacivert iskelet rengine boyanır
 * (spec §8 "Giriş"). Üst segment (`app/takip/layout.tsx`) `#141E34` verir;
 * Next 16 `mergeViewport` iç segmentin `themeColor`'ını üstünkinin üstüne yazar
 * (kök → yaprak sırası, son kazanır) — node_modules/next/dist/lib/metadata/
 * resolve-metadata.js ile doğrulandı. `themeColor` bir meta etiketidir, CSS
 * tokenı okuyamaz; değer `--color-ots-panel` ile aynıdır.
 */
export const viewport: Viewport = {
  themeColor: '#0F172A',
};

/**
 * Giriş ve kayıt ekranlarının ortak kabuğu — spec §8 "Giriş".
 *
 * Üstte lacivert iskelet bloğu (marka + slogan + siteye dönüş), altında bloğun
 * üstüne binen tek kart. Kart dikeyde ORTALANMAZ (`items-start`): klavye
 * açılınca görünüm daralır ve ortalanan kart yukarı zıplardı; şimdi yerinde
 * kalır. Blok yüksekliği `dvh` tabanlı — `interactive-widget=resizes-content`
 * ile klavye açıkken blok da küçülür, kart ekranda kalır (spec §9/8: `vh` yok).
 */
export default function KimlikLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-ots-bg">
      <header className="h-[40dvh] min-h-[220px] bg-ots-panel">
        <div className="mx-auto flex h-full w-full max-w-[400px] flex-col px-4 pb-24 pt-[max(1rem,env(safe-area-inset-top))]">
          {/* Hayalet düğme panel üstünde: metin soft; hover altın tint spec'ten */}
          <Link href="/" className={`${DUGME_HAYALET} self-start text-ots-panel-soft!`}>
            ← Siteye dön
          </Link>

          <div className="mt-auto flex items-center gap-3">
            <span
              aria-hidden
              className="grid h-11 lg:h-9 w-11 lg:w-9 shrink-0 place-items-center rounded-[10px] bg-ots-gold font-display text-[18px] font-bold leading-none text-ots-panel"
            >
              OH
            </span>
            <div className="min-w-0">
              <p className="font-display text-[22px] font-bold leading-tight tracking-[-0.02em] text-ots-panel-ink">
                OnurrHocam
              </p>
              <p className="mt-0.5 text-[14px] leading-snug text-ots-panel-soft">{UYGULAMA.slogan}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pb-10">
        <div className="-mt-16 w-full max-w-[400px] rounded-2xl border border-ots-line bg-ots-surface p-6 shadow-ots-dialog sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
