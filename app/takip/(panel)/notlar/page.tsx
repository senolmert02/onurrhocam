import { NotebookPen, UserRound } from 'lucide-react';
import Link from 'next/link';

import { NotFormu, NotSatiri } from '@/components/ots/koc/NotFormu';
import { OgrenciSecici } from '@/components/ots/koc/OgrenciSecici';
import { Bos, DUGME_SESSIZ, Kart, SayfaBasi } from '@/components/ots/Parcalar';
import { kocGerekli } from '@/lib/ots/dal';
import { ogrencininNotlari } from '@/lib/ots/sorgular/koc';
import { ekranOgrencisi } from '@/lib/ots/sorgular/secim';
import { bugun as bugunuAl } from '@/lib/ots/tarih';

export const metadata = { title: 'Koç Notları — OnurrHocam ÖTS' };

/** İlk sayfada gösterilen not sayısı; fazlası "Daha fazla göster" ile (spec §5.4). */
const SAYFA_BOYU = 20;

/** `.ots-belir` kademesi — kart başına 40 ms, en fazla 6 (spec §6). */
const kademe = (i: number) => ({ '--i': Math.min(i, 6) }) as React.CSSProperties;

export default async function NotlarSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ ogrenci?: string; tum?: string }>;
}) {
  await kocGerekli();
  const { ogrenci: istenenId, tum } = await searchParams;
  const { ogrenci, liste } = await ekranOgrencisi(istenenId);

  const notlar = ogrenci ? await ogrencininNotlari(ogrenci.id) : [];
  const bugun = bugunuAl();

  const hepsi = tum === '1';
  const gorunen = hepsi ? notlar : notlar.slice(0, SAYFA_BOYU);
  const dahaFazlaVar = !hepsi && notlar.length > SAYFA_BOYU;
  const dahaFazlaAdresi = ogrenci
    ? `?${new URLSearchParams({ ogrenci: ogrenci.id, tum: '1' }).toString()}`
    : '?tum=1';

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <SayfaBasi
        baslik="Koç notları"
        aciklama="Görüşme notları ve takip tarihleri — yalnızca sen görürsün"
      />

      <OgrenciSecici ogrenciler={liste} secili={ogrenci?.id} />

      {!ogrenci ? (
        <Bos
          ikon={UserRound}
          baslik="Öğrenci seç"
          aciklama="Not eklemek için yukarıdan bir öğrenci seç."
        />
      ) : (
        <>
          <div className="ots-belir" style={kademe(0)}>
            <Kart baslik="Yeni not" altBaslik={ogrenci.adSoyad} ikon={NotebookPen}>
              <NotFormu ogrenciId={ogrenci.id} bugun={bugun} />
            </Kart>
          </div>

          <section className="ots-belir flex flex-col gap-4" style={kademe(1)}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-[16px] font-bold tracking-[-0.01em] text-ots-ink">
                Geçmiş notlar
              </h2>
              <span className="ots-sayi text-[13px] text-ots-faint">{notlar.length} kayıt</span>
            </div>

            {notlar.length === 0 ? (
              <Bos
                ikon={NotebookPen}
                baslik="Henüz not yok"
                aciklama="Görüşme sonrası aldığın notlar burada birikir."
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {gorunen.map((not) => (
                  <NotSatiri key={not.id} not={not} bugun={bugun} />
                ))}
              </ul>
            )}

            {dahaFazlaVar && (
              <Link href={dahaFazlaAdresi} scroll={false} className={`${DUGME_SESSIZ} w-full`}>
                Daha fazla göster ({notlar.length - SAYFA_BOYU})
              </Link>
            )}
          </section>
        </>
      )}
    </div>
  );
}
