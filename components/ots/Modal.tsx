'use client';

import { X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useId, useRef } from 'react';
import { Drawer } from 'vaul';

import { useMediaQuery } from './hooks/useMediaQuery';
import { DUGME_IKON } from './Parcalar';

/**
 * Modal — spec §4.10.
 *
 * Tek bileşen, iki gövde:
 * - **md ve üstü:** ortalanmış diyalog. Motion ile giriş/çıkış, elle yazılmış
 *   odak tuzağı, `Escape`, perdeye tıklayınca kapanma, gövde kilidi.
 * - **md altı:** vaul bottom sheet. Sürükleyerek kapatma, tutamaç, odak tuzağı,
 *   `Escape`, `aria-modal` ve gövde kilidi Radix Dialog'dan gelir; X düğmesi
 *   sürüklemeyi bilmeyen kullanıcı için görünür kalır.
 *
 * Hangi dalın çizileceği `matchMedia` ile belirlenir; sunucuda ve hydration
 * sırasında bu bilinmediği için (`undefined`) hiçbir dal çizilmez. Modal zaten
 * kullanıcı eylemiyle açılır — ilk boyamada kapalıdır, kayıp yoktur.
 *
 * Çağıranlar değişmez: `{acik, kapat, baslik, altBaslik?, children, genislik?}`.
 * Yeni ve isteğe bağlı `eylemler`: verilirse gövdenin altında yapışkan eylem
 * çubuğu çizilir (md+: sağa yaslı yatay; md altı: dikey, tam genişlik).
 * Verilmezse form kendi düğmelerini gövdede taşır — eski davranış aynen çalışır.
 */
type ModalOzellikleri = {
  acik: boolean;
  kapat: () => void;
  baslik: string;
  altBaslik?: string;
  children: React.ReactNode;
  /** Yalnızca md+ diyalogda geçerli; varsayılan `max-w-lg` (konu listesi `max-w-2xl` verir). */
  genislik?: string;
  /** Eylem çubuğu içeriği — ör. [Vazgeç DUGME_SESSIZ] [Kaydet DUGME_ALTIN]. */
  eylemler?: React.ReactNode;
};

export function Modal(ozellikler: ModalOzellikleri) {
  const masaustu = useMediaQuery('(min-width:768px)');

  // Hydration bitmeden dal seçilmez (spec §9/14)
  if (masaustu === undefined) return null;

  return masaustu ? <Diyalog {...ozellikler} /> : <Sheet {...ozellikler} />;
}

/* ---------------------------------------------------------------- Ortak parça */

const BASLIK = 'font-display text-[18px] font-bold tracking-[-0.01em] text-ots-ink';
const ALT_BASLIK = 'mt-0.5 text-[13px] leading-snug text-ots-faint';

function KapatDugmesi({ kapat }: { kapat: () => void }) {
  return (
    <button type="button" onClick={kapat} aria-label="Kapat" className={DUGME_IKON}>
      <X size={18} strokeWidth={2} aria-hidden />
    </button>
  );
}

/* ------------------------------------------------------------- Diyalog (md+) */

