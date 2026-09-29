import { ClipboardList, UserRound } from 'lucide-react';
import Link from 'next/link';

import { DenemeFormu, DenemeSil } from '@/components/ots/DenemeFormu';
import { CizgiGrafigi } from '@/components/ots/Grafik';
import { OgrenciSecici } from '@/components/ots/koc/OgrenciSecici';
import {
  Bos,
  DUGME_SESSIZ,
  Fark,
  Kart,
  Rozet,
  SayfaBasi,
  Sayac,
} from '@/components/ots/Parcalar';
import { turlereGoreSeri } from '@/lib/ots/net';
import { DENEME_TURLERI, type DenemeTuru } from '@/lib/ots/sabitler';
import { denemeListesi } from '@/lib/ots/sorgular/deneme';
import { ekranOgrencisi } from '@/lib/ots/sorgular/secim';
import { bugun as bugunuAl, trTarih, trTarihKisa } from '@/lib/ots/tarih';

export const metadata = { title: 'Denemeler — OnurrHocam ÖTS' };

/** İlk sayfada gösterilen kayıt sayısı; fazlası "Daha fazla göster" ile (spec §5.4). */
const SAYFA_BOYU = 20;

/** `.ots-belir` kademesi — kart başına 40 ms, en fazla 6 (spec §6). */
const kademe = (i: number) => ({ '--i': Math.min(i, 6) }) as React.CSSProperties;

