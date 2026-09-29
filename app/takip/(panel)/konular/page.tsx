import { BookOpen, UserRound } from 'lucide-react';

import { KonuKartlari, type DersKarti } from '@/components/ots/KonuKartlari';
import { OgrenciSecici } from '@/components/ots/koc/OgrenciSecici';
import { Bos, Ilerleme, Kart, SayfaBasi, Sayac } from '@/components/ots/Parcalar';
import { konuIstatistikleri } from '@/lib/ots/hesap';
import { konulariGetir } from '@/lib/ots/konu-katalogu';
import { ekranOgrencisi } from '@/lib/ots/sorgular/secim';
import { konuKayitlari } from '@/lib/ots/sorgular/temel';

export const metadata = { title: 'Konu Takibi — OnurrHocam ÖTS' };

/** `.ots-belir` kademesi — kart başına 40 ms, en fazla 6 (spec §6). */
const kademe = (i: number) => ({ '--i': Math.min(i, 6) }) as React.CSSProperties;

/**
 * Konu takibi — iki rolde de aynı ekran.
 * Koç durumları değiştirebilir, öğrenci yalnızca görür.
 */
export default async function KonularSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ ogrenci?: string }>;
}) {
  const { ogrenci: istenenId } = await searchParams;
  const { kullanici, ogrenci, liste } = await ekranOgrencisi(istenenId);

  if (!ogrenci) {
    return (
      <div className="flex flex-col gap-6 sm:gap-8">
        <SayfaBasi baslik="Konu takibi" />
        {kullanici.koc ? (
          <>
            <OgrenciSecici ogrenciler={liste} />
            <Bos
              ikon={UserRound}
              baslik="Öğrenci seç"
              aciklama="Konu durumlarını görmek için bir öğrenci seç."
            />
          </>
        ) : (
          <Bos
            ikon={BookOpen}
            baslik="Öğrenci kaydın bulunamadı"
            aciklama="Koçunla görüşmen gerekiyor."
          />
        )}
      </div>
    );
  }

  const sinavTuru = ogrenci.sinavTuru === 'LGS' ? 'LGS' : 'YKS';
  const kayitlar = await konuKayitlari(ogrenci.id);
  const durumlar = new Map(kayitlar.map((k) => [k.konuId, k]));

  const istatistik = konuIstatistikleri(
    kayitlar.map((k) => ({
      konuId: k.konuId,
      durum: k.durum,
      tamamlanmaTarihi: k.tamamlanmaTarihi,
    })),
    sinavTuru,
  );

  // Katalog sırasını koruyarak ders kartlarını kur.
  const kartlar = new Map<string, DersKarti>();
  for (const konu of konulariGetir(sinavTuru)) {
    let kart = kartlar.get(konu.ders);
    if (!kart) {
      const ist = istatistik.dersler.find((d) => d.ders === konu.ders);
      kart = {
        ders: konu.ders,
        toplam: ist?.toplam ?? 0,
        tamamlanan: ist?.tamamlanan ?? 0,
        yuzde: ist?.yuzde ?? 0,
        konular: [],
      };
      kartlar.set(konu.ders, kart);
    }

    const kayit = durumlar.get(konu.id);
    kart.konular.push({
      id: konu.id,
      konu: konu.konu,
      kayit: kayit
        ? {
            durum: kayit.durum,
            soruSayisi: kayit.soruSayisi,
            basariYuzdesi: kayit.basariYuzdesi,
            tekrarTarihi: kayit.tekrarTarihi,
            tamamlanmaTarihi: kayit.tamamlanmaTarihi,
            notMetni: kayit.notMetni,
          }
        : null,
    });
  }

  const tekrarGerekli = kayitlar.filter(
    (k) => k.durum === 'Tekrar gerekli' || k.durum === 'Eksik',
  ).length;
  const calisiliyor = kayitlar.filter((k) => k.durum === 'Çalışılıyor').length;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <SayfaBasi
        baslik="Konu takibi"
        aciklama={
          kullanici.koc
            ? `${ogrenci.adSoyad} · ${sinavTuru} · derse dokunup konuları aç`
            : `${sinavTuru} konu kataloğu · durumları koçun günceller`
        }
      />

      {kullanici.koc && <OgrenciSecici ogrenciler={liste} secili={ogrenci.id} />}

      <div className="ots-belir grid grid-cols-2 gap-3 md:grid-cols-4" style={kademe(0)}>
        <Sayac
          etiket="Tamamlanan"
          deger={istatistik.genel.tamamlanan}
          alt={`${istatistik.genel.toplam} konu içinde`}
        />
        <Sayac etiket="İlerleme" deger={`%${istatistik.genel.yuzde}`} />
        <Sayac etiket="Çalışılıyor" deger={calisiliyor} />
        <Sayac etiket="Tekrar / eksik" deger={tekrarGerekli} vurgu={tekrarGerekli > 0} />
      </div>

      <div className="ots-belir" style={kademe(1)}>
        <Kart
          baslik="Genel ilerleme"
          altBaslik={`${sinavTuru} kataloğu · ${istatistik.genel.tamamlanan}/${istatistik.genel.toplam} konu`}
          ikon={BookOpen}
        >
          <Ilerleme
            yuzde={istatistik.genel.yuzde}
            etiket="Genel konu ilerlemesi"
            yuzdeGoster
          />
        </Kart>
      </div>

      <KonuKartlari
        ogrenciId={ogrenci.id}
        dersler={[...kartlar.values()]}
        duzenlenebilir={kullanici.koc}
      />
    </div>
  );
}
