'use client';

import { CalendarX2, CheckCircle2, Loader2, MessageSquareText, Pencil, Plus, Printer } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';
import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from 'react';

import { programNotuKaydet } from '@/lib/ots/actions/rapor';
import { GOREV_DURUM_ETIKETLERI, type GorevDurumu } from '@/lib/ots/sabitler';
import type { HaftaGunu } from '@/lib/ots/sorgular/ekran';
import type { GorevSatiri } from '@/lib/ots/sorgular/temel';
import { bugun as bugunuAl, sureBicimle } from '@/lib/ots/tarih';

import { GIRDI } from '../Alan';
import { GerceklesenOzeti } from '../GerceklesenOzeti';
import { GorevKarti } from '../GorevKarti';
import { Modal } from '../Modal';
import {
  Bos,
  DUGME_ALTIN,
  DUGME_HAYALET,
  DUGME_IKON,
  DUGME_SESSIZ,
  ODAK_HALKASI,
  Rozet,
  type RozetTonu,
} from '../Parcalar';
import { GOREV_EKLE_DUGMESI, GorevModali } from './GorevFormu';

/* ------------------------------------------------------------------ Sabitler */

/** Yapışkan şerit — spec §5.3/§5.4 (backdrop-blur yok). */
const YAPISKAN_SERIT =
  'sticky top-0 z-10 -mx-4 bg-ots-bg/95 px-4 py-2 yazdirma-disi sm:-mx-6 sm:px-6';

/** Gün çipi kısa adı (≤3 harf). */
const KISA_GUN: Record<string, string> = {
  Pazartesi: 'Pzt',
  Salı: 'Sal',
  Çarşamba: 'Çar',
  Perşembe: 'Per',
  Cuma: 'Cum',
  Cumartesi: 'Cmt',
  Pazar: 'Paz',
};

const AY_KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

/** Not kartının şeritteki ve listedeki anahtarı. */
const NOT_ANAHTARI = 'not';

/** `2026-09-29` → `29 Eyl` (ICU'ya bağlı değil; sunucu ve istemci aynı çıktıyı verir). */
function kisaTarih(anahtar: string): string {
  const [, ay, gun] = anahtar.split('-').map(Number);
  if (!ay || !gun) return anahtar;
  return `${gun} ${AY_KISA[ay - 1] ?? ''}`.trim();
}

/** Gün kartı başlığı — "Pazartesi · 29 Eyl". */
function gunBasligi(gun: HaftaGunu): string {
  return `${gun.gunAdi} · ${kisaTarih(gun.tarih)}`;
}

function gorevDurumTonu(durum: string): RozetTonu {
  if (durum === 'tamamlandi') return 'yesil';
  if (durum === 'yapilmadi') return 'kirmizi';
  return 'notr';
}

function gorevDurumEtiketi(durum: string): string {
  return GOREV_DURUM_ETIKETLERI[durum as GorevDurumu] ?? 'Bekliyor';
}

/** Günün gerçekleşen toplamları — yalnızca tamamlanan görevlerden. */
function gunToplamlari(gun: HaftaGunu) {
  let soru = 0;
  let sure = 0;
  for (const g of gun.gorevler) {
    if (g.durum !== 'tamamlandi' || !g.gerceklesen) continue;
    soru += g.gerceklesen.soru;
    sure += g.gerceklesen.sure;
  }
  return { soru, sure };
}

/** `useSyncExternalStore` için boş abonelik — istemci saati yalnızca ilk okumada lazım. */
const bosAbone = () => () => {};
const istemciBugunu = () => bugunuAl();
const sunucuBugunu = () => null;

/* ------------------------------------------------------------------- Bileşen */

/**
 * Haftalık ders programı — basılı şablonun ekran karşılığı (spec §5.4).
 *
 * - **lg+:** PDF'teki gibi 4 sütun × 2 satır; Pazartesi–Perşembe üstte,
 *   Cuma–Pazar + NOT altta. Şablon başlığı görünür.
 * - **lg altı:** yapışkan gün şeridi (8 çip) + bugün odaklı dikey gün kartları.
 *   Şerit, `IntersectionObserver` ile ekranın ortasındaki günü işaretler.
 *
 * Tek DOM, iki düzen: hücreler her iki kırılımda aynı elemanlar; yalnızca
 * sınıflar değişir. Böylece yazdırma CSS'i (`yazdir-*`) telefon dahil her
 * cihazdan aynı A4 yatay çıktıyı verir.
 *
 * Bir güne dokununca **gün modalı** açılır: öğrenci görevlerini burada
 * tamamlar (`GorevKarti`), koç günün özetini görür ve düzenlemeye geçer.
 *
 * PDF için kütüphane yok — `window.print()` ve yazdırma CSS'i yeterli.
 */