export default async function DenemelerSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ ogrenci?: string; tum?: string }>;
}) {
  const { ogrenci: istenenId, tum } = await searchParams;
  const { kullanici, ogrenci, liste } = await ekranOgrencisi(istenenId);

  if (!ogrenci) {
    return (
      <div className="flex flex-col gap-6 sm:gap-8">
        <SayfaBasi baslik="Denemeler" />
        {kullanici.koc ? (
          <>
            <OgrenciSecici ogrenciler={liste} />
            <Bos
              ikon={UserRound}
              baslik="Öğrenci seç"
              aciklama="Denemeleri görmek için bir öğrenci seç."
            />
          </>
        ) : (
          <Bos
            ikon={ClipboardList}
            baslik="Öğrenci kaydın bulunamadı"
            aciklama="Koçunla görüşmen gerekiyor."
          />
        )}
      </div>
    );
  }

  const denemeler = await denemeListesi(ogrenci.id);

  const seriler = turlereGoreSeri(
    denemeler.map((d) => ({
      tarih: d.tarih,
      tur: d.tur,
      toplamNet: d.toplamNet,
      denemeAdi: d.denemeAdi,
    })),
    12,
  );

  const sonNet = (tur: DenemeTuru) => seriler[tur].at(-1)?.net;

  /** Aynı türdeki bir önceki denemeye göre net farkı (liste tarihe göre azalan). */
  const oncekiFark = (indeks: number) => {
    const bu = denemeler[indeks];
    const onceki = denemeler.slice(indeks + 1).find((d) => d.tur === bu.tur);
    if (!onceki) return null;
    return Math.round((bu.toplamNet - onceki.toplamNet) * 100) / 100;
  };

  const hepsi = tum === '1';
  const gorunen = hepsi ? denemeler : denemeler.slice(0, SAYFA_BOYU);
  const dahaFazlaVar = !hepsi && denemeler.length > SAYFA_BOYU;
  const dahaFazlaAdresi = `?${new URLSearchParams({
    ...(kullanici.koc ? { ogrenci: ogrenci.id } : {}),
    tum: '1',
  }).toString()}`;

  const grafikler = (Object.keys(DENEME_TURLERI) as DenemeTuru[]).filter(
    (tur) => seriler[tur].length > 1,
  );

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <SayfaBasi
        baslik={kullanici.koc ? `Denemeler · ${ogrenci.adSoyad}` : 'Denemelerim'}
        aciklama={`${denemeler.length} kayıtlı deneme`}
        sag={
          <DenemeFormu
            bugun={bugunuAl()}
            ogrenciId={kullanici.koc ? ogrenci.id : undefined}
            kocMu={kullanici.koc}
          />
        }
      />

      {kullanici.koc && <OgrenciSecici ogrenciler={liste} secili={ogrenci.id} />}

      {/* 3 sayaç: mobilde 2+1 (son kart tam genişlik), md ve üstünde tek satır (spec §5.4). */}
      <div
        className="ots-belir grid grid-cols-2 gap-3 md:grid-cols-3 [&>:last-child]:col-span-2 md:[&>:last-child]:col-span-1"
        style={kademe(0)}
      >
        {(Object.keys(DENEME_TURLERI) as DenemeTuru[]).map((tur) => (
          <Sayac
            key={tur}
            etiket={`Son ${tur} neti`}
            deger={sonNet(tur) ?? '—'}
            alt={`${seriler[tur].length} deneme`}
          />
        ))}
      </div>

      {/* Her tür ayrı grafik: netler farklı ölçekte, aynı eksene konmaz. */}
      {grafikler.length > 0 && (
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
          {grafikler.map((tur, i) => (
            <div key={tur} className="ots-belir" style={kademe(1 + i)}>
              <Kart baslik={`${tur} net gelişimi`} altBaslik="Son 12 deneme">
                <CizgiGrafigi
                  seriler={[
                    {
                      ad: `${tur} neti`,
                      noktalar: seriler[tur].map((n) => ({
                        etiket: trTarihKisa(n.tarih),
                        deger: n.net,
                      })),
                    },
                  ]}
                  birim=" net"
                  sifirdanBasla={false}
                  yukseklik={150}
                />
              </Kart>
            </div>
          ))}
        </div>
      )}

      <section className="ots-belir flex flex-col gap-4" style={kademe(1 + grafikler.length)}>
        <h2 className="font-display text-[16px] font-bold tracking-[-0.01em] text-ots-ink">
          Kayıtlar
        </h2>

        {denemeler.length === 0 ? (
          <Bos
            ikon={ClipboardList}
            baslik="Henüz deneme kaydı yok"
            aciklama="Deneme ekle düğmesiyle ilk denemeni kaydet; netler burada birikir."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {gorunen.map((deneme, i) => {
              const fark = oncekiFark(i);
              const toplam = deneme.bolumler.reduce(
                (t, b) => ({ dogru: t.dogru + b.dogru, yanlis: t.yanlis + b.yanlis, bos: t.bos + b.bos }),
                { dogru: 0, yanlis: 0, bos: 0 },
              );

              return (
                <li
                  key={deneme.id}
                  className="ots-liste-oge rounded-2xl border border-ots-line bg-ots-surface p-4 shadow-ots sm:p-5"
                >
                  {/* Üst satır: ad + tarih, tür rozeti */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-display text-[16px] font-bold tracking-[-0.01em] text-ots-ink">
                        {deneme.denemeAdi}
                      </p>
                      <p className="ots-sayi mt-0.5 text-[12px] text-ots-faint">
                        {trTarih(deneme.tarih)}
                        {deneme.sure > 0 && ` · ${deneme.sure} dk`}
                      </p>
                    </div>
                    <Rozet>{deneme.tur}</Rozet>
                  </div>

                  {/* Alt satır: net + D/Y/B toplamları */}
                  <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                    <div className="flex items-baseline gap-2">
                      <span className="ots-sayi font-display text-[22px] font-bold leading-none text-ots-ink">
                        {deneme.toplamNet}
                      </span>
                      <span className="text-[13px] text-ots-soft">net</span>
                      {fark !== null && <Fark deger={fark} />}
                    </div>

                    {deneme.bolumler.length > 0 && (
                      <dl className="ots-sayi grid grid-cols-3 gap-3 text-center text-[13px]">
                        <div>
                          <dt className="text-ots-faint">Doğru</dt>
                          <dd className="font-semibold text-ots-ink">{toplam.dogru}</dd>
                        </div>
                        <div>
                          <dt className="text-ots-faint">Yanlış</dt>
                          <dd className="font-semibold text-ots-ink">{toplam.yanlis}</dd>
                        </div>
                        <div>
                          <dt className="text-ots-faint">Boş</dt>
                          <dd className="font-semibold text-ots-ink">{toplam.bos}</dd>
                        </div>
                      </dl>
                    )}
                  </div>

                  {/* Bölüm ayrıntısı — kapalı başlar, yatay kaydırma yok */}
                  {deneme.bolumler.length > 0 && (
                    <details className="group mt-3 border-t border-ots-line pt-1">
                      <summary className="flex min-h-11 lg:min-h-9 cursor-pointer select-none list-none items-center justify-between gap-2 text-[14px] font-semibold text-ots-gold-ink [&::-webkit-details-marker]:hidden">
                        Bölüm sonuçları
                        <span aria-hidden className="text-[12px] font-medium text-ots-faint group-open:hidden">
                          göster
                        </span>
                        <span aria-hidden className="hidden text-[12px] font-medium text-ots-faint group-open:inline">
                          gizle
                        </span>
                      </summary>
                      <div className="grid grid-cols-[1fr_repeat(4,minmax(0,2.75rem))] gap-x-2 text-[12px] font-medium text-ots-faint sm:grid-cols-[1fr_repeat(4,minmax(0,3.5rem))]">
                        <span>Bölüm</span>
                        <span className="text-right">D</span>
                        <span className="text-right">Y</span>
                        <span className="text-right">B</span>
                        <span className="text-right">Net</span>
                      </div>
                      <ul className="ots-sayi divide-y divide-ots-line">
                        {deneme.bolumler.map((b) => (
                          <li
                            key={b.id}
                            className="grid min-h-10 grid-cols-[1fr_repeat(4,minmax(0,2.75rem))] items-center gap-x-2 py-1.5 text-[13px] sm:grid-cols-[1fr_repeat(4,minmax(0,3.5rem))]"
                          >
                            <span className="min-w-0 truncate text-ots-ink">{b.bolum}</span>
                            <span className="text-right text-ots-soft">{b.dogru}</span>
                            <span className="text-right text-ots-soft">{b.yanlis}</span>
                            <span className="text-right text-ots-soft">{b.bos}</span>
                            <span className="text-right font-semibold text-ots-ink">{b.net}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  {deneme.degerlendirme && (
                    <p className="mt-3 rounded-lg bg-ots-raised px-3 py-2 text-[13px] leading-snug text-ots-soft">
                      <strong className="font-semibold text-ots-ink">Değerlendirme:</strong>{' '}
                      {deneme.degerlendirme}
                    </p>
                  )}
                  {deneme.yapilmasiGerekenler && (
                    <p className="mt-2 rounded-lg bg-ots-gold-tint px-3 py-2 text-[13px] leading-snug text-ots-soft">
                      <strong className="font-semibold text-ots-ink">Koçun planı:</strong>{' '}
                      {deneme.yapilmasiGerekenler}
                    </p>
                  )}

                  {kullanici.koc && (
                    <div className="mt-3 flex justify-end">
                      <DenemeSil denemeId={deneme.id} denemeAdi={deneme.denemeAdi} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {dahaFazlaVar && (
          <Link href={dahaFazlaAdresi} scroll={false} className={`${DUGME_SESSIZ} w-full`}>
            Daha fazla göster ({denemeler.length - SAYFA_BOYU})
          </Link>
        )}
      </section>
    </div>
  );
}
