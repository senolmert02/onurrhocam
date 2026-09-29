'use client';

import { Check, Search } from 'lucide-react';
import { useState } from 'react';

import {
  KONU_TONLARI,
  KonuSatiri,
  type KonuKayitOzeti,
} from '@/components/ots/koc/KonuSatiri';
import { trTarih } from '@/lib/ots/tarih';

import { GIRDI } from './Alan';
import { Modal } from './Modal';
import { Ilerleme, ODAK_HALKASI, Rozet } from './Parcalar';

export type DersKarti = {
  ders: string;
  toplam: number;
  tamamlanan: number;
  yuzde: number;
  konular: {
    id: string;
    konu: string;
    kayit: KonuKayitOzeti;
  }[];
};

/** Türkçe karakter duyarlı, büyük/küçük harf duyarsız arama. */
function esles(metin: string, arama: string) {
  return metin.toLocaleLowerCase('tr-TR').includes(arama.toLocaleLowerCase('tr-TR'));
}

/**
 * Konu takibi — ders kartları, konular sheet/diyalogda (spec §8 "Konu kartları").
 *
 * Katalog 271 konu içeriyor; hepsini alt alta dökmek sonu gelmeyen bir kaydırma
 * üretiyordu. Dersler kart olarak duruyor, konular seçilen dersin diyaloğunda
 * (md altı bottom sheet) açılıyor. Koç durumları orada değiştiriyor, öğrenci
 * yalnızca görüyor.
 *
 * Açık ders **ad** olarak tutulur, kopya olarak değil: koç bir durumu kaydedince
 * sunucu sayfayı yeniler ve `dersler` yeni gelir; açık liste de güncel kalır.
 */
export function KonuKartlari({
  ogrenciId,
  dersler,
  duzenlenebilir,
}: {
  ogrenciId: string;
  dersler: DersKarti[];
  duzenlenebilir: boolean;
}) {
  const [acikDersAdi, setAcikDersAdi] = useState<string | null>(null);
  const [arama, setArama] = useState('');

  const acikDers = acikDersAdi ? dersler.find((d) => d.ders === acikDersAdi) ?? null : null;
  const gorunenKonular = acikDers
    ? acikDers.konular.filter((k) => !arama.trim() || esles(k.konu, arama.trim()))
    : [];

  function kapat() {
    setAcikDersAdi(null);
    setArama('');
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {dersler.map((ders, i) => (
          <button
            key={ders.ders}
            type="button"
            onClick={() => setAcikDersAdi(ders.ders)}
            aria-label={`${ders.ders} konularını aç — yüzde ${ders.yuzde} tamamlandı`}
            style={{ '--i': Math.min(i, 6) } as React.CSSProperties}
            className={`ots-belir ots-yuzey-hover flex flex-col rounded-2xl border border-ots-line bg-ots-surface p-4 text-left shadow-ots active:bg-ots-raised ${ODAK_HALKASI}`}
          >
            <span className="flex items-start justify-between gap-2">
              <span className="min-w-0 truncate text-[15px] font-bold leading-snug text-ots-ink">
                {ders.ders}
              </span>
              <span className="ots-sayi shrink-0 font-display text-[22px] font-bold leading-none text-ots-ink">
                %{ders.yuzde}
              </span>
            </span>

            <Ilerleme
              yuzde={ders.yuzde}
              etiket={`${ders.ders} ilerlemesi`}
              className="mt-3"
            />

            <span className="ots-sayi mt-2 text-[12px] text-ots-faint">
              {ders.tamamlanan}/{ders.toplam} konu
            </span>
          </button>
        ))}
      </div>

      <Modal
        acik={acikDers !== null}
        kapat={kapat}
        baslik={acikDers?.ders ?? ''}
        genislik="max-w-2xl"
        altBaslik={
          acikDers
            ? `${acikDers.tamamlanan}/${acikDers.toplam} konu tamamlandı${
                duzenlenebilir ? ' · kutuyu işaretle ya da kalemle ayrıntı gir' : ''
              }`
            : undefined
        }
      >
        {acikDers && (
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search
                size={16}
                strokeWidth={2}
                aria-hidden
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ots-faint"
              />
              <input
                type="search"
                value={arama}
                onChange={(olay) => setArama(olay.target.value)}
                placeholder="Konu ara"
                aria-label={`${acikDers.ders} konularında ara`}
                className={`${GIRDI} h-11 pl-10`}
              />
            </div>

            {gorunenKonular.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-ots-line-strong/50 bg-ots-raised px-5 py-8 text-center text-[14px] text-ots-soft">
                Aramayla eşleşen konu yok.
              </p>
            ) : (
              <ul className="flex flex-col">
                {gorunenKonular.map(({ id, konu, kayit }) =>
                  duzenlenebilir ? (
                    <KonuSatiri
                      key={id}
                      ogrenciId={ogrenciId}
                      konuId={id}
                      konuAdi={konu}
                      kayit={kayit}
                    />
                  ) : (
                    <li
                      key={id}
                      className="flex min-h-12 lg:min-h-10 items-center gap-3 border-b border-ots-line px-1 py-2 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] leading-[1.5] text-ots-ink">{konu}</p>
                        {kayit?.notMetni && (
                          <p className="text-[13px] leading-snug text-ots-soft">{kayit.notMetni}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {kayit?.tamamlanmaTarihi && (
                          <span className="ots-sayi hidden items-center gap-1 text-[12px] text-ots-faint sm:inline-flex">
                            <Check size={14} strokeWidth={2} aria-hidden />
                            {trTarih(kayit.tamamlanmaTarihi)}
                          </span>
                        )}
                        <Rozet ton={KONU_TONLARI[kayit?.durum ?? 'Başlanmadı'] ?? 'notr'}>
                          {kayit?.durum ?? 'Başlanmadı'}
                        </Rozet>
                      </div>
                    </li>
                  ),
                )}
              </ul>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
