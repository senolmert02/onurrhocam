import { CheckCircle2, History, ListChecks, Target, Timer } from 'lucide-react';

import { Bos, Kart, Rozet, SayfaBasi, Sayac } from '@/components/ots/Parcalar';
import { SerbestCalismaFormu } from '@/components/ots/SerbestCalismaFormu';
import { ogrenciGerekli } from '@/lib/ots/dal';
import { derslerGetir } from '@/lib/ots/konu-katalogu';
import { calismaGecmisi } from '@/lib/ots/sorgular/temel';
import { bugun as bugunuAl, gunEkle, sureBicimle, trTarih } from '@/lib/ots/tarih';

export const metadata = { title: 'Çalışma Geçmişim — OnurrHocam ÖTS' };

/** `.ots-belir` kademesi — kart başına 40 ms, en fazla 6 (spec §6). */
function belir(sira: number): React.CSSProperties {
  return { '--i': Math.min(sira, 6) } as React.CSSProperties;
}

/**
 * Çalışma geçmişi — spec §5.4 / §5.5.
 *
 * Sayaçlar 2×2 (md+ tek satır); serbest çalışma formu `Modal` içinde, lg altı
 * FAB ile, lg+ sayfa başındaki düğmeyle açılır (`SerbestCalismaFormu` ikisini
 * de taşır — sayfada tek birincil eylem). Kayıtlar günlere göre gruplu liste.
 */
export default async function GecmisSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ gun?: string }>;
}) {
  const { ogrenci } = await ogrenciGerekli();
  const { gun } = await searchParams;

  const gunSayisi = Math.min(Math.max(Number(gun) || 30, 7), 180);
  const bugun = bugunuAl();
  const baslangic = gunEkle(bugun, -(gunSayisi - 1));

  const kayitlar = await calismaGecmisi(ogrenci.id, baslangic, bugun);
  const dersler = derslerGetir(ogrenci.sinavTuru === 'LGS' ? 'LGS' : 'YKS');

  // Günlere göre grupla — sorgu zaten tarihe göre sıralı geliyor.
  const gunler = new Map<string, typeof kayitlar>();
  for (const kayit of kayitlar) {
    const liste = gunler.get(kayit.tarih) ?? [];
    liste.push(kayit);
    gunler.set(kayit.tarih, liste);
  }

  const toplamSoru = kayitlar.reduce((a, k) => a + k.soru, 0);
  const toplamSure = kayitlar.reduce((a, k) => a + k.sure, 0);
  const toplamDogru = kayitlar.reduce((a, k) => a + k.dogru, 0);
  const toplamYanlis = kayitlar.reduce((a, k) => a + k.yanlis, 0);
  const dogruOrani =
    toplamDogru + toplamYanlis > 0
      ? `%${Math.round((toplamDogru / (toplamDogru + toplamYanlis)) * 100)}`
      : '—';

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <SayfaBasi
        baslik="Çalışma geçmişim"
        aciklama={`${trTarih(baslangic)} – ${trTarih(bugun)} · son ${gunSayisi} gün`}
        sag={<SerbestCalismaFormu dersler={dersler} bugun={bugun} />}
      />

      {/* 2×2, md+ tek satır (spec §5.4) */}
      <div className="ots-belir grid grid-cols-2 gap-3 md:grid-cols-4" style={belir(0)}>
        <Sayac ikon={Target} etiket="Toplam soru" deger={toplamSoru} />
        <Sayac ikon={Timer} etiket="Toplam çalışma" deger={sureBicimle(toplamSure)} />
        <Sayac
          ikon={CheckCircle2}
          etiket="Doğru oranı"
          deger={dogruOrani}
          alt={`${toplamDogru} doğru · ${toplamYanlis} yanlış`}
        />
        <Sayac
          ikon={ListChecks}
          etiket="Çalışılan gün"
          deger={gunler.size}
          alt={`${gunSayisi} günün içinde`}
        />
      </div>

      <div className="ots-belir" style={belir(1)}>
        {kayitlar.length === 0 ? (
          <Bos
            ikon={History}
            baslik="Bu aralıkta çalışma kaydı yok"
            aciklama="Görev tamamladıkça ya da serbest çalışma ekledikçe burada birikecek."
          />
        ) : (
          <Kart baslik="Günlere göre" ikon={History} altBaslik={`${gunler.size} gün · ${kayitlar.length} kayıt`}>
            <ul className="flex flex-col gap-5">
              {[...gunler.entries()].map(([tarih, liste]) => {
                const gunSoru = liste.reduce((a, k) => a + k.soru, 0);
                const gunSure = liste.reduce((a, k) => a + k.sure, 0);
                return (
                  <li key={tarih}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ots-line pb-2">
                      <h3 className="font-display text-[15px] font-bold tracking-[-0.01em] text-ots-ink">
                        {trTarih(tarih)}
                      </h3>
                      <span className="ots-sayi text-[12px] text-ots-faint">
                        {gunSoru} soru · {sureBicimle(gunSure)}
                      </span>
                    </div>
                    <ul className="divide-y divide-ots-line">
                      {liste.map((k) => (
                        <li
                          key={k.id}
                          className="flex min-h-12 lg:min-h-10 flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2.5"
                        >
                          <span className="flex min-w-0 flex-wrap items-center gap-2">
                            <span className="text-[14px] font-medium text-ots-ink">{k.ders}</span>
                            {k.konu && (
                              <span className="truncate text-[12px] text-ots-faint">{k.konu}</span>
                            )}
                            {!k.gorevId && <Rozet>Serbest</Rozet>}
                          </span>
                          <span className="ots-sayi text-[13px] text-ots-soft">
                            {k.soru} soru
                            {k.dogru + k.yanlis > 0 && ` · ${k.dogru}D ${k.yanlis}Y ${k.bos}B`}
                            {k.sure > 0 && ` · ${sureBicimle(k.sure)}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          </Kart>
        )}
      </div>
    </div>
  );
}
