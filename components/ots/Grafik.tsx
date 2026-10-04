'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';

import { GRAFIK_RENKLERI } from '@/lib/ots/sabitler';

/**
 * Çizgi grafiği — haftalık uyum, soru/süre serileri ve deneme netleri için.
 * Spec §5.4 "Grafik" ve §6 "Grafik çizgisi ilk görünüm".
 *
 * Tasarım kuralları:
 * - Tek y ekseni. Farklı ölçekteki iki ölçü asla aynı grafiğe konmaz; bu yüzden
 *   TYT/AYT/LGS netleri ayrı grafiklerde çizilir (netler farklı ölçekte).
 * - İnce işaretler: 2px çizgi, 8px nokta, geri planda kalan `line` ızgarası.
 * - Renk tek başına kimlik taşımaz: iki ve üzeri seride hem açıklama kutusu
 *   hem de çizgi ucunda doğrudan etiket vardır.
 * - Eksen, değer ve açıklama metinleri `faint`/`soft` tokenını giyer, seri
 *   rengini değil. Ekranda 11px altı metin yok.
 * - Fareyle üzerine gelince ya da dokununca dikey kılavuz ve değer balonu çıkar;
 *   dokunmatikte balon parmak kalkınca 1,5 sn daha kalır.
 * - Çizgi ilk görünümde 600 ms'de çizilir; azaltılmış hareket tercihinde kapalı.
 */

export type Nokta = { etiket: string; deger: number };
export type Seri = { ad: string; noktalar: Nokta[] };

type Ozellikler = {
  seriler: Seri[];
  /** Değerlerin sonuna eklenir: '%', ' net', ' soru' gibi. */
  birim?: string;
  /** Y ekseni sıfırdan başlasın mı? Yüzdelerde evet, netlerde hayır. */
  sifirdanBasla?: boolean;
  yukseklik?: number;
};

const SOL = 36;
const SAG = 12;
const UST = 12;
const ALT = 26;

/** Dokunma bitince balonun ekranda kalma süresi (ms). */
const BALON_BEKLEME = 1500;

/**
 * Ölçülmeden önceki (sunucu) çizim genişliği. Mount'ta gerçek genişlik ölçülür
 * ve çizim o genişlikte yapılır: SVG ölçeklenmez, eksen yazıları her ekranda
 * 11px, yükseklik sabit kalır. Önceden sabit 520 birimlik çizim geniş kartta
 * 2,5 kat büyüyor, yazılar 27px'e, grafik 450px yüksekliğe çıkıyordu.
 */
const VARSAYILAN_GENISLIK = 520;

