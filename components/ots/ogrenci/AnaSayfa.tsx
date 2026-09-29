import { BookOpen, CalendarDays, ListTodo, Target, Timer, TrendingUp } from 'lucide-react';
import Link from 'next/link';

import { GorevKarti } from '@/components/ots/GorevKarti';
import {
  Bos,
  DUGME_HAYALET,
  DurumRozeti,
  Ilerleme,
  Kart,
  SayfaBasi,
  Sayac,
} from '@/components/ots/Parcalar';
import { SerbestCalismaFormu } from '@/components/ots/SerbestCalismaFormu';
import { derslerGetir } from '@/lib/ots/konu-katalogu';
import type { Ogrenci } from '@/lib/ots/sema';
import { anaSayfaVerisi } from '@/lib/ots/sorgular/ekran';
import { sureBicimle } from '@/lib/ots/tarih';

/** `.ots-belir` kademesi — kart başına 40 ms, en fazla 6 (spec §6). */
function belir(sira: number): React.CSSProperties {
  return { '--i': Math.min(sira, 6) } as React.CSSProperties;
}

/**
 * Öğrenci ana sayfası — spec §8.
 *
 * Sıra: selam + durum rozeti → 4 sayaç (2×2, md+ 4 sütun) → bugünün programı
 * (görev kartları, her birinde "Tamamla") → serbest çalışma düğmesi (formu
 * yerinde modalda açar) →
 * bu hafta / konu ilerlemesi yan yana (lg+). Sunucu bileşeni; hareket yalnızca
 * `.ots-belir` CSS kademesi ve `GorevKarti` içindedir.
 */
