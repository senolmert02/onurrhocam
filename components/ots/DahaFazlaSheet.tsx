'use client';

import { X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Drawer } from 'vaul';

import { IKONLAR, etkinMi, type MenuOgesi } from './KenarMenu';
import { DUGME_IKON, ODAK_HALKASI } from './Parcalar';

/* Spec §5.1 kutucuk reçetesi: yükseltilmiş zemin, dekoratif kenar, 72px hedef. */
const KUTUCUK =
  'relative flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-[10px] border px-2 ' +
  `text-center text-[13px] font-medium leading-snug transition-colors duration-150 ease-ots ${ODAK_HALKASI}`;
const KUTUCUK_PASIF = 'border-ots-line bg-ots-raised text-ots-ink active:bg-ots-line';
const KUTUCUK_ETKIN = 'border-ots-gold-deep/40 bg-ots-gold-tint text-ots-gold-ink';

/**
 * "Daha fazla" bottom sheet'i — alt sekme çubuğuna sığmayan sayfalar (spec §5.1).
 *
 * vaul (Radix Dialog tabanlı): sürükleyerek kapatma, Escape, odak tuzağı,
 * `aria-modal` ve gövde kilidi hazır gelir. `snapPoints` yok; içerik
 * `max-h-[92dvh]` içinde kendi kayar. X düğmesi görünür kalır — sürüklemeyi
 * bilmeyen kullanıcı için.
 */
export function DahaFazlaSheet({
  acik,
  kapat,
  ogeler,
  kullaniciAdi,
  rolAdi,
  cikis,
}: {
  acik: boolean;
  kapat: () => void;
  ogeler: MenuOgesi[];
  kullaniciAdi: string;
  rolAdi: string;
  cikis: ReactNode;
}) {
  const yol = usePathname();

  return (
    <Drawer.Root
      open={acik}
      onOpenChange={(o) => {
        if (!o) kapat();
      }}
      repositionInputs={false}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-ots-overlay" />
        <Drawer.Content
          className="yazdirma-disi fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col
            rounded-t-[20px] bg-ots-surface pb-[env(safe-area-inset-bottom)] shadow-ots-sheet
            outline-none motion-reduce:transition-none!"
        >
          {/* Sürükleme tutamacı */}
          <div aria-hidden className="mx-auto mt-2.5 h-1 w-9 rounded-full bg-ots-line-strong/60" />

          <header className="flex items-start justify-between gap-3 border-b border-ots-line px-4 pb-3 pt-3">
            <div className="min-w-0">
              <Drawer.Title className="font-display text-[18px] font-bold tracking-[-0.01em] text-ots-ink">
                Daha fazla
              </Drawer.Title>
              <Drawer.Description className="mt-0.5 truncate text-[13px] text-ots-faint">
                {kullaniciAdi} · {rolAdi}
              </Drawer.Description>
            </div>
            <Drawer.Close aria-label="Kapat" className={DUGME_IKON}>
              <X size={18} aria-hidden />
            </Drawer.Close>
          </header>

          <nav
            aria-label="Diğer sayfalar"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"
          >
            <ul className="grid grid-cols-2 gap-3">
              {ogeler.map(({ etiket, adres, ikon, rozet }) => {
                const Ikon = IKONLAR[ikon];
                const etkin = etkinMi(yol, adres);
                return (
                  <li key={adres}>
                    <Link
                      href={adres}
                      onClick={kapat}
                      aria-current={etkin ? 'page' : undefined}
                      className={`${KUTUCUK} ${etkin ? KUTUCUK_ETKIN : KUTUCUK_PASIF}`}
                    >
                      <Ikon size={22} strokeWidth={2} aria-hidden className="text-ots-gold-ink" />
                      <span>{etiket}</span>
                      {rozet ? (
                        <span
                          className="ots-sayi absolute right-2 top-2 inline-grid h-5 min-w-5 place-items-center
                            rounded-md bg-ots-gold px-1 text-[11px] font-bold text-ots-panel"
                        >
                          {rozet}
                          <span className="sr-only"> bekleyen</span>
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-ots-line px-4 py-3">{cikis}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
