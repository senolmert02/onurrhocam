import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Belir } from '@/components/ots/Belir';
import { CizgiGrafigi } from '@/components/ots/Grafik';
import { GorevEkleFormu, KocGorevSatiri } from '@/components/ots/koc/GorevFormu';
import { HesapIslemleri } from '@/components/ots/koc/HesapIslemleri';
import { OgrenciFormu } from '@/components/ots/koc/OgrenciFormu';
import { OgrenciSil } from '@/components/ots/koc/OgrenciSil';
import {
  Bos,
  DUGME_HAYALET,
  DUGME_IKON,
  DUGME_SESSIZ,
  DurumRozeti,
  Ilerleme,
  Kart,
  Rozet,
  SayfaBasi,
  Sayac,
} from '@/components/ots/Parcalar';
import { kocGerekli, ogrenciKaydi } from '@/lib/ots/dal';
import { derslerGetir } from '@/lib/ots/konu-katalogu';
import { haftaVerisi, raporVerisi } from '@/lib/ots/sorgular/ekran';
import { derseGoreGrupla, kaynaklariGetir } from '@/lib/ots/sorgular/kaynak';
import { sureBicimle } from '@/lib/ots/tarih';

export default async function OgrenciDetaySayfasi({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hafta?: string }>;
}) {
  await kocGerekli();

  const { id } = await params;
  const { hafta } = await searchParams;

  const ogrenci = await ogrenciKaydi(id);
  if (!ogrenci) notFound();

  const [program, rapor, kaynaklar] = await Promise.all([
    haftaVerisi(ogrenci, hafta),
    raporVerisi(ogrenci, hafta),
    kaynaklariGetir(ogrenci.id),
  ]);

  const dersler = derslerGetir(ogrenci.sinavTuru === 'LGS' ? 'LGS' : 'YKS');
  const kaynakGruplari = derseGoreGrupla(kaynaklar);

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      {/* İlk ekran: CSS kademeli giriş (.ots-belir + --i) */}
      <div className="ots-belir" style={{ '--i': 0 } as React.CSSProperties}>
        <Link href="/takip/ogrenciler" className={DUGME_HAYALET}>
          <ChevronLeft size={18} strokeWidth={2} aria-hidden />
          Öğrenciler
        </Link>
      </div>

      <div className="ots-belir" style={{ '--i': 1 } as React.CSSProperties}>
        <SayfaBasi
          baslik={ogrenci.adSoyad}
          aciklama={
            [ogrenci.sinif, ogrenci.sinavTuru, ogrenci.alan, ogrenci.hedefBolum]
              .filter(Boolean)
              .join(' · ') || 'Bilgi girilmemiş'
          }
          sag={
            <div className="flex flex-wrap items-center gap-2">
              {ogrenci.durum !== 'aktif' && <Rozet>Pasif</Rozet>}
              {ogrenci.mezun && <Rozet ton="sari">Mezun</Rozet>}
              <DurumRozeti durum={program.ozet.durum} />
            </div>
          }
        />
      </div>

      <div
        className="ots-belir grid grid-cols-2 gap-3 md:grid-cols-4"
        style={{ '--i': 2 } as React.CSSProperties}
      >
        <Sayac
          etiket="Hafta uyumu"
          deger={`%${program.ozet.uyum}`}
          alt={`${program.ozet.tamamlanan}/${program.ozet.vadesiGelenGorev} görev`}
        />
        <Sayac etiket="Çözülen soru" deger={program.ozet.cozulenSoru} />
        <Sayac etiket="Çalışma" deger={sureBicimle(program.ozet.calismaSuresi)} />
        <Sayac
          etiket="Konu ilerlemesi"
          deger={`%${rapor.konu.genel.yuzde}`}
          alt={`${rapor.konu.genel.tamamlanan}/${rapor.konu.genel.toplam}`}
        />
      </div>

      <div
        className="ots-belir flex flex-col gap-2 sm:flex-row sm:gap-3"
        style={{ '--i': 3 } as React.CSSProperties}
      >
        <Link href={`/takip/konular?ogrenci=${ogrenci.id}`} className={`${DUGME_SESSIZ} w-full sm:w-auto`}>
          Konu takibi
        </Link>
        <Link href={`/takip/notlar?ogrenci=${ogrenci.id}`} className={`${DUGME_SESSIZ} w-full sm:w-auto`}>
          Koç notları
        </Link>
      </div>

      {/* Haftalık program yönetimi */}
      <div className="ots-belir" style={{ '--i': 4 } as React.CSSProperties}>
        <Kart
          baslik="Haftalık program"
          altBaslik={program.araligTr}
          sag={
            <div className="flex gap-2 sm:justify-end">
              <Link
                href={`/takip/ogrenciler/${ogrenci.id}?hafta=${program.oncekiHafta}`}
                aria-label="Önceki hafta"
                className={DUGME_IKON}
              >
                <ChevronLeft size={18} strokeWidth={2} aria-hidden />
              </Link>
              <Link
                href={`/takip/ogrenciler/${ogrenci.id}?hafta=${program.sonrakiHafta}`}
                aria-label="Sonraki hafta"
                className={DUGME_IKON}
              >
                <ChevronRight size={18} strokeWidth={2} aria-hidden />
              </Link>
            </div>
          }
        >
          <div className="flex flex-col gap-3">
            {program.gunler.map((gun) => (
              <div
                key={gun.tarih}
                className={`rounded-xl border p-3 ${
                  gun.bugunMu ? 'border-ots-gold-deep/40 bg-ots-gold-tint' : 'border-ots-line'
                }`}
              >
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <span className="font-display text-[14px] font-bold text-ots-ink">
                    {gun.gunAdi}{' '}
                    <span className="font-sans font-normal text-ots-faint">{gun.tarihTr}</span>
                  </span>
                  {gun.toplam > 0 && (
                    <span className="ots-sayi text-[12px] text-ots-faint">
                      {gun.tamamlanan}/{gun.toplam}
                    </span>
                  )}
                </div>

                {gun.gorevler.length > 0 && (
                  <ul className="mb-2 flex flex-col gap-2">
                    {gun.gorevler.map((gorev) => (
                      <KocGorevSatiri key={gorev.id} gorev={gorev} />
                    ))}
                  </ul>
                )}

                <GorevEkleFormu ogrenciId={ogrenci.id} tarih={gun.tarih} dersler={dersler} />
              </div>
            ))}
          </div>
        </Kart>
      </div>

      {/* İlk ekranın altı: görünür olunca bir kez beliren kartlar (spec §6 Belir) */}
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <Belir>
          <Kart baslik="Giriş hesabı" className="h-full">
            <HesapIslemleri
              ogrenciId={ogrenci.id}
              hesapVar={Boolean(ogrenci.kullaniciId)}
              eposta={ogrenci.email}
            />
          </Kart>
        </Belir>

        <Belir gecikme={40}>
          <Kart
            baslik="Kaynakları"
            altBaslik={kaynaklar.length ? `${kaynaklar.length} kaynak` : undefined}
            className="h-full"
            sag={
              <div className="flex sm:justify-end">
                <Link href={`/takip/kaynaklar?ogrenci=${ogrenci.id}`} className={DUGME_HAYALET}>
                  Tümü →
                </Link>
              </div>
            }
          >
            {kaynakGruplari.length === 0 ? (
              <Bos
                baslik="Kaynak girilmemiş"
                aciklama="Öğrenci Kaynaklarım sayfasından ekler."
              />
            ) : (
              <div className="flex flex-col gap-4">
                {kaynakGruplari.map((grup) => (
                  <section key={grup.ders}>
                    <h3 className="text-[13px] font-semibold leading-snug text-ots-soft">
                      {grup.ders}
                    </h3>
                    <ul className="mt-1 divide-y divide-ots-line">
                      {grup.kaynaklar.map((k) => (
                        <li
                          key={k.id}
                          className="flex min-h-12 lg:min-h-10 flex-wrap items-center gap-x-3 gap-y-1 py-2.5"
                        >
                          <span className="text-[14px] text-ots-ink">{k.ad}</span>
                          {k.tur && <Rozet>{k.tur}</Rozet>}
                          {k.notMetni && (
                            <span className="w-full text-[12px] text-ots-faint">{k.notMetni}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </Kart>
        </Belir>
      </div>

      <Belir>
        <Kart baslik="Son 8 hafta" altBaslik="Program uyumu">
          <CizgiGrafigi
            seriler={[
              {
                ad: 'Uyum',
                noktalar: rapor.trend.map((t) => ({ etiket: t.etiket, deger: t.uyum })),
              },
            ]}
            birim="%"
          />
        </Kart>
      </Belir>

      <Belir>
        <Kart baslik="Ders uyumu" altBaslik={program.araligTr}>
          {program.ozet.dersler.length === 0 ? (
            <Bos baslik="Bu haftaya görev atanmamış" />
          ) : (
            <ul className="divide-y divide-ots-line">
              {program.ozet.dersler.map((d) => (
                <li key={d.ders} className="flex min-h-12 lg:min-h-10 items-center gap-3 py-2">
                  {/* Rapor sayfasıyla aynı reçete: dar değer sütunu çubuğa yer bırakır;
                      soru sayısı etiketin altına ikinci satır olarak iner. */}
                  <span className="flex w-24 shrink-0 flex-col">
                    <span className="truncate text-[13px] text-ots-soft" title={d.ders}>
                      {d.ders}
                    </span>
                    <span className="ots-sayi text-[12px] text-ots-faint">{d.soru} soru</span>
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
        </Kart>
      </Belir>

      <Belir>
        <Kart baslik="Profil bilgileri" altBaslik="Kaydet'e basınca anında uygulanır">
          <OgrenciFormu ogrenci={ogrenci} />
        </Kart>
      </Belir>

      <Belir>
        <Kart baslik="Öğrenci bilgileri">
          <dl className="grid gap-x-8 sm:grid-cols-2">
            <Satir etiket="Durum">
              <Rozet ton={ogrenci.mezun ? 'sari' : 'yesil'}>
                {ogrenci.mezun ? 'Mezun' : 'Öğrenci'}
              </Rozet>
            </Satir>
            {ogrenci.mezun && (
              <Satir etiket="Geçen yıl sıralaması">
                <span className="ots-sayi">
                  {ogrenci.gecenYilSiralama?.toLocaleString('tr-TR') ?? '—'}
                </span>
              </Satir>
            )}
            <Satir etiket="Veli adı">{ogrenci.veliAdi || '—'}</Satir>
            <Satir etiket="Veli telefonu">{ogrenci.veliTelefon || '—'}</Satir>
            <Satir etiket="Öğrenci telefonu">{ogrenci.telefon || '—'}</Satir>
            <Satir etiket="Hedef">{ogrenci.hedef || '—'}</Satir>
            <Satir etiket="Adres">{ogrenci.adres || '—'}</Satir>
          </dl>
        </Kart>
      </Belir>

      <Belir>
        <Kart baslik="Tehlikeli bölge" altBaslik="Geri alınamaz işlemler">
          <OgrenciSil ogrenciId={ogrenci.id} adSoyad={ogrenci.adSoyad} />
          <p className="mt-4 text-[13px] leading-snug text-ots-faint">
            Öğrenciyi sistemde tutup girişini kapatmak istiyorsan, yukarıdaki profil
            formundan durumunu Pasif yapman yeterli — verileri korunur.
          </p>
        </Kart>
      </Belir>
    </div>
  );
}

/** Bilgi kartı satırı — etiket solda, değer sağda; her satır ≥44px. */
function Satir({ etiket, children }: { etiket: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-11 lg:min-h-9 items-center justify-between gap-4 border-b border-ots-line py-2 text-[14px]">
      <dt className="shrink-0 text-ots-faint">{etiket}</dt>
      <dd className="text-right font-medium text-ots-ink">{children}</dd>
    </div>
  );
}
