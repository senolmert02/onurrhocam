import { BookMarked, BookOpen, ClipboardList, Layers } from 'lucide-react';

import { KaynakFormu } from '@/components/ots/KaynakFormu';
import { KaynakListesi } from '@/components/ots/KaynakListesi';
import { OgrenciSecici } from '@/components/ots/koc/OgrenciSecici';
import { Bos, SayfaBasi, Sayac } from '@/components/ots/Parcalar';
import { derslerGetir } from '@/lib/ots/konu-katalogu';
import { derseGoreGrupla, kaynaklariGetir } from '@/lib/ots/sorgular/kaynak';
import { ekranOgrencisi } from '@/lib/ots/sorgular/secim';

export const metadata = { title: 'Kaynaklar — OnurrHocam ÖTS' };

/**
 * Kaynaklar — öğrencinin elindeki kitap / soru bankası / video / deneme setleri.
 *
 * Öğrenci kendi listesini görür ve düzenler; koç seçiciden öğrenci seçer.
 * Sayfanın tek birincil eylemi "Kaynak ekle": lg altı FAB, lg+ sayfa başı
 * düğmesi (`KaynakFormu` ikisini de taşır). Liste istemci filtreli, silme iki adım.
 */
export default async function KaynaklarSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ ogrenci?: string }>;
}) {
  const { ogrenci: istenenId } = await searchParams;
  const { kullanici, ogrenci, liste } = await ekranOgrencisi(istenenId);

  if (!ogrenci) {
    return (
      <div className="flex flex-col gap-5">
        <SayfaBasi baslik="Kaynaklar" />
        {kullanici.koc ? (
          <>
            <OgrenciSecici ogrenciler={liste} />
            <Bos
              ikon={BookMarked}
              baslik="Öğrenci seç"
              aciklama="Kaynakları görmek için yukarıdan bir öğrenci seç."
            />
          </>
        ) : (
          <Bos baslik="Öğrenci kaydın bulunamadı" aciklama="Koçunla görüşmen gerekiyor." />
        )}
      </div>
    );
  }

  const kaynaklar = await kaynaklariGetir(ogrenci.id);
  const gruplar = derseGoreGrupla(kaynaklar);
  const dersler = derslerGetir(ogrenci.sinavTuru === 'LGS' ? 'LGS' : 'YKS');

  const turSayisi = (tur: string) => kaynaklar.filter((k) => k.tur === tur).length;

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <SayfaBasi
        baslik={kullanici.koc ? `Kaynaklar · ${ogrenci.adSoyad}` : 'Kaynaklarım'}
        aciklama={
          kullanici.koc
            ? 'Öğrencinin elindeki kaynaklar — program yazarken buradan seç'
            : 'Elindeki kitap, soru bankası ve video setleri — koçun programı bunlara göre yazar'
        }
        sag={
          <KaynakFormu
            ogrenciId={kullanici.koc ? ogrenci.id : undefined}
            dersler={dersler}
            altBaslik={kullanici.koc ? ogrenci.adSoyad : undefined}
          />
        }
      />

      {kullanici.koc && <OgrenciSecici ogrenciler={liste} secili={ogrenci.id} />}

      {/* 4 sayaç 2×2 → md'de tek satır (spec §5.4) */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Sayac etiket="Toplam kaynak" deger={kaynaklar.length} ikon={BookMarked} />
        <Sayac etiket="Ders" deger={gruplar.length} alt="kaynağı olan ders" ikon={Layers} />
        <Sayac etiket="Soru bankası" deger={turSayisi('Soru bankası')} ikon={BookOpen} />
        <Sayac etiket="Deneme seti" deger={turSayisi('Deneme')} ikon={ClipboardList} />
      </div>

      <KaynakListesi gruplar={gruplar} />
    </div>
  );
}