export function HaftaIzgarasi({
  ogrenciId,
  ogrenciAdi,
  araligTr,
  haftaBaslangic,
  gunler,
  dersler,
  notMetni,
  saltOkunur = false,
  seritUstu,
  ustIcerik,
  bugun,
}: {
  ogrenciId: string;
  ogrenciAdi: string;
  araligTr: string;
  haftaBaslangic: string;
  gunler: HaftaGunu[];
  dersler: readonly string[];
  notMetni?: string;
  /** Öğrenci görünümü: ekleme, düzenleme ve not yazma kapalı. */
  saltOkunur?: boolean;
  /**
   * Yapışkan şeridin üstüne yerleşen içerik (öğrenci seçici, hafta gezgini).
   * Sayfada tek yapışkan blok olsun diye burada taşınır (spec §5.3).
   */
  seritUstu?: React.ReactNode;
  /** Şeritle ızgara arasına giren, yazdırılmayan içerik (uyum özeti gibi). */
  ustIcerik?: React.ReactNode;
  /**
   * Sunucudaki "bugün" (`YYYY-MM-DD`) — "geçti" rozeti buna göre. Sayfalar
   * sunucudan geçirmeli; verilmezse bu haftadaki `bugunMu` günü, o da yoksa
   * hydration sonrası istemci saati kullanılır (SSR'da rozet basılmaz).
   */
  bugun?: string;
}) {
  const azalt = useReducedMotion() === true;

  // Görev modalı: hedef (tarih + varsa görev) kapanış animasyonu boyunca kalır;
  // her açılışta `acilis` artar → GorevModali sıfırdan kurulur (useActionState).
  const [gorevHedefi, setGorevHedefi] = useState<{ tarih: string; gorev?: GorevSatiri } | null>(
    null,
  );
  const [gorevAcik, setGorevAcik] = useState(false);
  const [acilis, setAcilis] = useState(0);

  // Gün modalı: `acikGun` açık/kapalı + hangi gün; `sonGun` kapanış animasyonu
  // boyunca içeriği tutar (kapanırken boş modal görünmesin).
  const [acikGun, setAcikGun] = useState<HaftaGunu | null>(null);
  const [sonGun, setSonGun] = useState<HaftaGunu | null>(null);

  function gunuAc(gun: HaftaGunu) {
    setSonGun(gun);
    setAcikGun(gun);
  }

  // Şeritte işaretli (ekranın ortasındaki) gün
  const [gorunenGun, setGorunenGun] = useState<string | null>(null);

  const kapRef = useRef<HTMLDivElement>(null);
  const seritRef = useRef<HTMLDivElement>(null);
  const cipSeridiRef = useRef<HTMLDivElement>(null);

  // Bu haftadaysak bugünün anahtarı var; yoksa mount'ta odak kaydırması yapılmaz
  const bugunTarih = gunler.find((g) => g.bugunMu)?.tarih ?? null;
  // "Bugün" sunucudan gelir; istemci saati yalnızca son çare ve SSR'da null
  // (sunucu/istemci farklı gün üretip hydration uyuşmazlığı çıkmasın).
  const istemciBugun = useSyncExternalStore(bosAbone, istemciBugunu, sunucuBugunu);
  const bugunAnahtari = bugun ?? bugunTarih ?? istemciBugun;

  function gorevEkleAc(tarih: string) {
    setGorevHedefi({ tarih });
    setAcilis((s) => s + 1);
    setGorevAcik(true);
  }

  function gorevDuzenleAc(gorev: GorevSatiri) {
    setGorevHedefi({ tarih: gorev.tarih, gorev });
    setAcilis((s) => s + 1);
    setGorevAcik(true);
  }

  /* Yapışkan şerit yüksekliği → kartların `scroll-margin-top`u. Şeridin
     üstünde öğrenci seçici ve gezgin de olabildiği için sabit 64px yetmez. */
  useEffect(() => {
    const serit = seritRef.current;
    const kap = kapRef.current;
    if (!serit || !kap) return;
    const olc = () => kap.style.setProperty('--serit', `${serit.offsetHeight}px`);
    olc();
    const ro = new ResizeObserver(olc);
    ro.observe(serit);
    return () => ro.disconnect();
  }, []);

  /* Bugün odağı: bu haftadaysak, lg altında mount'ta bugünün kartına atla. */
  useEffect(() => {
    if (!bugunTarih) return;
    if (window.matchMedia('(min-width:1024px)').matches) return;
    document
      .getElementById(`gun-${bugunTarih}`)
      ?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [bugunTarih]);

  /* Ekranın ortasındaki gün → şeritte işaretli çip (spec §5.4/1). */
  useEffect(() => {
    const kap = kapRef.current;
    if (!kap) return;
    const kartlar = kap.querySelectorAll<HTMLElement>('[data-gun]');
    const io = new IntersectionObserver(
      (girdiler) => {
        for (const g of girdiler) {
          if (!g.isIntersecting) continue;
          const tarih = (g.target as HTMLElement).dataset.gun;
          if (tarih) setGorunenGun(tarih);
        }
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 },
    );
    kartlar.forEach((k) => io.observe(k));
    return () => io.disconnect();
  }, [gunler]);

  /* İşaretli çip şeridin görünür kısmına gelsin — yalnızca şerit kayar, sayfa değil. */
  useEffect(() => {
    const serit = cipSeridiRef.current;
    if (!serit || !gorunenGun) return;
    const cip = serit.querySelector<HTMLElement>(`[data-cip="${gorunenGun}"]`);
    if (!cip) return;
    const hedef = cip.offsetLeft - (serit.clientWidth - cip.offsetWidth) / 2;
    serit.scrollTo({ left: Math.max(0, hedef), behavior: azalt ? 'auto' : 'smooth' });
  }, [gorunenGun, azalt]);

  function karaGit(anahtar: string) {
    document
      .getElementById(`gun-${anahtar}`)
      ?.scrollIntoView({ block: 'start', behavior: azalt ? 'auto' : 'smooth' });
  }

  // Gün modalında gösterilen gün — sunucu yeniden çizince taze veriyi al
  const modalGunu = acikGun ?? sonGun;
  const gosterilenGun = modalGunu
    ? (gunler.find((g) => g.tarih === modalGunu.tarih) ?? modalGunu)
    : null;

  const gorevGunu = gorevHedefi ? gunler.find((g) => g.tarih === gorevHedefi.tarih) : undefined;
  const gorevTarihBasligi = gorevGunu ? gunBasligi(gorevGunu) : gorevHedefi?.tarih;

  const yazdir = () => window.print();

  return (
    <div ref={kapRef} className="flex flex-col gap-4">
      {/* Yapışkan blok: (öğrenci seçici + gezgin) + gün şeridi. lg+'da şerit yok;
          üst içerik yoksa blok tamamen gizlenir. */}
      <div
        ref={seritRef}
        className={`${YAPISKAN_SERIT} flex flex-col gap-2 ${
          seritUstu ? 'lg:static lg:mx-0 lg:bg-transparent lg:p-0' : 'lg:hidden'
        }`}
      >
        {seritUstu}

        <div
          ref={cipSeridiRef}
          role="group"
          aria-label="Günler"
          className="relative flex gap-2 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] lg:hidden"
        >
          {gunler.map((gun) => (
            <GunCipi
              key={gun.tarih}
              anahtar={gun.tarih}
              etiket={KISA_GUN[gun.gunAdi] ?? gun.gunAdi.slice(0, 3)}
              tamAd={gun.gunAdi}
              bugunMu={gun.bugunMu}
              gorunen={gorunenGun === gun.tarih}
              tamamlanan={gun.tamamlanan}
              toplam={gun.toplam}
              onClick={() => karaGit(gun.tarih)}
            />
          ))}
          <GunCipi
            anahtar={NOT_ANAHTARI}
            etiket="Not"
            tamAd="Haftanın notu"
            bugunMu={false}
            gorunen={gorunenGun === NOT_ANAHTARI}
            tamamlanan={0}
            toplam={0}
            onClick={() => karaGit(NOT_ANAHTARI)}
          />
        </div>
      </div>

      {ustIcerik && <div className="yazdirma-disi">{ustIcerik}</div>}

      {/* lg altı: PDF indir sayfa başında, tam genişlik */}
      <button type="button" onClick={yazdir} className={`${DUGME_SESSIZ} yazdirma-disi w-full lg:hidden`}>
        <Printer size={18} strokeWidth={2} aria-hidden />
        PDF indir
      </button>

      <div className="yazdir-alani">
        {/* Şablon başlığı — basılı formun aynısı; ekranda lg+, çıktıda her cihazda */}
        <div className="mb-4 hidden grid-cols-3 items-center gap-4 border-b border-ots-line pb-4 lg:grid print:grid!">
          <p className="font-display text-[22px] font-bold leading-tight tracking-[-0.02em] text-ots-ink">
            Haftalık
            <br />
            Ders Programı
          </p>

          <div className="flex flex-col items-center">
            <Image
              src="/logo.jpg"
              alt=""
              width={72}
              height={72}
              loading="eager"
              className="yazdir-logo h-16 w-16 rounded-full object-cover"
            />
            <p className="mt-1 text-[12px] font-semibold text-ots-soft">Onur Akbağ</p>
            <p className="text-[11px] text-ots-faint">Eğitim ve Yaşam Koçu</p>
          </div>

          <div className="justify-self-end">
            <dl className="text-[14px]">
              <div className="flex gap-2">
                <dt className="text-ots-faint">Ad Soyad:</dt>
                <dd className="min-w-[150px] border-b border-ots-line font-semibold text-ots-ink">
                  {ogrenciAdi}
                </dd>
              </div>
              <div className="mt-1.5 flex gap-2">
                <dt className="text-ots-faint">Tarih:</dt>
                <dd className="min-w-[150px] border-b border-ots-line text-ots-soft">{araligTr}</dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={yazdir}
              className={`${DUGME_SESSIZ} yazdirma-disi mt-3 w-full`}
            >
              <Printer size={18} strokeWidth={2} aria-hidden />
              PDF indir
            </button>
          </div>
        </div>

        {/* 4 × 2 ızgara (lg+) / dikey gün kartları (lg altı) */}
        <div className="yazdir-izgara flex flex-col gap-3 lg:grid lg:grid-cols-4">
          {gunler.map((gun) => (
            <GunKutusu
              key={gun.tarih}
              gun={gun}
              gecmis={bugunAnahtari !== null && gun.tarih < bugunAnahtari}
              saltOkunur={saltOkunur}
              gunuAc={() => gunuAc(gun)}
              gorevEkle={() => gorevEkleAc(gun.tarih)}
              gorevDuzenle={gorevDuzenleAc}
            />
          ))}

          {/* Sekizinci kutu: NOT — koç buraya yazıyor, hafta başına kaydediliyor */}
          <NotKutusu
            ogrenciId={ogrenciId}
            hafta={haftaBaslangic}
            baslangicMetni={notMetni ?? ''}
            saltOkunur={saltOkunur}
          />
        </div>

        <p className="mt-3 text-right text-[11px] italic text-ots-faint">Eğitim Koçu — Onur Akbağ</p>
      </div>

      {/* Gün modalı */}
      <GunModali
        gun={gosterilenGun}
        acik={acikGun !== null}
        kapat={() => setAcikGun(null)}
        saltOkunur={saltOkunur}
        gorevEkle={(tarih) => {
          setAcikGun(null);
          gorevEkleAc(tarih);
        }}
        gorevDuzenle={(gorev) => {
          setAcikGun(null);
          gorevDuzenleAc(gorev);
        }}
      />

      {/* Görev ekle / düzenle modalı (yalnızca koç) */}
      {!saltOkunur && gorevHedefi && (
        <GorevModali
          key={acilis}
          acik={gorevAcik}
          kapat={() => setGorevAcik(false)}
          ogrenciId={ogrenciId}
          tarih={gorevHedefi.tarih}
          tarihBasligi={gorevTarihBasligi}
          dersler={dersler}
          gorev={gorevHedefi.gorev}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Gün çipi */

function GunCipi({
  anahtar,
  etiket,
  tamAd,
  bugunMu,
  gorunen,
  tamamlanan,
  toplam,
  onClick,
}: {
  anahtar: string;
  etiket: string;
  tamAd: string;
  bugunMu: boolean;
  gorunen: boolean;
  tamamlanan: number;
  toplam: number;
  onClick: () => void;
}) {
  const tamam = toplam > 0 && tamamlanan === toplam;
  const kismi = toplam > 0 && !tamam;

  const durumMetni = toplam === 0 ? '' : `, ${tamamlanan}/${toplam} görev tamamlandı`;

  return (
    <button
      type="button"
      data-cip={anahtar}
      onClick={onClick}
      aria-label={`${tamAd}${bugunMu ? ', bugün' : ''}${durumMetni}`}
      aria-current={gorunen ? 'true' : undefined}
      className={`relative flex h-11 lg:h-9 min-w-11 shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold select-none touch-manipulation transition-[background-color,border-color,color] duration-150 ease-[var(--ease-ots)] ${ODAK_HALKASI} ${
        bugunMu
          ? `bg-ots-panel text-ots-gold-bright ${gorunen ? 'border-ots-gold-deep' : 'border-ots-panel'}`
          : gorunen
            ? 'border-ots-gold-deep bg-ots-surface text-ots-ink'
            : 'border-ots-line-strong bg-ots-surface text-ots-soft'
      }`}
    >
      {etiket}
      {tamam && (
        <CheckCircle2 size={14} strokeWidth={2.25} aria-hidden className="text-ots-yesil" />
      )}
      {kismi && (
        <span aria-hidden className="ots-sayi text-[11px] font-medium text-ots-faint">
          {tamamlanan}/{toplam}
        </span>
      )}
      {gorunen && (
        <motion.span
          layoutId="gun-aktif"
          aria-hidden
          className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-ots-gold"
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        />
      )}
    </button>
  );
}

/* ---------------------------------------------------------------- Gün kutusu */

/**
 * Bir günün kutusu — lg+'da ızgara hücresi, lg altında dikey liste kartı.
 * Başlık satırı ve boş alan gün modalını açar; görev satırı koçta doğrudan
 * düzenlemeye, öğrencide gün modalına gider.
 */
function GunKutusu({
  gun,
  gecmis,
  saltOkunur,
  gunuAc,
  gorevEkle,
  gorevDuzenle,
}: {
  gun: HaftaGunu;
  gecmis: boolean;
  saltOkunur: boolean;
  gunuAc: () => void;
  gorevEkle: () => void;
  gorevDuzenle: (gorev: GorevSatiri) => void;
}) {
  const tamam = gun.toplam > 0 && gun.tamamlanan === gun.toplam;
  const durumOzeti =
    gun.toplam === 0 ? 'görev yok' : `${gun.tamamlanan}/${gun.toplam} görev tamamlandı`;
  // "Bugün" yalnızca zemin rengiyle taşınmasın (spec §9/6) — AT için metin
  const bugunEki = gun.bugunMu ? ', bugün' : '';

  return (
    <section
      id={`gun-${gun.tarih}`}
      data-gun={gun.tarih}
      aria-label={`${gunBasligi(gun)}${bugunEki}`}
      className={`yazdir-hucre group relative flex flex-col rounded-2xl border p-4 shadow-ots scroll-mt-[calc(var(--serit,64px)+8px)] lg:min-h-[200px] lg:p-3.5 lg:scroll-mt-0 ${
        gun.bugunMu ? 'border-ots-gold-deep/40 bg-ots-gold-tint' : 'border-ots-line bg-ots-surface'
      }`}
    >
      {/* Başlık satırı — tamamı düğme: gün modalını açar */}
      <div className="mb-2 border-b border-ots-line pb-1.5 print:mb-0 print:pb-0">
        <button
          type="button"
          onClick={gunuAc}
          aria-label={`${gun.gunAdi} ${kisaTarih(gun.tarih)}${bugunEki} gününü aç, ${durumOzeti}${
            gecmis && !tamam && gun.toplam > 0 ? ', geçti' : ''
          }`}
          className={`-mx-1 flex min-h-11 lg:min-h-9 w-[calc(100%+0.5rem)] items-center justify-between gap-2 rounded-[10px] px-1 text-left transition-colors duration-150 hover:bg-ots-raised print:min-h-0 ${ODAK_HALKASI}`}
        >
          <span className="font-display text-[16px] font-bold tracking-[-0.01em] text-ots-ink lg:text-[14px] print:text-[10pt]">
            {gun.gunAdi}
            <span className="ots-sayi ml-1.5 font-sans text-[13px] font-medium text-ots-faint lg:text-[12px] print:text-[8.5pt]">
              {kisaTarih(gun.tarih)}
              {/* Görsel metin eşdeğeri; çıktı her gün aynı kalsın diye basılmaz */}
              {gun.bugunMu && (
                <span className="yazdirma-disi font-semibold text-ots-gold-ink"> · Bugün</span>
              )}
            </span>
          </span>
          {gun.toplam > 0 && (
            <Rozet ton={tamam ? 'yesil' : 'notr'} className="ots-sayi shrink-0">
              {gun.tamamlanan}/{gun.toplam}
              {gecmis && !tamam ? ' · geçti' : ''}
            </Rozet>
          )}
        </button>
      </div>

      {gun.gorevler.length === 0 ? (
        /* Boş gün: alan tümüyle dokunulabilir; klavye/okuyucu için başlık yeter */
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={gunuAc}
          className="yazdirma-disi flex min-h-11 lg:min-h-9 flex-1 items-start rounded-[10px] text-left text-[13px] text-ots-faint"
        >
          Görev yok
        </button>
      ) : (
        <ul className="flex flex-1 flex-col divide-y divide-ots-line">
          {gun.gorevler.map((gorev) => (
            <GorevSatir
              key={gorev.id}
              gorev={gorev}
              onClick={
                saltOkunur || gorev.durum === 'tamamlandi' ? gunuAc : () => gorevDuzenle(gorev)
              }
              eylem={
                saltOkunur
                  ? `${gun.gunAdi} gününü aç`
                  : gorev.durum === 'tamamlandi'
                    ? 'öğrencinin sonucunu gör'
                    : 'düzenle'
              }
            />
          ))}
        </ul>
      )}

      {/* lg+'da görev listesinin altında kalan boşluk da günü açar */}
      {gun.gorevler.length > 0 && (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={gunuAc}
          className="yazdirma-disi hidden min-h-3 flex-1 lg:block"
        />
      )}

      {!saltOkunur && (
        <button
          type="button"
          onClick={gorevEkle}
          className={`${GOREV_EKLE_DUGMESI} mt-2 lg:opacity-60 lg:group-hover:opacity-100 lg:focus-visible:opacity-100`}
        >
          <Plus size={16} strokeWidth={2} aria-hidden />
          Görev ekle
        </button>
      )}
    </section>
  );
}

/**
 * Hücredeki tek görev satırı — tamamı dokunulabilir (min-h-12).
 * aria-label yok: erişilebilir ad = ders · konu · meta + (sr-only) durum ve eylem.
 */
function GorevSatir({
  gorev,
  onClick,
  eylem,
}: {
  gorev: GorevSatiri;
  onClick: () => void;
  /** Ekran okuyucuya adın sonunda duyurulan eylem ("düzenle", "Pazartesi gününü aç"). */
  eylem: string;
}) {
  const tamamlandi = gorev.durum === 'tamamlandi';
  const meta = [
    gorev.baslangicSaati?.slice(0, 5),
    gorev.hedefSoru > 0 ? `${gorev.hedefSoru} soru` : '',
    gorev.hedefSure > 0 ? sureBicimle(gorev.hedefSure) : '',
  ].filter(Boolean);

  return (
    <li className="yazdir-gorev">
      <button
        type="button"
        onClick={onClick}
        className={`-mx-1 flex min-h-12 lg:min-h-10 w-[calc(100%+0.5rem)] items-center gap-3 rounded-[10px] px-1 py-2.5 text-left text-[14px] leading-snug transition-colors duration-150 hover:bg-ots-raised active:bg-ots-raised lg:text-[13px] print:min-h-0 print:py-0 print:text-[8.5pt] ${ODAK_HALKASI}`}
      >
        <span className="min-w-0 flex-1">
          <span className={`block ${tamamlandi ? 'text-ots-soft' : 'text-ots-ink'}`}>
            <span className="font-semibold">{gorev.ders}</span>
            {gorev.konu && <span className="text-ots-soft"> · {gorev.konu}</span>}
          </span>
          {meta.length > 0 && (
            <span className="ots-sayi mt-0.5 block text-[12px] text-ots-faint print:text-[8pt]">
              {tamamlandi && gorev.gerceklesen && <span className="print:hidden">Hedef: </span>}
              {meta.join(' · ')}
            </span>
          )}
          {/* Öğrencinin girdiği sonuç — koç ızgaraya bakınca görür; PDF'e girmez */}
          {tamamlandi && gorev.gerceklesen && (
            <span className="ots-sayi mt-0.5 flex flex-wrap items-center gap-x-1 text-[12px] font-medium text-ots-yesil print:hidden">
              <span>
                Yapılan: {gorev.gerceklesen.soru} soru · D {gorev.gerceklesen.dogru} · Y{' '}
                {gorev.gerceklesen.yanlis} · B {gorev.gerceklesen.bos} ·{' '}
                {sureBicimle(gorev.gerceklesen.sure)}
              </span>
              {gorev.gerceklesen.notMetni && (
                <MessageSquareText size={13} strokeWidth={2} aria-label="Öğrenci not bıraktı" className="shrink-0" />
              )}
            </span>
          )}
        </span>
        <span className="sr-only">
          {tamamlandi ? ', tamamlandı' : ''}, {eylem}
        </span>
        {tamamlandi && (
          <CheckCircle2
            size={16}
            strokeWidth={2.25}
            aria-hidden
            className="shrink-0 text-ots-yesil"
          />
        )}
      </button>
    </li>
  );
}

/* ---------------------------------------------------------------- Gün modalı */

/**
 * Bir günün modalı. Öğrenci görevlerini burada tamamlar (`GorevKarti`), koç
 * günün özetini görür ve düzenlemeye geçer. Kapalıyken DOM'da yok — yazdırmayı
 * etkilemez.
 */
function GunModali({
  gun,
  acik,
  kapat,
  saltOkunur,
  gorevEkle,
  gorevDuzenle,
}: {
  gun: HaftaGunu | null;
  acik: boolean;
  kapat: () => void;
  saltOkunur: boolean;
  gorevEkle: (tarih: string) => void;
  gorevDuzenle: (gorev: GorevSatiri) => void;
}) {
  if (!gun) return null;

  const { soru, sure } = gunToplamlari(gun);
  const altBaslik = `${gun.tamamlanan}/${gun.toplam} görev tamamlandı · ${soru} soru · ${sureBicimle(sure)}`;

  return (
    <Modal
      acik={acik}
      kapat={kapat}
      baslik={gunBasligi(gun)}
      altBaslik={altBaslik}
      genislik="max-w-2xl"
      eylemler={
        saltOkunur ? undefined : (
          <button
            type="button"
            onClick={() => gorevEkle(gun.tarih)}
            className={`${DUGME_ALTIN} h-12 lg:h-10 w-full sm:h-11 sm:w-auto`}
          >
            <Plus size={18} strokeWidth={2.25} aria-hidden />
            Bu güne görev ekle
          </button>
        )
      }
    >
      {gun.gorevler.length === 0 ? (
        <Bos
          baslik="Bu güne görev yok"
          aciklama={saltOkunur ? 'Koçun program atadığında burada görünecek.' : undefined}
          ikon={CalendarX2}
        />
      ) : saltOkunur ? (
        <ul className="flex flex-col gap-3">
          {gun.gorevler.map((gorev) => (
            <GorevKarti key={gorev.id} gorev={gorev} />
          ))}
        </ul>
      ) : (
        <KocGunOzeti gun={gun} soru={soru} sure={sure} gorevDuzenle={gorevDuzenle} />
      )}
    </Modal>
  );
}

/** Koç modu: 3 sayaç + görev listesi. */
function KocGunOzeti({
  gun,
  soru,
  sure,
  gorevDuzenle,
}: {
  gun: HaftaGunu;
  soru: number;
  sure: number;
  gorevDuzenle: (gorev: GorevSatiri) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Mobilde 2 sütun; uzun süre değeri tam satır alır (3 sütunda 75px'e sarıyordu) */}
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 [&>:last-child]:col-span-2 md:[&>:last-child]:col-span-1">
        <MiniSayac etiket="Tamamlanan" deger={`${gun.tamamlanan}/${gun.toplam}`} />
        <MiniSayac etiket="Çözülen soru" deger={soru} />
        <MiniSayac etiket="Süre" deger={sureBicimle(sure)} />
      </dl>

      <ul className="divide-y divide-ots-line">
        {gun.gorevler.map((gorev) => {
          const g = gorev.gerceklesen;
          const hedef = [
            gorev.hedefSoru > 0 ? `hedef ${gorev.hedefSoru} soru` : '',
            gorev.hedefSure > 0 ? sureBicimle(gorev.hedefSure) : '',
          ]
            .filter(Boolean)
            .join(' · ');

          return (
            <li key={gorev.id} className="flex min-h-14 lg:min-h-12 items-start gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[15px] font-semibold leading-snug text-ots-ink">
                    {gorev.ders}
                    {gorev.konu && <span className="font-normal text-ots-soft"> · {gorev.konu}</span>}
                    {gorev.altKonu && (
                      <span className="font-normal text-ots-faint"> · {gorev.altKonu}</span>
                    )}
                  </p>
                  <Rozet ton={gorevDurumTonu(gorev.durum)}>{gorevDurumEtiketi(gorev.durum)}</Rozet>
                </div>

                {g && (
                  <div className="mt-2">
                    <GerceklesenOzeti g={g} baslik={false} />
                  </div>
                )}
                {hedef && <p className="mt-1 text-[12px] text-ots-faint">{hedef}</p>}
              </div>

              <button
                type="button"
                onClick={() => gorevDuzenle(gorev)}
                aria-label={`${gorev.ders} görevini düzenle`}
                className={DUGME_IKON}
              >
                <Pencil size={18} strokeWidth={2} aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MiniSayac({ etiket, deger }: { etiket: string; deger: string | number }) {
  return (
    <div className="rounded-2xl border border-ots-line bg-ots-raised p-3">
      <dt className="text-[12px] font-medium text-ots-faint">{etiket}</dt>
      <dd className="ots-sayi mt-1.5 font-display text-[22px] font-bold leading-none text-ots-ink">
        {deger}
      </dd>
    </div>
  );
}

/* ---------------------------------------------------------------- NOT kutusu */

/**
 * Basılı şablonun NOT kutusu — koç buraya yazıyor.
 *
 * Kaydetme odaktan çıkınca (blur) otomatik; metin değiştiyse ayrıca "Kaydet"
 * düğmesi beliriyor. Yazarken her tuşta sunucuya gitmiyor. Öğrenci için salt
 * metin: girdi gibi görünmez.
 */
function NotKutusu({
  ogrenciId,
  hafta,
  baslangicMetni,
  saltOkunur,
}: {
  ogrenciId: string;
  hafta: string;
  baslangicMetni: string;
  saltOkunur: boolean;
}) {
  const [metin, setMetin] = useState(baslangicMetni);
  const [kayitli, setKayitli] = useState(baslangicMetni);
  const [hata, setHata] = useState('');
  const [kaydediliyor, basla] = useTransition();

  const degisti = metin !== kayitli;

  function kaydet() {
    if (!degisti) return;
    basla(async () => {
      const sonuc = await programNotuKaydet(ogrenciId, hafta, metin);
      if (sonuc.ok) {
        setKayitli(metin);
        setHata('');
      } else {
        setHata(sonuc.mesaj || 'Not kaydedilemedi.');
      }
    });
  }

  return (
    <section
      id={`gun-${NOT_ANAHTARI}`}
      data-gun={NOT_ANAHTARI}
      aria-label="Haftanın notu"
      className="yazdir-hucre flex flex-col rounded-2xl border border-ots-line bg-ots-surface p-4 shadow-ots scroll-mt-[calc(var(--serit,64px)+8px)] lg:min-h-[200px] lg:p-3.5 lg:scroll-mt-0"
    >
      <div className="mb-2 flex min-h-11 lg:min-h-9 items-center justify-between gap-2 border-b border-ots-line pb-1.5 print:mb-0 print:min-h-0 print:pb-0">
        <h3 className="font-display text-[16px] font-bold tracking-[-0.01em] text-ots-ink lg:text-[14px] print:text-[10pt]">
          Not
        </h3>
        {degisti && !saltOkunur && (
          <button
            type="button"
            onClick={kaydet}
            disabled={kaydediliyor}
            aria-busy={kaydediliyor}
            className={`${DUGME_HAYALET} yazdirma-disi`}
          >
            {kaydediliyor && (
              <Loader2 size={16} strokeWidth={2.25} aria-hidden className="animate-spin" />
            )}
            Kaydet
          </button>
        )}
      </div>

      {saltOkunur ? (
        <p
          className={`yazdir-not flex-1 whitespace-pre-wrap text-[14px] leading-relaxed ${
            metin ? 'text-ots-soft' : 'text-ots-faint'
          }`}
        >
          {/* Boş-durum metni arayüz mesajı — PDF'te NOT kutusu boş kalsın (koç çıktısıyla aynı) */}
          {metin || <span className="yazdirma-disi">Bu haftaya not yazılmamış.</span>}
        </p>
      ) : (
        <>
          <textarea
            value={metin}
            onChange={(olay) => setMetin(olay.target.value)}
            onBlur={kaydet}
            placeholder="Bu haftaya dair not…"
            aria-label="Haftanın notu"
            aria-invalid={hata ? true : undefined}
            className={`${GIRDI} yazdir-not min-h-28 flex-1 resize-y py-3 leading-relaxed print:min-h-0 print:border-0 print:p-0`}
          />
          {hata && (
            <p role="alert" className="yazdirma-disi mt-1.5 text-[13px] font-medium text-ots-kirmizi">
              {hata}
            </p>
          )}
        </>
      )}
    </section>
  );
}