export async function OgrenciAnaSayfa({ ogrenci }: { ogrenci: Ogrenci }) {
  const veri = await anaSayfaVerisi(ogrenci);
  const { gun, hafta } = veri;

  const kalanGorev = gun.ozet.toplamGorev - gun.ozet.tamamlanan;
  // Katalog sunucuda süzülür; istemci bileşenine yalnızca ders adları gider.
  const dersler = derslerGetir(ogrenci.sinavTuru === 'LGS' ? 'LGS' : 'YKS');

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <SayfaBasi
        baslik={`Merhaba, ${ogrenci.adSoyad.split(' ')[0]}`}
        aciklama={`${veri.gunAdi}, ${veri.bugunTr}`}
        sag={<DurumRozeti durum={hafta.ozet.durum} />}
      />

      {/* Bugünün sayıları — 2×2, md+ tek satır (spec §5.4) */}
      <div className="ots-belir grid grid-cols-2 gap-3 md:grid-cols-4" style={belir(0)}>
        <Sayac
          ikon={ListTodo}
          etiket="Bugünkü görev"
          deger={`${gun.ozet.tamamlanan}/${gun.ozet.toplamGorev}`}
          alt={kalanGorev > 0 ? `${kalanGorev} görev kaldı` : 'Hepsi tamam'}
          vurgu={kalanGorev > 0}
        />
        <Sayac
          ikon={Target}
          etiket="Çözülen soru"
          deger={gun.ozet.cozulenSoru}
          alt={gun.hedefSoru > 0 ? `Hedef ${gun.hedefSoru}` : undefined}
        />
        <Sayac
          ikon={Timer}
          etiket="Çalışma süresi"
          deger={sureBicimle(gun.ozet.calismaSuresi)}
          alt={gun.hedefSure > 0 ? `Hedef ${sureBicimle(gun.hedefSure)}` : undefined}
        />
        <Sayac
          ikon={TrendingUp}
          etiket="Hafta uyumu"
          deger={`%${hafta.ozet.uyum}`}
          alt={`${hafta.ozet.tamamlanan}/${hafta.ozet.vadesiGelenGorev} görev`}
        />
      </div>

      {/* Bugünün görevleri */}
      <div className="ots-belir" style={belir(1)}>
        <Kart
          baslik="Bugünün programı"
          ikon={CalendarDays}
          altBaslik={veri.bugunTr}
          sag={
            <Link href="/takip/program" className={DUGME_HAYALET}>
              Haftayı gör →
            </Link>
          }
        >
          {veri.gorevler.length === 0 ? (
            <Bos
              ikon={CalendarDays}
              baslik="Bugün için program yok"
              aciklama="Koçun bu güne görev atamamış. Dilersen serbest çalışma girebilirsin."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {veri.gorevler.map((gorev) => (
                <GorevKarti key={gorev.id} gorev={gorev} />
              ))}
            </ul>
          )}

          {/* Formu yerinde açar; önceki bağlantı sayfadan çıkarıyordu */}
          <div className="mt-4">
            <SerbestCalismaFormu dersler={dersler} bugun={veri.bugun} tetikleyici="satir" />
          </div>
        </Kart>
      </div>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        {/* Haftalık özet */}
        <div className="ots-belir" style={belir(2)}>
          <Kart baslik="Bu hafta" altBaslik={hafta.araligTr} ikon={TrendingUp}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="ots-sayi font-display text-[26px] font-bold leading-none text-ots-ink sm:text-[28px]">
                %{hafta.ozet.uyum}
              </span>
              <DurumRozeti durum={hafta.ozet.durum} />
            </div>
            <Ilerleme yuzde={hafta.ozet.uyum} renk={hafta.ozet.durum.renk} etiket="Haftalık uyum" />

            <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
              <Mini etiket="Görev" deger={`${hafta.ozet.tamamlanan}/${hafta.ozet.vadesiGelenGorev}`} />
              <Mini etiket="Soru" deger={hafta.ozet.cozulenSoru} />
              <Mini etiket="Süre" deger={sureBicimle(hafta.ozet.calismaSuresi)} />
            </dl>

            {hafta.ozet.eksikGorevler.length > 0 && (
              <p className="mt-3 rounded-lg bg-ots-turuncu-tint px-3 py-2 text-[13px] leading-snug text-ots-turuncu">
                {hafta.ozet.eksikGorevler.length} görev tamamlanmayı bekliyor.
              </p>
            )}
          </Kart>
        </div>

        {/* Konu ilerlemesi */}
        <div className="ots-belir" style={belir(3)}>
          <Kart
            baslik="Konu ilerlemen"
            ikon={BookOpen}
            altBaslik={`${ogrenci.sinavTuru} konu kataloğu`}
            sag={
              <Link href="/takip/konular" className={DUGME_HAYALET}>
                Tümü →
              </Link>
            }
          >
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <span className="ots-sayi font-display text-[26px] font-bold leading-none text-ots-ink sm:text-[28px]">
                %{veri.konu.genel.yuzde}
              </span>
              <span className="ots-sayi text-[13px] text-ots-faint">
                {veri.konu.genel.tamamlanan} / {veri.konu.genel.toplam} konu
              </span>
            </div>
            <Ilerleme yuzde={veri.konu.genel.yuzde} etiket="Genel konu ilerlemesi" />

            <ul className="mt-4 flex flex-col gap-2.5">
              {veri.konu.dersler
                .filter((d) => d.tamamlanan > 0)
                .sort((a, b) => b.yuzde - a.yuzde)
                .slice(0, 4)
                .map((d) => (
                  <li key={d.ders} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 truncate text-[13px] text-ots-soft">{d.ders}</span>
                    <div className="min-w-0 flex-1">
                      <Ilerleme yuzde={d.yuzde} etiket={`${d.ders} ilerlemesi`} />
                    </div>
                    <span className="ots-sayi w-14 shrink-0 text-right text-[13px] font-semibold text-ots-ink">
                      %{d.yuzde}
                    </span>
                  </li>
                ))}
            </ul>

            {veri.konu.genel.tamamlanan === 0 && (
              <p className="mt-3 text-[13px] text-ots-faint">
                Henüz tamamlanmış konu yok. Konu durumlarını koçun günceller.
              </p>
            )}
          </Kart>
        </div>
      </div>
    </div>
  );
}

function Mini({ etiket, deger }: { etiket: string; deger: string | number }) {
  return (
    <div className="rounded-xl bg-ots-raised px-2 py-2.5">
      <dt className="text-[12px] text-ots-faint">{etiket}</dt>
      <dd className="ots-sayi mt-0.5 font-display text-[15px] font-bold text-ots-ink">{deger}</dd>
    </div>
  );
}
