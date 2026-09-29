'use client';

/**
 * İlerleme çubuğu — spec §4.8.
 *
 * Ray `line`, dolgu düz durum tokenı (gradyan yok). İlk mount'ta genişlik
 * 0'dan değere 600 ms `easeOut` ile gelir; azaltılmış hareket tercihinde anında.
 * `motion` yalnızca `width` animasyonu için kullanıldığından `Parcalar.tsx`
 * sunucu bileşeni kalabilsin diye bu dosya ayrı bir istemci modülüdür.
 */

import { motion, useReducedMotion } from 'motion/react';

import type { DurumBandi } from '@/lib/ots/hesap';

const DOLGULAR: Record<DurumBandi['renk'], string> = {
  yesil: 'bg-ots-yesil',
  sari: 'bg-ots-gold',
  turuncu: 'bg-ots-turuncu',
  kirmizi: 'bg-ots-kirmizi',
};

export function Ilerleme({
  yuzde,
  renk = 'yesil',
  yuzdeGoster = false,
  etiket,
  className = '',
}: {
  yuzde: number;
  renk?: DurumBandi['renk'];
  /** Yüzde metnini çubuğun sağında gösterir (`ots-sayi text-[13px] font-semibold`). */
  yuzdeGoster?: boolean;
  /** Ekran okuyucu için çubuğun neyi ölçtüğü — "Haftalık uyum" gibi. */
  etiket?: string;
  className?: string;
}) {
  const azalt = useReducedMotion();
  const genislik = Math.max(0, Math.min(100, Number.isFinite(yuzde) ? yuzde : 0));
  const yuvarlak = Math.round(genislik);

  const ray = (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-ots-line ${yuzdeGoster ? 'min-w-0 flex-1' : className}`}
      role="progressbar"
      aria-label={etiket}
      aria-valuenow={yuvarlak}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`%${yuvarlak}`}
    >
      <motion.div
        className={`h-full rounded-full ${DOLGULAR[renk]}`}
        initial={{ width: 0 }}
        animate={{ width: `${genislik}%` }}
        transition={{ duration: azalt ? 0 : 0.6, ease: 'easeOut' }}
      />
    </div>
  );

  if (!yuzdeGoster) return ray;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {ray}
      <span className="ots-sayi shrink-0 text-[13px] font-semibold text-ots-ink">
        %{yuvarlak}
      </span>
    </div>
  );
}
