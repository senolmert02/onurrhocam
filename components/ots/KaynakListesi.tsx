'use client';

import {
  BookMarked,
  BookOpen,
  ClipboardList,
  Loader2,
  Search,
  Tag,
  Video,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { kaynakSil } from '@/lib/ots/actions/kaynak';
import type { Kaynak } from '@/lib/ots/sema';
import type { DersKaynaklari } from '@/lib/ots/sorgular/kaynak';

import { Bildirim, GIRDI } from './Alan';
import { Bos, DUGME_SESSIZ, DUGME_TEHLIKE, DUGME_TEHLIKE_DOLU, Kart, Rozet } from './Parcalar';

/**
 * Kaynak listesi — ders başına bir `Kart`, içinde `min-h-12` satırlar.
 *
 * Arama istemci tarafında (ad, tür, not ve ders adında); veri sunucudan gelir.
 * Silme iki adımlıdır (çerçeveli → dolu, spec §8 "Denemeler"); onay adımı
 * hover'a bağlı değildir, dokunmatikte de aynı yol izlenir. Silinen satır
 * sunucu tazelemesini beklemeden yerel olarak kaybolur (AnimatePresence);
 * hata olursa satır geri gelir ve altında `Bildirim` görünür.
 */
export function KaynakListesi({ gruplar }: { gruplar: DersKaynaklari[] }) {
  const [arama, setArama] = useState('');
  const [silinenler, setSilinenler] = useState<ReadonlySet<string>>(() => new Set());

  const toplam = gruplar.reduce((t, g) => t + g.kaynaklar.length, 0);
  const anahtar = arama.trim().toLocaleLowerCase('tr');

  const gorunen = gruplar
    .map((g) => ({
      ders: g.ders,
      kaynaklar: g.kaynaklar.filter((k) => !silinenler.has(k.id) && eslesir(k, anahtar)),
    }))
    .filter((g) => g.kaynaklar.length > 0);

  function silindi(id: string) {
    setSilinenler((s) => new Set(s).add(id));
  }

  function geriGetir(id: string) {
    setSilinenler((s) => {
      const yeni = new Set(s);
      yeni.delete(id);
      return yeni;
    });
  }

  if (toplam === 0) {
    return (
      <Bos
        ikon={BookMarked}
        baslik="Henüz kaynak yok"
        aciklama="Elindeki kitap, soru bankası ve video setlerini ekle; program bunlara göre yazılır."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Arama — h-11, istemci filtresi */}
      <div className="relative yazdirma-disi">
        <Search
          size={18}
          strokeWidth={2}
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ots-faint"
        />
        <input
          type="search"
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          placeholder="Kaynak ara…"
          aria-label="Kaynaklarda ara"
          className={`${GIRDI} h-11 pl-11`}
        />
      </div>

      {gorunen.length === 0 ? (
        <Bos
          ikon={Search}
          baslik="Eşleşen kaynak yok"
          aciklama="Farklı bir ad ya da ders adı deneyin."
          eylem={
            <button type="button" onClick={() => setArama('')} className={DUGME_SESSIZ}>
              Aramayı temizle
            </button>
          }
        />
      ) : (
        gorunen.map((grup, i) => (
          <div
            key={grup.ders}
            className="ots-belir"
            style={{ '--i': Math.min(i, 6) } as React.CSSProperties}
          >
            <Kart baslik={grup.ders} altBaslik={`${grup.kaynaklar.length} kaynak`}>
              <ul className="-my-1 divide-y divide-ots-line">
                <AnimatePresence initial={false}>
                  {grup.kaynaklar.map((kaynak) => (
                    <KaynakSatiri
                      key={kaynak.id}
                      kaynak={kaynak}
                      silindi={() => silindi(kaynak.id)}
                      geriGetir={() => geriGetir(kaynak.id)}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            </Kart>
          </div>
        ))
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Yardımcı */

function eslesir(k: Kaynak, anahtar: string): boolean {
  if (!anahtar) return true;
  return [k.ad, k.tur, k.notMetni, k.ders].some((m) =>
    m.toLocaleLowerCase('tr').includes(anahtar),
  );
}

/** Tür → ikon. Renk tek başına anlam taşımaz; tür adı rozet olarak da yazılır. */
const TUR_IKONLARI: Record<string, LucideIcon> = {
  'Soru bankası': BookOpen,
  'Konu anlatımı': BookMarked,
  Deneme: ClipboardList,
  Video: Video,
};

/* --------------------------------------------------------------------- Satır */

function KaynakSatiri({
  kaynak,
  silindi,
  geriGetir,
}: {
  kaynak: Kaynak;
  silindi: () => void;
  geriGetir: () => void;
}) {
  const [onay, setOnay] = useState(false);
  const [hata, setHata] = useState('');
  const [islemde, basla] = useTransition();

  const Ikon = TUR_IKONLARI[kaynak.tur] ?? Tag;

  function sil() {
    setHata('');
    basla(async () => {
      const sonuc = await kaynakSil(kaynak.id);
      if (sonuc.ok) {
        toast.success(sonuc.mesaj);
        silindi();
      } else {
        setHata(sonuc.mesaj);
        setOnay(false);
        geriGetir();
      }
    });
  }

  return (
    <motion.li
      layout
      exit={{ opacity: 0, height: 0, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }}
      className="ots-liste-oge overflow-hidden"
    >
      <div className="flex min-h-12 lg:min-h-10 flex-wrap items-center gap-3 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-ots-gold-tint text-ots-gold-ink">
          <Ikon size={18} strokeWidth={2} aria-hidden />
        </span>

        <div className="min-w-0 flex-1 basis-40">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-[15px] font-semibold leading-snug text-ots-ink">{kaynak.ad}</p>
            {kaynak.tur && <Rozet>{kaynak.tur}</Rozet>}
          </div>
          {kaynak.notMetni && (
            <p className="mt-1 whitespace-pre-wrap text-[13px] leading-snug text-ots-soft">
              {kaynak.notMetni}
            </p>
          )}
        </div>

        {/* Silme: çerçeveli → dolu; mobilde satırın altına iner */}
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          {onay ? (
            <>
              <button
                type="button"
                onClick={sil}
                disabled={islemde}
                aria-busy={islemde}
                className={`${DUGME_TEHLIKE_DOLU} flex-1 sm:flex-none`}
              >
                {islemde && (
                  <Loader2 size={16} strokeWidth={2.25} aria-hidden className="animate-spin" />
                )}
                Evet, sil
              </button>
              <button
                type="button"
                onClick={() => setOnay(false)}
                disabled={islemde}
                className={`${DUGME_SESSIZ} flex-1 sm:flex-none`}
              >
                Vazgeç
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setOnay(true)}
              aria-label={`${kaynak.ad} kaynağını sil`}
              className={`${DUGME_TEHLIKE} w-full sm:w-auto`}
            >
              Sil
            </button>
          )}
        </div>

        {hata && (
          <div className="w-full">
            <Bildirim ok={false} mesaj={hata} />
          </div>
        )}
      </div>
    </motion.li>
  );
}
