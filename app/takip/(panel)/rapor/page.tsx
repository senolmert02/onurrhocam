import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { Belir } from '@/components/ots/Belir';
import { CizgiGrafigi, CubukListesi } from '@/components/ots/Grafik';
import { GrafikSekmeleri, type GrafikSekmesi } from '@/components/ots/GrafikSekmeleri';
import { DegerlendirmeFormu } from '@/components/ots/koc/DegerlendirmeFormu';
import { OgrenciSecici } from '@/components/ots/koc/OgrenciSecici';
import {
  Bos,
  DUGME_HAYALET,
  DUGME_IKON,
  DurumRozeti,
  Fark,
  Ilerleme,
  Kart,
  SayfaBasi,
  Sayac,
} from '@/components/ots/Parcalar';
import { raporVerisi } from '@/lib/ots/sorgular/ekran';
import { ekranOgrencisi } from '@/lib/ots/sorgular/secim';
import { sureBicimle, trTarih } from '@/lib/ots/tarih';

export const metadata = { title: 'Rapor — OnurrHocam ÖTS' };

/**
 * Haftalık rapor — spec §8 "Rapor".
 *
 * Mobil sıra birebir: hafta gezgini (yapışkan şerit; üst çubuk bu sayfada statik)
 * → öğrenci seçici (koç, aynı blokta) → 4 sayaç 2×2 → Koç değerlendirmesi →
 * Geçen haftaya göre → 3 çizgi grafiği (lg altı sekmeli tek kart, lg+ yan yana)
 * → Soru dağılımı → Son 30 gün → Derslere göre / Ders uyumu → Yanlış analizi →
 * Denemeler → Tamamlanmamış görevler.
 *
 * İlk ekran `.ots-belir` kademesiyle, ilk ekranın altı `Belir` ile belirir.
 * Sayfanın tek birincil düğmesi koçun "Kaydet"idir.
 */
