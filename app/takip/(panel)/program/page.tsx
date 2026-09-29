import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { HaftaIzgarasi } from '@/components/ots/koc/HaftaIzgarasi';
import {
  Bos,
  DUGME_HAYALET,
  DUGME_IKON,
  DurumRozeti,
  Ilerleme,
  Kart,
  SayfaBasi,
} from '@/components/ots/Parcalar';
import { SerbestCalismaFormu } from '@/components/ots/SerbestCalismaFormu';
import { ogrenciGerekli } from '@/lib/ots/dal';
import { derslerGetir } from '@/lib/ots/konu-katalogu';
import { haftaVerisi } from '@/lib/ots/sorgular/ekran';
import { degerlendirmeGetir } from '@/lib/ots/sorgular/temel';
import { bugun as bugunuAl, sureBicimle } from '@/lib/ots/tarih';

export const metadata = { title: 'Haftalık Program — OnurrHocam ÖTS' };

/**
 * Öğrencinin haftalık programı — spec §5.4 / §5.5 / §8.
 *
 * Sayfa başı (durum rozeti + "Serbest çalışma": lg+ düğme, lg altı FAB) →
 * hafta gezgini, HaftaIzgarasi'nın yapışkan gün şeridiyle AYNI blokta
 * (`seritUstu`; sayfada tek yapışkan üst öğe, spec §5.3) → uyum özeti
 * (`ustIcerik`) → koçun hazırladığı basılı şablonun aynısı (PDF olarak
 * indirilebiliyor). Görev tamamlama ızgaranın gün modalında yapılır; ızgara
 * salt okunur — öğrenci programı değiştiremez, yalnızca tamamlar.
 */
export default async function ProgramSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ hafta?: string }>;
}) {
  const { ogrenci } = await ogrenciGerekli();
  const { hafta } = await searchParams;

  const veri = await haftaVerisi(ogrenci, hafta);
  const degerlendirme = await degerlendirmeGetir(ogrenci.id, veri.baslangic);
  const dersler = derslerGetir(ogrenci.sinavTuru === 'LGS' ? 'LGS' : 'YKS');
  const haftaBos = veri.gunler.every((g) => g.toplam === 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="yazdirma-disi">
        <SayfaBasi
          baslik="Haftalık program"
          aciklama={veri.araligTr}
          sag={
            <div className="flex items-center gap-2">
              <DurumRozeti durum={veri.ozet.durum} />
              {/* Programda olmayan çalışmayı buradan da kaydedebilsin (spec §5.5 FAB) */}
              <SerbestCalismaFormu dersler={dersler} bugun={bugunuAl()} />
            </div>
          }
        />
      </div>

      {/* Basılı şablonun aynısı — PDF olarak indirilebiliyor; gün modalı burada */}
      <HaftaIzgarasi
        ogrenciId={ogrenci.id}
        ogrenciAdi={ogrenci.adSoyad}
        araligTr={veri.araligTr}
        haftaBaslangic={veri.baslangic}
        gunler={veri.gunler}
        dersler={dersler}
        notMetni={degerlendirme?.programNotu ?? ''}
        bugun={bugunuAl()}
        saltOkunur
        seritUstu={
          /* Hafta gezgini — gün şeridiyle aynı yapışkan blokta (spec §5.3, §8) */
          <nav aria-label="Hafta seçimi" className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
            <Link
              href={`/takip/program?hafta=${veri.oncekiHafta}`}
              aria-label="Önceki hafta"
              className={DUGME_IKON}
            >
              <ChevronLeft size={18} strokeWidth={2} aria-hidden />
            </Link>

            <div className="flex min-w-0 flex-col items-center">
              <p className="ots-sayi truncate text-center text-[14px] font-semibold text-ots-ink">
                {veri.araligTr}
              </p>
              {!veri.buHaftaMi && (
                <Link href="/takip/program" className={`${DUGME_HAYALET} -mt-1`}>
                  Bu hafta
                </Link>
              )}
            </div>

            <Link
              href={`/takip/program?hafta=${veri.sonrakiHafta}`}
              aria-label="Sonraki hafta"
              className={DUGME_IKON}
            >
              <ChevronRight size={18} strokeWidth={2} aria-hidden />
            </Link>
          </nav>
        }
        ustIcerik={
          /* Uyum özeti — gezginin altında, ızgaranın üstünde */
          <Kart>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <span className="ots-sayi font-display text-[26px] font-bold leading-none text-ots-ink sm:text-[28px]">
                %{veri.ozet.uyum}
              </span>
              <span className="ots-sayi text-[13px] text-ots-soft">
                {veri.ozet.tamamlanan}/{veri.ozet.vadesiGelenGorev} görev · {veri.ozet.cozulenSoru} soru ·{' '}
                {sureBicimle(veri.ozet.calismaSuresi)}
              </span>
            </div>
            <Ilerleme yuzde={veri.ozet.uyum} renk={veri.ozet.durum.renk} etiket="Haftalık uyum" />
            {veri.ozet.gelecekGorev > 0 && (
              <p className="mt-2 text-[12px] text-ots-faint">
                {veri.ozet.gelecekGorev} görev ileri tarihli — uyum hesabına katılmıyor.
              </p>
            )}
            {!haftaBos && (
              <p className="mt-2 text-[12px] text-ots-faint">Bir güne dokunup görevlerini tamamla</p>
            )}
          </Kart>
        }
      />

      {haftaBos && (
        <div className="yazdirma-disi">
          <Bos
            ikon={CalendarDays}
            baslik="Bu haftaya program atanmamış"
            aciklama="Koçun program oluşturduğunda burada görünecek."
          />
        </div>
      )}
    </div>
  );
}
