import type { Metadata, Viewport } from 'next';

import { UYGULAMA } from '@/lib/ots/sabitler';

/**
 * ÖTS kabuğu.
 *
 * Portfolyo sitesinin navbar'ı ve footer'ı burada görünmez; `/takip` ayrı bir
 * uygulama gibi davranır. Arama motorlarına kapalı: bu sayfalar öğrenci
 * verisine açılan bir giriş kapısı, indekslenmelerinin bir faydası yok.
 */
export const metadata: Metadata = {
  title: UYGULAMA.kisaAd,
  description: 'Öğrenci takip ve koçluk paneli.',
  robots: { index: false, follow: false },
};

/**
 * Spec §5.2. `viewportFit: 'cover'` safe-area değişkenlerini açar;
 * `interactiveWidget: 'resizes-content'` klavye açılınca içeriği daraltır
 * (alt çubuk ve sheet klavyenin üstünde yüzmez). `maximumScale` /
 * `userScalable: false` bilinçli olarak KONMAZ (spec §9 madde 8).
 * `themeColor` bir meta etiketidir, CSS tokenı okuyamaz; değer
 * `--color-ots-bg` ile aynıdır.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#141E34',
  interactiveWidget: 'resizes-content',
};

export default function TakipLayout({ children }: { children: React.ReactNode }) {
  return <div className="ots-kok flex min-h-dvh flex-col bg-ots-bg text-ots-ink">{children}</div>;
}
