import { ChevronLeft, ChevronRight, Target, TrendingDown, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';

import { CubukListesi } from '@/components/ots/Grafik';
import { OgrenciTablosu, type TabloGirdisi } from '@/components/ots/koc/Panel';
import {
  Bos,
  DUGME_HAYALET,
  DUGME_IKON,
  Fark,
  Kart,
  ODAK_HALKASI,
  SayfaBasi,
  Sayac,
} from '@/components/ots/Parcalar';
import { esikleriGetir } from '@/lib/ots/ayarlar';
import { kocGerekli } from '@/lib/ots/dal';
import { uyumDurumu } from '@/lib/ots/hesap';
import { kocHaftalikRapor, type HaftalikSatir } from '@/lib/ots/sorgular/koc';
import { sureBicimle } from '@/lib/ots/tarih';

export const metadata = { title: 'Haftalık Rapor — OnurrHocam ÖTS' };

/* Kart başına 40 ms kademe — en fazla 6 (spec §6). */
function kademe(i: number): React.CSSProperties {
  return { '--i': Math.min(i, 6) } as React.CSSProperties;
}

/**
 * Koçun haftalık raporu.
 *
 * Hafta gezgini sayfanın tek yapışkan üst öğesidir (`sticky top-0`; üst çubuk
 * bu sayfada statik — spec §5.3). Sıra: sayfa başı → gezgin → 4 sayaç (2×2 →
 * md 4) → yükselen/düşen → çözülen soru → tüm öğrenciler (md+ tablo, md altı
 * kart; dashboard'la aynı `OgrenciTablosu`). Birincil düğme ve FAB yok.
 */
export default async function HaftalikSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ hafta?: string }>;
}) {
  await kocGerekli();
  const { hafta } = await searchParams;
  const [veri, esikler] = await Promise.all([kocHaftalikRapor(hafta), esikleriGetir()]);

  const yukselenler = veri.satirlar
    .filter((s) => s.fark > 0)
    .sort((a, b) => b.fark - a.fark)
    .slice(0, 5);
  const dusenler = veri.satirlar
    .filter((s) => s.fark < 0)
    .sort((a, b) => a.fark - b.fark)
    .slice(0, 5);

  const ortalamaUyum = veri.satirlar.length
    ? Math.round(
        (veri.satirlar.reduce((a, s) => a + s.uyum, 0) / veri.satirlar.length) * 10,
      ) / 10
    : 0;

  // Haftalık satırlar dashboard tablosunun girdi şekline getirilir; durum bandı
  // koçun ayarladığı eşiklerle hesaplanır.
  const tabloSatirlari: TabloGirdisi[] = veri.satirlar.map((s) => ({
    ogrenciId: s.ogrenciId,
    adSoyad: s.adSoyad,
    uyum: s.uyum,
    durum: uyumDurumu(s.uyum, esikler),
    soru: s.soru,
    sure: s.sure,
    konuYuzde: s.konuYuzde,
  }));

  const sorulu = veri.satirlar.filter((s) => s.soru > 0);

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <div className="ots-belir" style={kademe(0)}>
        <SayfaBasi
          baslik="Haftalık rapor"
          aciklama="Tüm öğrencilerin uyum, soru ve çalışma özeti — geçen haftayla karşılaştırmalı"
        />
      </div>

      {/* Hafta gezgini — sayfanın tek yapışkan üst öğesi (spec §5.3, §5.4/6) */}
      <nav
        aria-label="Hafta seçimi"
        className="yazdirma-disi sticky top-0 z-10 -mx-4 bg-ots-bg/95 px-4 py-2 sm:-mx-6 sm:px-6"
      >
        <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
          <Link
            href={`/takip/haftalik?hafta=${veri.hafta.onceki}`}
            className={DUGME_IKON}
            aria-label="Önceki hafta"
          >
            <ChevronLeft size={18} strokeWidth={2} aria-hidden />
          </Link>
          <p className="ots-sayi text-center text-[14px] font-semibold text-ots-ink">
            {veri.hafta.araligTr}
          </p>
          <Link
            href={`/takip/haftalik?hafta=${veri.hafta.sonraki}`}
            className={DUGME_IKON}
            aria-label="Sonraki hafta"
          >
            <ChevronRight size={18} strokeWidth={2} aria-hidden />
          </Link>
        </div>
        {!veri.hafta.buHaftaMi && (
          <div className="mt-1 flex justify-center">
            <Link href="/takip/haftalik" className={DUGME_HAYALET}>
              Bu hafta
            </Link>
          </div>
        )}
      </nav>

      {veri.satirlar.length === 0 ? (
        <div className="ots-belir" style={kademe(1)}>
          <Bos ikon={Users} baslik="Aktif öğrenci yok" />
        </div>
      ) : (
        <>
          <div className="ots-belir grid grid-cols-2 gap-3 md:grid-cols-4" style={kademe(1)}>
            <Sayac etiket="Ortalama uyum" deger={`%${ortalamaUyum}`} />
            <Sayac etiket="Toplam soru" deger={veri.toplam.soru} />
            <Sayac etiket="Toplam çalışma" deger={sureBicimle(veri.toplam.sure)} />
            <Sayac etiket="Öğrenci" deger={veri.toplam.ogrenci} />
          </div>

          <div className="ots-belir grid gap-4 sm:gap-5 lg:grid-cols-2" style={kademe(2)}>
            <Kart baslik="Yükselenler" altBaslik="Geçen haftaya göre uyum artışı" ikon={TrendingUp}>
              {yukselenler.length === 0 ? (
                <p className="text-[14px] text-ots-faint">Bu hafta artış yok.</p>
              ) : (
                <DegisimListesi satirlar={yukselenler} />
              )}
            </Kart>

            <Kart baslik="Düşenler" altBaslik="Geçen haftaya göre uyum kaybı" ikon={TrendingDown}>
              {dusenler.length === 0 ? (
                <p className="text-[14px] text-ots-faint">Bu hafta düşüş yok.</p>
              ) : (
                <DegisimListesi satirlar={dusenler} />
              )}
            </Kart>
          </div>

          <div className="ots-belir" style={kademe(3)}>
            <Kart baslik="Çözülen soru" altBaslik="Bu hafta, öğrenciye göre" ikon={Target}>
              {sorulu.length === 0 ? (
                <p className="text-[14px] text-ots-faint">Bu hafta çalışma kaydı yok.</p>
              ) : (
                <CubukListesi
                  satirlar={sorulu.map((s) => ({
                    etiket: s.adSoyad,
                    deger: s.soru,
                    gosterim: `${s.soru} soru`,
                  }))}
                />
              )}
            </Kart>
          </div>

          <section className="ots-belir" style={kademe(4)} aria-labelledby="tum-ogrenciler-baslik">
            <div className="mb-4 flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-ots-gold-tint text-ots-gold-ink">
                <Users size={18} strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0">
                <h2
                  id="tum-ogrenciler-baslik"
                  className="font-display text-[16px] font-bold tracking-[-0.01em] text-ots-ink"
                >
                  Tüm öğrenciler
                </h2>
                <p className="mt-0.5 text-[13px] leading-snug text-ots-faint">Uyuma göre sıralı</p>
              </div>
            </div>
            <OgrenciTablosu satirlar={tabloSatirlari} />
          </section>
        </>
      )}
    </div>
  );
}

/** Yükselen/düşen satırları — satırın tamamı öğrenci detayına bağlantı, `min-h-14`. */
function DegisimListesi({ satirlar }: { satirlar: HaftalikSatir[] }) {
  return (
    <ul className="flex flex-col divide-y divide-ots-line">
      {satirlar.map((s) => (
        <li key={s.ogrenciId}>
          <Link
            href={`/takip/ogrenciler/${s.ogrenciId}`}
            className={`flex min-h-14 lg:min-h-12 items-center justify-between gap-3 rounded-lg py-2 transition-colors duration-150 hover:bg-ots-raised active:bg-ots-raised ${ODAK_HALKASI}`}
          >
            <span className="min-w-0 truncate text-[14px] font-semibold text-ots-ink">{s.adSoyad}</span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="ots-sayi text-[12px] text-ots-faint">
                %{s.oncekiUyum} → %{s.uyum}
              </span>
              <Fark deger={s.fark} birim="%" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