export function CizgiGrafigi({
  seriler,
  birim = '',
  sifirdanBasla = true,
  yukseklik = 180,
}: Ozellikler) {
  const kimlik = useId();
  const azalt = useReducedMotion() === true;
  const [etkin, setEtkin] = useState<number | null>(null);
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);
  const kap = useRef<HTMLDivElement>(null);
  const [genislik, setGenislik] = useState(VARSAYILAN_GENISLIK);
  const veriVar = seriler.some((s) => s.noktalar.length > 0);

  // Kabın gerçek genişliğini izle (yeniden boyutlanma, sekme değişimi, döndürme).
  useEffect(() => {
    const oge = kap.current;
    if (!oge) return;
    const gozlemci = new ResizeObserver(([girdi]) => {
      const w = Math.round(girdi.contentRect.width);
      if (w > 0) setGenislik(w);
    });
    gozlemci.observe(oge);
    return () => gozlemci.disconnect();
  }, [veriVar]);

  // Bileşen sökülürken bekleyen temizleme zamanlayıcısı iptal edilir.
  useEffect(() => {
    return () => {
      if (zamanlayici.current) clearTimeout(zamanlayici.current);
    };
  }, []);

  const goster = (i: number) => {
    if (zamanlayici.current) {
      clearTimeout(zamanlayici.current);
      zamanlayici.current = null;
    }
    setEtkin(i);
  };

  const gecTemizle = () => {
    if (zamanlayici.current) clearTimeout(zamanlayici.current);
    zamanlayici.current = setTimeout(() => setEtkin(null), BALON_BEKLEME);
  };

  const dolu = seriler.filter((s) => s.noktalar.length > 0);
  if (dolu.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-ots-line-strong/50 bg-ots-raised px-4 py-6 text-center text-[14px] text-ots-faint">
        Henüz grafik çizecek veri yok.
      </p>
    );
  }

  const nokta = Math.max(...dolu.map((s) => s.noktalar.length));
  const tumDegerler = dolu.flatMap((s) => s.noktalar.map((n) => n.deger));

  let enAz = sifirdanBasla ? 0 : Math.min(...tumDegerler);
  let enCok = Math.max(...tumDegerler, sifirdanBasla ? 1 : enAz + 1);
  if (enAz === enCok) enCok = enAz + 1;
  // Uçlara nefes payı
  const pay = (enCok - enAz) * 0.1;
  enAz = sifirdanBasla ? 0 : enAz - pay;
  enCok = enCok + pay;

  const x = (i: number) =>
    nokta === 1 ? SOL + (genislik - SOL - SAG) / 2 : SOL + (i * (genislik - SOL - SAG)) / (nokta - 1);
  const y = (d: number) =>
    UST + (yukseklik - UST - ALT) * (1 - (d - enAz) / (enCok - enAz));

  // Izgara için üç ara değer yeter; daha fazlası gürültü.
  const kilavuzlar = [0, 0.5, 1].map((o) => enAz + (enCok - enAz) * o);
  const etiketler = dolu[0].noktalar.map((n) => n.etiket);
  const hedefGenislik = (genislik - SOL - SAG) / Math.max(nokta - 1, 1);

  // Balon etkin noktanın üstüne oturur; uçlarda kutunun dışına taşmasın diye
  // ilk noktada sola, son noktada sağa yaslanır.
  const balonSol = etkin === null ? 0 : (x(etkin) / genislik) * 100;
  const balonKaydir =
    etkin === null
      ? ''
      : etkin === 0
        ? 'translate-x-0'
        : etkin === nokta - 1
          ? '-translate-x-full'
          : '-translate-x-1/2';

  return (
    <figure className="m-0">
      <div ref={kap} className="relative">
        <svg
          viewBox={`0 0 ${genislik} ${yukseklik}`}
          className="block w-full"
          style={{ height: yukseklik }}
          role="img"
          aria-label={`${dolu.map((s) => s.ad).join(', ')} serileri`}
          onMouseLeave={() => setEtkin(null)}
        >
          {/* Izgara — geri planda, dekoratif `line` tokenı */}
          {kilavuzlar.map((deger, i) => (
            <g key={i}>
              <line
                x1={SOL}
                x2={genislik - SAG}
                y1={y(deger)}
                y2={y(deger)}
                strokeWidth={1}
                className="stroke-ots-line"
              />
              <text
                x={SOL - 6}
                y={y(deger) + 4}
                textAnchor="end"
                className="fill-ots-faint text-[11px]"
              >
                {Math.round(deger)}
              </text>
            </g>
          ))}

          {/* Etkin noktada dikey kılavuz */}
          {etkin !== null && (
            <line
              x1={x(etkin)}
              x2={x(etkin)}
              y1={UST}
              y2={yukseklik - ALT}
              strokeWidth={1}
              className="stroke-ots-line-strong"
            />
          )}

          {/* Seriler */}
          {dolu.map((seri, si) => {
            const renk = GRAFIK_RENKLERI[si % GRAFIK_RENKLERI.length];
            const yol = seri.noktalar
              .map((n, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(n.deger)}`)
              .join(' ');

            return (
              <g key={`${kimlik}-${seri.ad}`}>
                {/* Çizgi ilk görünümde 0→1 çizilir; azaltılmış harekette süre 0 (anında).
                    Başlangıç her iki tercihte AYNI — sunucu tercihi bilmez; farklı
                    `initial` hidrasyon uyumsuzluğu üretiyordu. */}
                <motion.path
                  d={yol}
                  fill="none"
                  stroke={renk}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: azalt ? 0 : 0.6, ease: 'easeOut' }}
                />
                {seri.noktalar.map((n, i) => (
                  <circle
                    key={i}
                    cx={x(i)}
                    cy={y(n.deger)}
                    r={etkin === i ? 5 : 4}
                    fill={renk}
                    // Üst üste binen işaretleri ayıran yüzey halkası
                    stroke="var(--color-ots-surface)"
                    strokeWidth={2}
                  />
                ))}
                {/* Çizgi ucunda doğrudan etiket — kimlik renge bağlı kalmasın */}
                {dolu.length > 1 && (
                  <text
                    x={x(seri.noktalar.length - 1) + 5}
                    y={y(seri.noktalar.at(-1)!.deger) - 7}
                    textAnchor="end"
                    className="fill-ots-soft text-[11px] font-semibold"
                  >
                    {seri.ad}
                  </text>
                )}
              </g>
            );
          })}

          {/* X ekseni etiketleri — kalabalıksa seyreltilir */}
          {etiketler.map((etiket, i) => {
            /* En fazla ~7 etiket sığar; fazlası seyreltilir. Son etiket her
               zaman kalır ki eksenin bittiği tarih görünsün (30 günlük
               görünümde 30 etiket üst üste biniyordu). */
            const adim = Math.max(1, Math.ceil(etiketler.length / 7));
            const atla = i % adim !== 0 && i !== etiketler.length - 1;
            if (atla) return null;
            return (
              <text
                key={i}
                x={x(i)}
                y={yukseklik - 8}
                textAnchor="middle"
                className="fill-ots-faint text-[11px]"
              >
                {etiket}
              </text>
            );
          })}

          {/* Fare/dokunma hedefleri — işaretten geniş; dokunmatikte balon
              parmak kalkınca 1,5 sn daha kalır */}
          {etiketler.map((_, i) => (
            <rect
              key={`h-${i}`}
              x={x(i) - hedefGenislik / 2}
              y={UST}
              width={hedefGenislik}
              height={yukseklik - UST - ALT}
              fill="transparent"
              onMouseEnter={() => goster(i)}
              onTouchStart={() => goster(i)}
              onTouchEnd={gecTemizle}
              onTouchCancel={gecTemizle}
            />
          ))}
        </svg>

        {/* Değer balonu — panel zemini (spec §2.1 panel, §5.4) */}
        {etkin !== null && (
          <div
            role="status"
            style={{ left: `${balonSol}%` }}
            className={`pointer-events-none absolute top-0 ${balonKaydir} rounded-[10px] border border-ots-panel-line bg-ots-panel px-3 py-2 text-[12px] leading-snug text-ots-panel-ink shadow-ots-sheet`}
          >
            <p className="font-semibold">{etiketler[etkin]}</p>
            {dolu.map((seri, si) => {
              const n = seri.noktalar[etkin];
              if (!n) return null;
              return (
                <p key={seri.ad} className="flex items-center gap-1.5 whitespace-nowrap text-ots-panel-soft">
                  <span
                    aria-hidden
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ background: GRAFIK_RENKLERI[si % GRAFIK_RENKLERI.length] }}
                  />
                  {dolu.length > 1 && <span>{seri.ad}:</span>}
                  <span className="ots-sayi font-semibold text-ots-panel-ink">
                    {n.deger}
                    {birim}
                  </span>
                </p>
              );
            })}
          </div>
        )}
      </div>

      {/* Açıklama kutusu — iki ve üzeri seride her zaman */}
      {dolu.length > 1 && (
        <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {dolu.map((seri, si) => (
            <span key={seri.ad} className="flex items-center gap-1.5 text-[12px] text-ots-soft">
              <span
                aria-hidden
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: GRAFIK_RENKLERI[si % GRAFIK_RENKLERI.length] }}
              />
              {seri.ad}
            </span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Yatay çubuk — ders bazlı karşılaştırmalar için.
 * Tek ölçü olduğu için renk kimlik taşımaz; değer her çubukta yazılıdır.
 * Ray `line`, dolgu düz altın tokenı (ray üstünde 5.08 — spec §2.2).
 */
export function CubukListesi({
  satirlar,
  birim = '',
}: {
  satirlar: { etiket: string; deger: number; gosterim?: string }[];
  birim?: string;
}) {
  if (satirlar.length === 0) {
    return <p className="text-[14px] text-ots-faint">Veri yok.</p>;
  }

  const enCok = Math.max(...satirlar.map((s) => s.deger), 1);

  return (
    <ul className="flex flex-col gap-2.5">
      {satirlar.map((satir) => (
        <li key={satir.etiket} className="flex min-h-6 items-center gap-3">
          <span className="w-24 shrink-0 truncate text-[13px] text-ots-soft" title={satir.etiket}>
            {satir.etiket}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-ots-line">
            <div
              className="h-full rounded-full bg-ots-gold"
              style={{ width: `${(satir.deger / enCok) * 100}%` }}
            />
          </div>
          <span className="ots-sayi min-w-14 shrink-0 whitespace-nowrap text-right text-[13px] font-semibold text-ots-ink">
            {satir.gosterim ?? `${satir.deger}${birim}`}
          </span>
        </li>
      ))}
    </ul>
  );
}