/** Tek easing — spec §2.1 `--ease-ots`. */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const ODAKLANABILIR =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), ' +
  'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function Diyalog({
  acik,
  kapat,
  baslik,
  altBaslik,
  children,
  genislik = 'max-w-lg',
  eylemler,
}: ModalOzellikleri) {
  const kutu = useRef<HTMLDivElement>(null);
  const govde = useRef<HTMLDivElement>(null);
  const oncekiOdak = useRef<HTMLElement | null>(null);
  const baslikId = useId();
  const altBaslikId = useId();
  const azalt = useReducedMotion() === true;

  // Açılış/kapanış: gövde kilidi, odağı içeri al, kapanınca çağırana geri ver.
  // Yalnızca `acik` değişince çalışır — çağıranın her render'da yeni `kapat`
  // fonksiyonu vermesi odağı ilk alana geri fırlatmasın.
  useEffect(() => {
    if (!acik) return;

    oncekiOdak.current = document.activeElement as HTMLElement | null;
    const kaydirma = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Önce gövdedeki ilk alan (form akışı), yoksa kapat düğmesi, yoksa kutu
    const ilk =
      govde.current?.querySelector<HTMLElement>(ODAKLANABILIR) ??
      kutu.current?.querySelector<HTMLElement>(ODAKLANABILIR) ??
      kutu.current;
    ilk?.focus();

    return () => {
      document.body.style.overflow = kaydirma;
      oncekiOdak.current?.focus();
    };
  }, [acik]);

  // Klavye: Escape kapatır, Tab diyaloğun içinde döner
  useEffect(() => {
    if (!acik) return;

    function tus(olay: KeyboardEvent) {
      if (olay.key === 'Escape') {
        olay.preventDefault();
        kapat();
        return;
      }
      if (olay.key !== 'Tab' || !kutu.current) return;

      const odaklanabilir = kutu.current.querySelectorAll<HTMLElement>(ODAKLANABILIR);
      if (odaklanabilir.length === 0) {
        olay.preventDefault();
        return;
      }

      const ilkOge = odaklanabilir[0];
      const sonOge = odaklanabilir[odaklanabilir.length - 1];
      const disarida = !kutu.current.contains(document.activeElement);

      if (olay.shiftKey && (disarida || document.activeElement === ilkOge)) {
        olay.preventDefault();
        sonOge.focus();
      } else if (!olay.shiftKey && (disarida || document.activeElement === sonOge)) {
        olay.preventDefault();
        ilkOge.focus();
      }
    }

    document.addEventListener('keydown', tus);
    return () => document.removeEventListener('keydown', tus);
  }, [acik, kapat]);

  return (
    <AnimatePresence>
      {acik && (
        <motion.div
          key="perde"
          className="yazdirma-disi fixed inset-0 z-50 flex items-center justify-center bg-ots-overlay p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: azalt ? 0 : 0.12, ease: EASE } }}
          transition={{ duration: azalt ? 0 : 0.18, ease: EASE }}
          onMouseDown={(olay) => {
            // Yalnızca perdeye basıldıysa kapat; içeride sürükleme kapatmasın
            if (olay.target === olay.currentTarget) kapat();
          }}
        >
          <motion.div
            ref={kutu}
            role="dialog"
            aria-modal="true"
            aria-labelledby={baslikId}
            aria-describedby={altBaslik ? altBaslikId : undefined}
            tabIndex={-1}
            initial={azalt ? false : { opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.97,
              y: 8,
              transition: { duration: azalt ? 0 : 0.12, ease: EASE },
            }}
            transition={{ duration: azalt ? 0 : 0.18, ease: EASE }}
            /* Yükseklik ekranla sınırlı: içerik uzunsa gövde kendi içinde kayar;
               başlık ve eylem çubuğu hep görünür kalır. */
            className={`flex max-h-[calc(100dvh-3rem)] w-full ${genislik} flex-col rounded-2xl border border-ots-line bg-ots-surface shadow-ots-dialog outline-none`}
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-ots-line p-5">
              <div className="min-w-0">
                <h2 id={baslikId} className={BASLIK}>
                  {baslik}
                </h2>
                {altBaslik && (
                  <p id={altBaslikId} className={ALT_BASLIK}>
                    {altBaslik}
                  </p>
                )}
              </div>
              <KapatDugmesi kapat={kapat} />
            </div>

            <div ref={govde} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
              {children}
            </div>

            {eylemler && (
              <div className="sticky bottom-0 flex shrink-0 justify-end gap-3 rounded-b-2xl border-t border-ots-line bg-ots-surface p-4">
                {eylemler}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------- Bottom sheet (md altı) */

function Sheet({ acik, kapat, baslik, altBaslik, children, eylemler }: ModalOzellikleri) {
  return (
    <Drawer.Root
      open={acik}
      onOpenChange={(acilsin) => {
        if (!acilsin) kapat();
      }}
      /* Klavye açılınca girdiyi vaul değil tarayıcı hizalar; iOS'ta
         `max-h-[92dvh]` + `interactive-widget=resizes-content` yeter (spec §5.4) */
      repositionInputs={false}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="yazdirma-disi fixed inset-0 z-40 bg-ots-overlay" />
        <Drawer.Content
          className="yazdirma-disi fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-[20px] border-t border-ots-line bg-ots-surface pb-[env(safe-area-inset-bottom)] shadow-ots-sheet outline-none motion-reduce:transition-none!"
        >
          {/* Tutamaç — dekoratif; sürükleme içeriğin her yerinden çalışır */}
          <div aria-hidden className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-ots-line-strong" />

          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-ots-line px-4 pb-3 pt-3">
            <div className="min-w-0">
              <Drawer.Title className={BASLIK}>{baslik}</Drawer.Title>
              {/* Description her zaman var: boşsa yalnızca ekran okuyucuya kapatma
                  yolunu söyler — Radix "eksik Description" uyarısı vermez */}
              {altBaslik ? (
                <Drawer.Description className={ALT_BASLIK}>{altBaslik}</Drawer.Description>
              ) : (
                <Drawer.Description className="sr-only">
                  Kapatmak için aşağı sürükleyin ya da Kapat düğmesine basın.
                </Drawer.Description>
              )}
            </div>
            <KapatDugmesi kapat={kapat} />
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
            {children}
          </div>

          {eylemler && (
            <div className="sticky bottom-0 flex shrink-0 flex-col gap-2 border-t border-ots-line bg-ots-surface px-4 py-3">
              {eylemler}
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
