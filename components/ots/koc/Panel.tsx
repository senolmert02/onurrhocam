import {
  CalendarOff,
  CircleCheck,
  NotebookPen,
  Target,
  Timer,
  TriangleAlert,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';

import {
  Bos,
  DUGME_HAYALET,
  DUGME_SESSIZ,
  DurumRozeti,
  Ilerleme,
  Kart,
  ODAK_HALKASI,
  Rozet,
  SayfaBasi,
  Sayac,
  type RozetTonu,
} from '@/components/ots/Parcalar';
import type { DurumBandi } from '@/lib/ots/hesap';
import { kocPaneliVerisi, type KocPaneli as KocPaneliVerisi } from '@/lib/ots/sorgular/koc';
import { sureBicimle, trTarih } from '@/lib/ots/tarih';

/**
 * Koç dashboard'u — spec §8 "Dashboard".
 *
 * Sıra: sayfa başı → onay bandı → 4 sayaç (2×2 → md 4) → dikkat listesi →
 * takip notları → öğrenci tablosu (md+ tablo, md altı kart listesi; ikisi de
 * `satirVerisi()` tek kaynağından beslenir). Sayfada birincil düğme ve FAB
 * yok: dashboard salt okunur.
 *
 * Bu modül SUNUCU bileşenidir; `DikkatSatiri`, `TakipNotlari`, `OgrenciTablosu`
 * dikkat/haftalik sayfalarınca da kullanılır.
 */

type DikkatSatirVerisi = KocPaneliVerisi['dikkat'][number];
type TakipNotu = KocPaneliVerisi['takipler'][number];

/* Kart başına 40 ms kademe — en fazla 6 (spec §6). */
function kademe(i: number): React.CSSProperties {
  return { '--i': Math.min(i, 6) } as React.CSSProperties;
}

export async function KocPaneli() {
  const veri = await kocPaneliVerisi();
  const { gunluk } = veri;

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <div className="ots-belir" style={kademe(0)}>
        <SayfaBasi
          baslik="Bugünün raporu"
          aciklama={`${veri.gunTr} · hafta ${veri.haftaAraligTr}`}
          sag={
            <Link href="/takip/ogrenciler" className={`${DUGME_SESSIZ} w-full sm:w-auto`}>
              <Users size={18} strokeWidth={2} aria-hidden />
              Öğrenciler
            </Link>
          }
        />
      </div>

      {veri.onayBekleyen > 0 && (
        <div className="ots-belir" style={kademe(1)}>
          <OnayBandi sayi={veri.onayBekleyen} />
        </div>
      )}

      {gunluk.toplamOgrenci === 0 ? (
        <div className="ots-belir" style={kademe(2)}>
          <Bos
            ikon={Users}
            baslik="Henüz öğrenci yok"
            aciklama="Öğrenciler sayfasından ilk öğrenciyi ekleyebilir ya da onay bekleyen kayıtları onaylayabilirsin."
          />
        </div>
      ) : (
        <>
          <div className="ots-belir grid grid-cols-2 gap-3 md:grid-cols-4" style={kademe(2)}>
            <Sayac
              ikon={CircleCheck}
              etiket="Bugün tamamlayan"
              deger={`${gunluk.tamamlayan}/${gunluk.toplamOgrenci}`}
              alt={`${gunluk.kismen} kısmen · ${gunluk.tamamlamayan} hiç`}
            />
            <Sayac
              ikon={CalendarOff}
              etiket="Programsız"
              deger={gunluk.gorevsiz}
              alt="Bugüne görev atanmamış"
              vurgu={gunluk.gorevsiz > 0}
            />
            <Sayac ikon={Target} etiket="Toplam soru" deger={gunluk.toplamSoru} alt="Bugün" />
            <Sayac
              ikon={Timer}
              etiket="Toplam çalışma"
              deger={sureBicimle(gunluk.toplamSure)}
              alt="Bugün"
            />
          </div>

          {/* Dikkat listesi */}
          <div className="ots-belir" style={kademe(3)}>
            <Kart
              baslik="Dikkat edilmesi gerekenler"
              ikon={TriangleAlert}
              altBaslik="Uyum, hareketsizlik, soru hedefi, süre ve deneme düşüşü kurallarına göre"
              sag={
                veri.dikkat.length > 0 ? (
                  <Link href="/takip/dikkat" className={DUGME_HAYALET}>
                    Tümü →
                  </Link>
                ) : undefined
              }
            >
              {veri.dikkat.length === 0 ? (
                <Bos
                  ikon={CircleCheck}
                  baslik="Her şey yolunda"
                  aciklama="Bu hafta uyarı üreten öğrenci yok."
                />
              ) : (
                <ul className="flex flex-col gap-3">
                  {veri.dikkat.slice(0, 5).map((satir) => (
                    <DikkatSatiri key={satir.ogrenciId} satir={satir} />
                  ))}
                </ul>
              )}
            </Kart>
          </div>

          {/* Takip tarihi gelen notlar */}
          {veri.takipler.length > 0 && (
            <div className="ots-belir" style={kademe(4)}>
              <Kart baslik="Takip tarihi gelen notlar" ikon={NotebookPen}>
                <TakipNotlari takipler={veri.takipler} />
              </Kart>
            </div>
          )}

          {/* Öğrenci tablosu */}
          <section className="ots-belir" style={kademe(5)} aria-labelledby="ogrenci-tablosu-baslik">
            <BolumBasligi
              id="ogrenci-tablosu-baslik"
              ikon={Users}
              baslik="Öğrenci tablosu"
              altBaslik="Bu hafta · uyuma göre sıralı"
            />
            <OgrenciTablosu satirlar={veri.satirlar} />
          </section>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Onay bandı */

/**
 * Onay bekleyen kayıt bandı — `gold-tint` zemin, `gold-deep/40` kenar (spec §8).
 * Eylem md+'da hayalet, md altında tam genişlik sessiz düğme; iki bağlantıdan
 * yalnızca biri görünür (display:none olan ekran okuyucuya da gitmez).
 */
function OnayBandi({ sayi }: { sayi: number }) {
  return (
    <div
      role="note"
      className="flex flex-col gap-3 rounded-2xl border border-ots-gold-deep/40 bg-ots-gold-tint p-4 md:flex-row md:items-center md:justify-between"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-ots-surface text-ots-gold-ink">
          <UserCheck size={18} strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-display text-[15px] font-bold text-ots-ink">
            <span className="ots-sayi">{sayi}</span> kayıt onay bekliyor
          </p>
          <p className="mt-0.5 text-[13px] leading-snug text-ots-soft">
            Onaylanmayan kayıtlar bir hafta sonra kendiliğinden siliniyor.
          </p>
        </div>
      </div>

      <div className="md:hidden">
        <Link href="/takip/onaylar" className={`${DUGME_SESSIZ} w-full`}>
          Onayla
        </Link>
      </div>
      <div className="hidden md:block md:shrink-0">
        <Link href="/takip/onaylar" className={DUGME_HAYALET}>
          Onayla →
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Bölüm başlığı */

/** Kart dışı bölüm başlığı — `Kart` başlık reçetesiyle aynı (spec §4.2). */
function BolumBasligi({
  id,
  ikon: Ikon,
  baslik,
  altBaslik,
}: {
  id: string;
  ikon: LucideIcon;
  baslik: string;
  altBaslik?: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-ots-gold-tint text-ots-gold-ink">
        <Ikon size={18} strokeWidth={2} aria-hidden />
      </span>
      <div className="min-w-0">
        <h2 id={id} className="font-display text-[16px] font-bold tracking-[-0.01em] text-ots-ink">
          {baslik}
        </h2>
        {altBaslik && <p className="mt-0.5 text-[13px] leading-snug text-ots-faint">{altBaslik}</p>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Dikkat satırı */

type UyariSeviyesi = DikkatSatirVerisi['uyarilar'][number]['seviye'];

const SEVIYE_ETIKETI: Record<UyariSeviyesi, string> = {
  kritik: 'Kritik',
  uyari: 'Uyarı',
  bilgi: 'Bilgi',
};

const SEVIYE_TONU: Record<UyariSeviyesi, RozetTonu> = {
  kritik: 'kirmizi',
  uyari: 'turuncu',
  bilgi: 'notr',
};

/* Satır zemini ve sol şerit — kritik kırmızı, uyarı turuncu, bilgi nötr.
   Şerit kenarlık değil arka plan (globals `.ots-kok *` border-color kuralından bağımsız). */
const SATIR_ZEMINI: Record<UyariSeviyesi, string> = {
  kritik: 'bg-ots-kirmizi-tint',
  uyari: 'bg-ots-turuncu-tint',
  bilgi: 'border border-ots-line bg-ots-surface',
};

const SATIR_SERIDI: Record<UyariSeviyesi, string> = {
  kritik: 'bg-ots-kirmizi',
  uyari: 'bg-ots-turuncu',
  bilgi: 'bg-ots-line-strong',
};

function satirSeviyesi(satir: DikkatSatirVerisi): UyariSeviyesi {
  if (satir.kritik) return 'kritik';
  return satir.uyarilar.some((u) => u.seviye === 'uyari') ? 'uyari' : 'bilgi';
}

/**
 * Dikkat listesi satırı. Satırın tamamı öğrenci detayına bağlantıdır
 * (44px+ dokunma hedefi; hover'a bağlı gizli eylem yok).
 * `detayli` görev sayısını da gösterir (dikkat sayfası).
 */
export function DikkatSatiri({
  satir,
  detayli = false,
}: {
  satir: DikkatSatirVerisi;
  detayli?: boolean;
}) {
  const seviye = satirSeviyesi(satir);

  return (
    <li className={`relative overflow-hidden rounded-xl ${SATIR_ZEMINI[seviye]}`}>
      <span aria-hidden className={`absolute inset-y-0 left-0 w-[3px] ${SATIR_SERIDI[seviye]}`} />
      <Link
        href={`/takip/ogrenciler/${satir.ogrenciId}`}
        className={`block min-h-11 lg:min-h-9 rounded-xl p-3.5 pl-4 transition-colors duration-150 active:bg-ots-raised ${ODAK_HALKASI}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-display text-[15px] font-bold text-ots-ink">{satir.adSoyad}</span>
          <span className="flex flex-wrap items-center gap-2">
            {detayli && (
              <span className="ots-sayi text-[13px] text-ots-faint">
                {satir.tamamlanan}/{satir.vadesiGelen} görev
              </span>
            )}
            <DurumRozeti durum={satir.durum} />
          </span>
        </div>
        <ul className="mt-2.5 flex flex-col gap-1.5">
          {satir.uyarilar.map((uyari, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] leading-snug text-ots-soft">
              <Rozet ton={SEVIYE_TONU[uyari.seviye]} className="shrink-0">
                {SEVIYE_ETIKETI[uyari.seviye]}
              </Rozet>
              <span className="pt-px">{uyari.mesaj}</span>
            </li>
          ))}
        </ul>
      </Link>
    </li>
  );
}

/* --------------------------------------------------------------- Takip notları */

/** Takip tarihi gelen koç notları — satırın tamamı öğrenci detayına bağlantı. */
export function TakipNotlari({ takipler }: { takipler: TakipNotu[] }) {
  return (
    <ul className="flex flex-col divide-y divide-ots-line">
      {takipler.map((takip) => (
        <li key={takip.id}>
          <Link
            href={`/takip/ogrenciler/${takip.ogrenciId}`}
            className={`block min-h-12 lg:min-h-10 rounded-lg py-3 transition-colors duration-150 hover:bg-ots-raised active:bg-ots-raised ${ODAK_HALKASI}`}
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-[14px] font-semibold text-ots-gold-ink">{takip.adSoyad}</span>
              <span className="text-[12px] text-ots-faint">takip: {trTarih(takip.takipTarihi ?? '')}</span>
            </div>
            <p className="mt-1 text-[14px] leading-[1.5] text-ots-soft">
              {takip.aksiyon || takip.notMetni}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------ Öğrenci tablosu */

/**
 * Tablo/kart girdisi — dashboard'un `OgrenciOzetSatiri`si bunu yapısal olarak
 * karşılar; haftalık rapor kendi satırlarını bu şekle getirir.
 */
export type TabloGirdisi = {
  ogrenciId: string;
  adSoyad: string;
  sinif?: string;
  sinavTuru?: string;
  uyum: number;
  durum: DurumBandi;
  soru: number;
  sure: number;
  konuYuzde: number;
};

/** Tablo ve kartın ortak tükettiği tek satır verisi (spec §4.7). */
export function satirVerisi(satir: TabloGirdisi) {
  const meta = [satir.sinif, satir.sinavTuru].filter(Boolean).join(' · ');
  return {
    id: satir.ogrenciId,
    adres: `/takip/ogrenciler/${satir.ogrenciId}`,
    ad: satir.adSoyad,
    meta: meta || undefined,
    uyum: Math.round(satir.uyum),
    durum: satir.durum,
    soru: satir.soru,
    calisma: sureBicimle(satir.sure),
    konu: `%${Math.round(satir.konuYuzde)}`,
  };
}

type TabloSatiri = ReturnType<typeof satirVerisi>;

/** Mobil kart listesinde ilk gösterilen kayıt sayısı; kalanı "Daha fazla göster" açar. */
const KART_ESIGI = 20;

const TH = 'h-11 lg:h-9 px-4 text-left text-[12px] font-semibold text-ots-faint bg-ots-raised';
const TD = 'px-4 py-3 text-[14px] text-ots-ink';
const TD_SAYI = `${TD} ots-sayi text-right`;

export function OgrenciTablosu({ satirlar }: { satirlar: TabloGirdisi[] }) {
  if (satirlar.length === 0) {
    return <Bos baslik="Öğrenci yok" />;
  }

  const veriler = satirlar.map(satirVerisi);
  const ilkKartlar = veriler.slice(0, KART_ESIGI);
  const kalanKartlar = veriler.slice(KART_ESIGI);

  return (
    <>
      {/* md+ tablo — min-w yok, yatay kaydırma yok */}
      <div className="hidden overflow-hidden rounded-2xl border border-ots-line bg-ots-surface shadow-ots md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th scope="col" className={TH}>
                Öğrenci
              </th>
              <th scope="col" className={`${TH} text-right`}>
                Uyum
              </th>
              <th scope="col" className={`${TH} text-right`}>
                Soru
              </th>
              <th scope="col" className={`${TH} text-right`}>
                Çalışma
              </th>
              <th scope="col" className={`${TH} text-right`}>
                Konu
              </th>
              <th scope="col" className={TH}>
                Durum
              </th>
            </tr>
          </thead>
          <tbody>
            {veriler.map((v) => (
              <tr
                key={v.id}
                className="border-b border-ots-line transition-colors duration-150 last:border-0 hover:bg-ots-raised"
              >
                <td className={`${TD} py-1.5`}>
                  <Link
                    href={v.adres}
                    className={`inline-flex min-h-11 lg:min-h-9 flex-col justify-center rounded-md font-semibold hover:text-ots-gold-ink hover:underline ${ODAK_HALKASI}`}
                  >
                    {v.ad}
                    {v.meta && (
                      <span className="text-[12px] font-normal text-ots-faint">{v.meta}</span>
                    )}
                  </Link>
                </td>
                <td className={TD_SAYI}>
                  <div className="flex items-center justify-end gap-3">
                    <div className="w-16 shrink-0">
                      <Ilerleme yuzde={v.uyum} renk={v.durum.renk} etiket={`${v.ad} uyum`} />
                    </div>
                    <span className="w-10 font-semibold">%{v.uyum}</span>
                  </div>
                </td>
                <td className={TD_SAYI}>{v.soru}</td>
                <td className={TD_SAYI}>{v.calisma}</td>
                <td className={TD_SAYI}>{v.konu}</td>
                <td className={TD}>
                  <DurumRozeti durum={v.durum} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* md altı kart listesi — aynı satır verisi (spec §5.4) */}
      <div className="md:hidden">
        <ul className="flex flex-col gap-3">
          {ilkKartlar.map((v) => (
            <OgrenciKarti key={v.id} v={v} />
          ))}
        </ul>
        {kalanKartlar.length > 0 && (
          <details className="group mt-3">
            <summary
              className={`${DUGME_SESSIZ} w-full cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
            >
              {/* Summary görünür kalır: odak kaybolmaz, details yeniden kapatılabilir */}
              <span className="group-open:hidden">
                Daha fazla göster ({kalanKartlar.length})
              </span>
              <span className="hidden group-open:inline">Daha az göster</span>
            </summary>
            <ul className="mt-3 flex flex-col gap-3">
              {kalanKartlar.map((v) => (
                <OgrenciKarti key={v.id} v={v} />
              ))}
            </ul>
          </details>
        )}
      </div>
    </>
  );
}

/** Mobil öğrenci kartı — kartın tamamı bağlantı (spec §5.4 OgrenciTablosu kartı). */
function OgrenciKarti({ v }: { v: TabloSatiri }) {
  return (
    <li className="ots-liste-oge">
      <Link
        href={v.adres}
        className={`block rounded-2xl border border-ots-line bg-ots-surface p-4 shadow-ots transition-colors duration-150 active:bg-ots-raised ${ODAK_HALKASI}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="min-w-0">
            <span className="block text-[15px] font-semibold text-ots-ink">{v.ad}</span>
            {v.meta && <span className="block text-[12px] text-ots-faint">{v.meta}</span>}
          </span>
          <DurumRozeti durum={v.durum} />
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <Ilerleme yuzde={v.uyum} renk={v.durum.renk} etiket={`${v.ad} uyum`} />
          </div>
          <span className="ots-sayi shrink-0 text-[15px] font-bold text-ots-ink">%{v.uyum}</span>
        </div>

        <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-[13px]">
          <div>
            <dt className="text-ots-faint">Soru</dt>
            <dd className="ots-sayi font-semibold text-ots-ink">{v.soru}</dd>
          </div>
          <div>
            <dt className="text-ots-faint">Çalışma</dt>
            <dd className="ots-sayi font-semibold text-ots-ink">{v.calisma}</dd>
          </div>
          <div>
            <dt className="text-ots-faint">Konu</dt>
            <dd className="ots-sayi font-semibold text-ots-ink">{v.konu}</dd>
          </div>
        </dl>
      </Link>
    </li>
  );
}
