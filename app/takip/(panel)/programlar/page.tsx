import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { HaftaIzgarasi } from '@/components/ots/koc/HaftaIzgarasi';
import { OgrenciSecici } from '@/components/ots/koc/OgrenciSecici';
import {
  Bos,
  DUGME_HAYALET,
  DUGME_IKON,
  DurumRozeti,
  Ilerleme,
  SayfaBasi,
} from '@/components/ots/Parcalar';
import { kocGerekli, ogrenciKaydi } from '@/lib/ots/dal';
import { derslerGetir } from '@/lib/ots/konu-katalogu';
import { haftaVerisi } from '@/lib/ots/sorgular/ekran';
import { degerlendirmeGetir } from '@/lib/ots/sorgular/temel';
import { ekranOgrencisi } from '@/lib/ots/sorgular/secim';
import { bugun as bugunuAl, haftaBasi, sureBicimle } from '@/lib/ots/tarih';

export const metadata = { title: 'Programlar — OnurrHocam ÖTS' };

/**
 * Koçun program sayfası — spec §8 "Programlar ızgarası".
 *
 * Öğrenci seçici ve hafta gezgini, HaftaIzgarasi'nın yapışkan gün şeridiyle
 * aynı blokta yaşar (sayfada tek yapışkan üst öğe; üst çubuk bu sayfada
 * statik). Uyum özeti sade bir satır; sayaç kartı yok.
 */
export default async function ProgramlarSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ ogrenci?: string; hafta?: string }>;
}) {
  await kocGerekli();
  const { ogrenci: istenenId, hafta } = await searchParams;
  const { ogrenci, liste } = await ekranOgrencisi(istenenId);

  return (
    <div className="flex flex-col gap-5">
      <div className="yazdirma-disi">
        <SayfaBasi baslik="Program Oluştur" aciklama="Öğrenciye haftalık görev ata" />
      </div>

      {!ogrenci ? (
        <>
          <div className="yazdirma-disi">
            <OgrenciSecici ogrenciler={liste} />
          </div>
          <Bos
            baslik="Öğrenci seç"
            aciklama="Program oluşturmak için yukarıdan bir öğrenci seç."
          />
        </>
      ) : (
        <ProgramIcerigi ogrenciId={ogrenci.id} hafta={hafta} liste={liste} />
      )}
    </div>
  );
}

async function ProgramIcerigi({
  ogrenciId,
  hafta,
  liste,
}: {
  ogrenciId: string;
  hafta?: string;
  liste: { id: string; adSoyad: string; sinif: string }[];
}) {
  const ogrenci = await ogrenciKaydi(ogrenciId);
  if (!ogrenci) return <Bos baslik="Öğrenci bulunamadı" />;

  const program = await haftaVerisi(ogrenci, hafta);
  const degerlendirme = await degerlendirmeGetir(ogrenci.id, program.baslangic);
  const dersler = derslerGetir(ogrenci.sinavTuru === 'LGS' ? 'LGS' : 'YKS');
  const buHafta = haftaBasi(bugunuAl());

  const bag = (h: string) => `/takip/programlar?ogrenci=${ogrenci.id}&hafta=${h}`;

  return (
    <HaftaIzgarasi
      ogrenciId={ogrenci.id}
      ogrenciAdi={ogrenci.adSoyad}
      araligTr={program.araligTr}
      haftaBaslangic={program.baslangic}
      gunler={program.gunler}
      dersler={dersler}
      notMetni={degerlendirme?.programNotu ?? ''}
      bugun={bugunuAl()}
      seritUstu={
        <>
          <OgrenciSecici ogrenciler={liste} secili={ogrenci.id} />

          {/* Hafta gezgini — spec §5.4/6: [44px_1fr_44px], ikon oklar, ortada aralık */}
          <nav aria-label="Hafta" className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
            <Link href={bag(program.oncekiHafta)} className={DUGME_IKON} aria-label="Önceki hafta">
              <ChevronLeft size={18} strokeWidth={2} aria-hidden />
            </Link>
            <div className="flex min-w-0 flex-col items-center">
              <span className="ots-sayi truncate text-center text-[14px] font-semibold text-ots-ink">
                {program.araligTr}
              </span>
              {!program.buHaftaMi && (
                <Link href={bag(buHafta)} className={DUGME_HAYALET}>
                  Bu hafta
                </Link>
              )}
            </div>
            <Link href={bag(program.sonrakiHafta)} className={DUGME_IKON} aria-label="Sonraki hafta">
              <ChevronRight size={18} strokeWidth={2} aria-hidden />
            </Link>
          </nav>
        </>
      }
      ustIcerik={
        /* Uyum özeti — sade satır + ilerleme; sayaç kartı yok */
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="ots-sayi font-display text-[22px] font-bold leading-none text-ots-ink">
              %{program.ozet.uyum}
            </span>
            <DurumRozeti durum={program.ozet.durum} />
            <span className="ots-sayi text-[13px] leading-snug text-ots-soft">
              {program.ozet.tamamlanan}/{program.ozet.vadesiGelenGorev} görev ·{' '}
              {program.ozet.cozulenSoru} soru · {sureBicimle(program.ozet.calismaSuresi)}
            </span>
          </div>
          <Ilerleme
            yuzde={program.ozet.uyum}
            renk={program.ozet.durum.renk}
            etiket="Haftalık uyum"
          />
        </div>
      }
    />
  );
}