export default async function RaporSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ ogrenci?: string; hafta?: string }>;
}) {
  const { ogrenci: istenenId, hafta } = await searchParams;
  const { kullanici, ogrenci, liste } = await ekranOgrencisi(istenenId);

  if (!ogrenci) {
    return (
      <div className="flex flex-col gap-4 sm:gap-5">
        <SayfaBasi baslik={kullanici.koc ? 'Öğrenci raporu' : 'Raporum'} />
        {kullanici.koc ? (
          <>
            <OgrenciSecici ogrenciler={liste} />
            <Bos baslik="Öğrenci seç" aciklama="Rapor için yukarıdan bir öğrenci seç." />
          </>
        ) : (
          <Bos baslik="Öğrenci kaydın bulunamadı" aciklama="Koçunla görüşmen gerekiyor." />
        )}
      </div>
    );
  }

  const veri = await raporVerisi(ogrenci, hafta);
  const { ozet, karsilastirma, aylik, yanlisAnalizi } = veri;

  const bag = (h?: string) => {
    const p = new URLSearchParams();
    if (kullanici.koc) p.set('ogrenci', ogrenci.id);
    if (h) p.set('hafta', h);
    const s = p.toString();
    return s ? `/takip/rapor?${s}` : '/takip/rapor';
  };

  /* Üç grafik — farklı ölçekteki ölçüler aynı eksene konmaz; lg altında tek
     kartta sekmeli, lg+'da yan yana. Aynı veri iki dala da verilir. */
  const grafikler: GrafikSekmesi[] = [
    {
      anahtar: 'uyum',
      etiket: 'Uyum',
      baslik: 'Program uyumu',
      altBaslik: 'Son 8 hafta',
      birim: '%',
      seriler: [
        { ad: 'Uyum', noktalar: veri.trend.map((t) => ({ etiket: t.etiket, deger: t.uyum })) },
      ],
    },
    {
      anahtar: 'soru',
      etiket: 'Soru',
      baslik: 'Çözülen soru',
      altBaslik: 'Son 8 hafta',
      birim: ' soru',
      seriler: [
        { ad: 'Soru', noktalar: veri.trend.map((t) => ({ etiket: t.etiket, deger: t.soru })) },
      ],
    },
    {
      anahtar: 'sure',
      etiket: 'Süre',
      baslik: 'Çalışma süresi',
      altBaslik: 'Son 8 hafta · dakika',
      birim: ' dk',
      seriler: [
        { ad: 'Süre', noktalar: veri.trend.map((t) => ({ etiket: t.etiket, deger: t.sure })) },
      ],
    },
  ];

  const kocDegerlendirmesi = (
    <Kart
      baslik="Koç değerlendirmesi"
      altBaslik={kullanici.koc ? 'Öğrenci bunu raporunda görür' : 'Koçunun bu hafta için notu'}
    >
      {kullanici.koc ? (
        <DegerlendirmeFormu
          ogrenciId={ogrenci.id}
          hafta={veri.hafta.baslangic}
          degerlendirme={veri.degerlendirme?.kocDegerlendirmesi ?? ''}
          hedefler={veri.degerlendirme?.gelecekHedefler ?? ''}
        />
      ) : veri.degerlendirme?.kocDegerlendirmesi || veri.degerlendirme?.gelecekHedefler ? (
        <div className="flex flex-col gap-3">
          {veri.degerlendirme.kocDegerlendirmesi && (
            <div>
              <p className="mb-1 text-[12px] font-semibold text-ots-faint">Değerlendirme</p>
              <p className="whitespace-pre-wrap text-[15px] leading-[1.5] text-ots-ink">
                {veri.degerlendirme.kocDegerlendirmesi}
              </p>
            </div>
          )}
          {veri.degerlendirme.gelecekHedefler && (
            <div className="rounded-xl bg-ots-gold-tint p-3.5">
              <p className="mb-1 text-[12px] font-semibold text-ots-gold-ink">
                Gelecek haftanın hedefleri
              </p>
              <p className="whitespace-pre-wrap text-[15px] leading-[1.5] text-ots-ink">
                {veri.degerlendirme.gelecekHedefler}
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-[14px] text-ots-faint">
          Koçun bu hafta için henüz değerlendirme yazmamış.
        </p>
      )}
    </Kart>
  );

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="ots-belir" style={{ '--i': 0 } as React.CSSProperties}>
        <SayfaBasi
          baslik={kullanici.koc ? `Rapor · ${ogrenci.adSoyad}` : 'Haftalık raporum'}
          sag={<DurumRozeti durum={ozet.durum} />}
        />
      </div>

      {/* Yapışkan şerit — sayfanın tek yapışkan üst öğesi (spec §5.3); üst çubuk
          bu sayfada statik. Hafta gezgini + koçta öğrenci seçici aynı blokta. */}
      <div className="yazdirma-disi sticky top-0 z-10 -mx-4 bg-ots-bg/95 px-4 py-2 sm:-mx-6 sm:px-6">
        <nav aria-label="Hafta seçimi" className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
          <Link href={bag(veri.hafta.oncekiHafta)} className={DUGME_IKON} aria-label="Önceki hafta">
            <ChevronLeft size={18} strokeWidth={2} aria-hidden />
          </Link>
          <div className="flex min-w-0 flex-col items-center">
            <p className="ots-sayi truncate text-center text-[14px] font-semibold text-ots-ink">
              {veri.hafta.araligTr}
            </p>
            {!veri.hafta.buHaftaMi && (
              <Link href={bag()} className={DUGME_HAYALET}>
                Bu hafta
              </Link>
            )}
          </div>
          <Link href={bag(veri.hafta.sonrakiHafta)} className={DUGME_IKON} aria-label="Sonraki hafta">
            <ChevronRight size={18} strokeWidth={2} aria-hidden />
          </Link>
        </nav>
        {kullanici.koc && (
          <div className="mt-2">
            <OgrenciSecici ogrenciler={liste} secili={ogrenci.id} />
          </div>
        )}
      </div>

      {/* Haftalık sayılar — 2×2, md'den itibaren 4 sütun */}
      <div
        className="ots-belir grid grid-cols-2 gap-3 md:grid-cols-4"
        style={{ '--i': 1 } as React.CSSProperties}
      >
        <Sayac
          etiket="Program uyumu"
          deger={`%${ozet.uyum}`}
          alt={`${ozet.tamamlanan}/${ozet.vadesiGelenGorev} görev`}
        />
        <Sayac etiket="Çözülen soru" deger={ozet.cozulenSoru} />
        <Sayac etiket="Çalışma süresi" deger={sureBicimle(ozet.calismaSuresi)} />
        <Sayac
          etiket="Konu ilerlemesi"
          deger={`%${veri.konu.genel.yuzde}`}
          alt={`Bu hafta +${veri.konu.haftaTamamlanan}`}
        />
      </div>

      {/* Koç değerlendirmesi — 2. sıra */}
      <div className="ots-belir" style={{ '--i': 2 } as React.CSSProperties}>
        {kocDegerlendirmesi}
      </div>

      {/* İlk ekranın altı: görünür olunca beliren kartlar */}
      <Belir>
        <Kart baslik="Geçen haftaya göre">
          <dl className="flex flex-col divide-y divide-ots-line">
            <Karsilastirma
              etiket="Uyum"
              simdi={`%${ozet.uyum}`}
              onceki={`%${karsilastirma.oncekiUyum}`}
              fark={karsilastirma.uyumFarki}
              birim="%"
            />
            <Karsilastirma
              etiket="Soru"
              simdi={String(ozet.cozulenSoru)}
              onceki={String(karsilastirma.oncekiSoru)}
              fark={karsilastirma.soruFarki}
            />
            <Karsilastirma
              etiket="Süre"
              simdi={sureBicimle(ozet.calismaSuresi)}
              onceki={sureBicimle(karsilastirma.oncekiSure)}
              fark={karsilastirma.sureFarki}
              birim=" dk"
            />
          </dl>
        </Kart>
      </Belir>

      {/* Grafikler: lg altı sekmeli tek kart, lg+ üç yan yana */}
      <Belir className="lg:hidden">
        <Kart baslik="Son 8 hafta" altBaslik="Uyum, soru ve süre eğilimi">
          <GrafikSekmeleri sekmeler={grafikler} yukseklik={150} />
        </Kart>
      </Belir>
      <Belir className="hidden lg:block">
        <div className="grid gap-4 lg:grid-cols-3 sm:gap-5">
          {grafikler.map((g) => (
            <Kart key={g.anahtar} baslik={g.baslik} altBaslik={g.altBaslik}>
              <CizgiGrafigi seriler={g.seriler} birim={g.birim} yukseklik={150} />
            </Kart>
          ))}
        </div>
      </Belir>

      {/* Doğru / yanlış / boş toplamı */}
      {ozet.dogru + ozet.yanlis + ozet.bos > 0 && (
        <Belir>
          <Kart baslik="Bu haftaki soru dağılımı">
            <div className="grid grid-cols-2 gap-3 text-center md:grid-cols-4">
              <Dagilim etiket="Doğru" deger={ozet.dogru} />
              <Dagilim etiket="Yanlış" deger={ozet.yanlis} />
              <Dagilim etiket="Boş" deger={ozet.bos} />
              <Dagilim
                etiket="Doğru oranı"
                deger={
                  ozet.dogru + ozet.yanlis > 0
                    ? `%${Math.round((ozet.dogru / (ozet.dogru + ozet.yanlis)) * 100)}`
                    : '—'
                }
              />
            </div>
          </Kart>
        </Belir>
      )}

      {/* Aylık resim — iç sayaçlar da 2×2 (spec §5.4) */}
      <Belir>
        <Kart baslik="Son 30 gün" altBaslik={aylik.araligTr}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Sayac
              etiket="Uyum"
              deger={`%${aylik.uyum}`}
              alt={`${aylik.tamamlanan}/${aylik.vadesiGelen} görev`}
            />
            <Sayac etiket="Soru" deger={aylik.soru} />
            <Sayac etiket="Çalışma" deger={sureBicimle(aylik.sure)} />
            <Sayac
              etiket="Günlük ortalama"
              deger={`${Math.round(aylik.soru / 30)} soru`}
              alt={sureBicimle(Math.round(aylik.sure / 30))}
            />
          </div>
        </Kart>
      </Belir>

      <Belir>
        <div className="grid gap-4 md:grid-cols-2 sm:gap-5">
          <Kart baslik="Derslere göre" altBaslik="Bu haftaki çözülen soru">
            {ozet.dersler.every((d) => d.soru === 0) ? (
              <p className="text-[14px] text-ots-faint">Bu hafta çalışma kaydı yok.</p>
            ) : (
              <CubukListesi
                satirlar={ozet.dersler
                  .filter((d) => d.soru > 0)
                  .map((d) => ({ etiket: d.ders, deger: d.soru }))}
                birim=" soru"
              />
            )}
          </Kart>

          <Kart baslik="Ders uyumu" altBaslik="Tamamlanan / atanan görev">
            {ozet.dersler.length === 0 ? (
              <p className="text-[14px] text-ots-faint">Bu haftaya görev atanmamış.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {ozet.dersler.map((d) => (
                  <li key={d.ders} className="flex min-h-6 items-center gap-3">
                    <span className="w-24 shrink-0 truncate text-[13px] text-ots-soft" title={d.ders}>
                      {d.ders}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Ilerleme yuzde={d.uyum} etiket={`${d.ders} uyumu`} />
                    </div>
                    <span className="ots-sayi min-w-14 shrink-0 whitespace-nowrap text-right text-[13px] font-semibold text-ots-ink">
                      {d.tamamlanan}/{d.gorev} · %{d.uyum}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {veri.gucluDers && (
              <p className="mt-3 text-[12px] text-ots-faint">
                En güçlü: <strong className="font-semibold text-ots-ink">{veri.gucluDers}</strong>
                {veri.gelisecekDers !== veri.gucluDers && (
                  <>
                    {' · '}Gelişmesi gereken:{' '}
                    <strong className="font-semibold text-ots-ink">{veri.gelisecekDers}</strong>
                  </>
                )}
              </p>
            )}
          </Kart>
        </div>
      </Belir>

      {/* Yanlış analizi */}
      <Belir>
        <Kart
          baslik="Yanlış analizi"
          altBaslik={
            yanlisAnalizi.enSik
              ? `Bu hafta en sık neden: ${yanlisAnalizi.enSik.neden}`
              : 'Deneme kaydederken doldurulur'
          }
        >
          {yanlisAnalizi.liste.length === 0 ? (
            <p className="text-[14px] leading-[1.5] text-ots-faint">
              Bu hafta yanlış analizi girilmemiş. Deneme eklerken &quot;Yanlış analizi&quot;
              bölümünü doldurursan burada nedenlerin dağılımını görürsün.
            </p>
          ) : (
            <>
              <CubukListesi
                satirlar={yanlisAnalizi.liste.map((n) => ({ etiket: n.neden, deger: n.adet }))}
                birim=" soru"
              />
              <p className="mt-3 text-[12px] text-ots-faint">
                Toplam {yanlisAnalizi.toplam} yanlış işaretlendi.
              </p>
            </>
          )}
        </Kart>
      </Belir>

      <Belir>
        <Kart baslik="Bu haftaki denemeler">
          {veri.denemeler.length === 0 ? (
            <Bos baslik="Bu hafta deneme girilmemiş" />
          ) : (
            <ul className="flex flex-col divide-y divide-ots-line">
              {veri.denemeler.map((d) => (
                <li
                  key={d.id}
                  className="flex min-h-12 lg:min-h-10 flex-wrap items-center justify-between gap-2 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-ots-ink">{d.denemeAdi}</p>
                    <p className="text-[12px] text-ots-faint">
                      {d.tur} · {trTarih(d.tarih)}
                    </p>
                  </div>
                  <span className="ots-sayi font-display text-[18px] font-bold text-ots-ink">
                    {d.toplamNet} net
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Kart>
      </Belir>

      {ozet.eksikGorevler.length > 0 && (
        <Belir>
          <Kart
            baslik="Tamamlanmamış görevler"
            altBaslik={`${ozet.eksikGorevler.length} görev`}
          >
            <ul className="flex flex-col divide-y divide-ots-line">
              {ozet.eksikGorevler.slice(0, 12).map((g) => (
                <li
                  key={g.id}
                  className="flex min-h-12 lg:min-h-10 flex-wrap items-center justify-between gap-2 py-2.5 text-[14px]"
                >
                  <span className="text-ots-ink">
                    {g.ders}
                    {g.konu ? ` · ${g.konu}` : ''}
                  </span>
                  <span className="text-[12px] text-ots-faint">{g.tarihTr}</span>
                </li>
              ))}
            </ul>
          </Kart>
        </Belir>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- Yardımcılar */

/** Soru dağılımı kutucuğu — `raised` zemin, sayı `ots-sayi`. */
function Dagilim({ etiket, deger }: { etiket: string; deger: string | number }) {
  return (
    <div className="rounded-xl bg-ots-raised px-2 py-3">
      <p className="text-[12px] font-medium text-ots-faint">{etiket}</p>
      <p className="ots-sayi mt-1 font-display text-[20px] font-bold leading-none text-ots-ink">
        {deger}
      </p>
    </div>
  );
}

/** "Geçen haftaya göre" satırı — etiket sol, değer + Fark sağ, `min-h-14` (spec §8). */
function Karsilastirma({
  etiket,
  simdi,
  onceki,
  fark,
  birim = '',
}: {
  etiket: string;
  simdi: string;
  onceki: string;
  fark: number;
  birim?: string;
}) {
  return (
    <div className="flex min-h-14 lg:min-h-12 items-center justify-between gap-3 py-2">
      <dt className="min-w-0">
        <span className="block text-[14px] font-medium text-ots-ink">{etiket}</span>
        <span className="block text-[12px] text-ots-faint">geçen hafta {onceki}</span>
      </dt>
      <dd className="flex shrink-0 items-center gap-2">
        <span className="ots-sayi font-display text-[18px] font-bold leading-none text-ots-ink">
          {simdi}
        </span>
        <Fark deger={fark} birim={birim} />
      </dd>
    </div>
  );
}
