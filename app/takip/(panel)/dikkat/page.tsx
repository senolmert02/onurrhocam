import { CircleCheck, NotebookPen, TriangleAlert } from 'lucide-react';

import { DikkatSatiri, TakipNotlari } from '@/components/ots/koc/Panel';
import { Bos, Kart, SayfaBasi, Sayac } from '@/components/ots/Parcalar';
import { kocGerekli } from '@/lib/ots/dal';
import { kocPaneliVerisi } from '@/lib/ots/sorgular/koc';

export const metadata = { title: 'Dikkat Edilmesi Gerekenler — OnurrHocam ÖTS' };

/* Kart başına 40 ms kademe — en fazla 6 (spec §6). */
function kademe(i: number): React.CSSProperties {
  return { '--i': Math.min(i, 6) } as React.CSSProperties;
}

/**
 * Dikkat sayfası — dashboard'daki dikkat listesinin tamamı.
 * Satır reçetesi `DikkatSatiri` ile ortak (kritik kırmızı tint + şerit,
 * uyarı turuncu tint + şerit). Birincil düğme ve FAB yok: salt okunur.
 */
export default async function DikkatSayfasi() {
  await kocGerekli();
  const veri = await kocPaneliVerisi();

  const kritikler = veri.dikkat.filter((d) => d.kritik);
  const digerleri = veri.dikkat.filter((d) => !d.kritik);
  const sorunsuz = Math.max(0, veri.satirlar.length - veri.dikkat.length);

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <div className="ots-belir" style={kademe(0)}>
        <SayfaBasi
          baslik="Dikkat edilmesi gerekenler"
          aciklama={`${veri.haftaAraligTr} · uyum, hareketsizlik, soru hedefi, süre ve deneme düşüşü kurallarına göre`}
        />
      </div>

      <div className="ots-belir grid grid-cols-2 gap-3 md:grid-cols-4" style={kademe(1)}>
        <Sayac etiket="Kritik" deger={kritikler.length} vurgu={kritikler.length > 0} alt="Müdahale gerekli" />
        <Sayac etiket="Uyarı" deger={digerleri.length} alt="Takip edilmeli" />
        <Sayac etiket="Sorunsuz" deger={sorunsuz} alt="Uyarı üretmeyen" />
        <Sayac etiket="Takip notu" deger={veri.takipler.length} alt="Tarihi gelen" />
      </div>

      <div className="ots-belir" style={kademe(2)}>
        {veri.dikkat.length === 0 ? (
          <Bos
            ikon={CircleCheck}
            baslik="Her şey yolunda"
            aciklama="Bu hafta hiçbir öğrenci uyarı üretmedi."
          />
        ) : (
          <Kart baslik="Öğrenciler" altBaslik="Kritik olanlar üstte" ikon={TriangleAlert}>
            <ul className="flex flex-col gap-3">
              {veri.dikkat.map((satir) => (
                <DikkatSatiri key={satir.ogrenciId} satir={satir} detayli />
              ))}
            </ul>
          </Kart>
        )}
      </div>

      {veri.takipler.length > 0 && (
        <div className="ots-belir" style={kademe(3)}>
          <Kart baslik="Takip tarihi gelen notlar" ikon={NotebookPen}>
            <TakipNotlari takipler={veri.takipler} />
          </Kart>
        </div>
      )}
    </div>
  );
}
