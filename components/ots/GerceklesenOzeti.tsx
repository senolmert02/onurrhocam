import { MessageSquareText } from 'lucide-react';

import type { GorevSatiri } from '@/lib/ots/sorgular/temel';
import { sureBicimle } from '@/lib/ots/tarih';

type Gerceklesen = NonNullable<GorevSatiri['gerceklesen']>;

/**
 * Öğrencinin bir görev için girdiği sonuç — koç ekranlarında tek biçim.
 *
 * Gün özeti ve görev düzenleme penceresi bunu kullanır; öğrencinin kendi
 * kartındaki satırla aynı bilgiyi (soru, doğru, yanlış, boş, süre, not) taşır.
 * Doğru oranı yanlışa göre hesaplanır (boşlar hariç), rapordaki oranla aynı.
 */
export function GerceklesenOzeti({ g, baslik = true }: { g: Gerceklesen; baslik?: boolean }) {
  const cevaplanan = g.dogru + g.yanlis;
  const kalemler: [string, string | number][] = [
    ['Soru', g.soru],
    ['Doğru', g.dogru],
    ['Yanlış', g.yanlis],
    ['Boş', g.bos],
    ['Süre', sureBicimle(g.sure)],
  ];
  if (cevaplanan > 0) kalemler.push(['Doğru oranı', `%${Math.round((g.dogru / cevaplanan) * 100)}`]);

  return (
    <div className="rounded-xl border border-ots-yesil/30 bg-ots-yesil-tint px-3.5 py-3">
      {baslik && <p className="mb-2 text-[12px] font-semibold text-ots-yesil">Öğrencinin girdiği</p>}
      <dl className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
        {kalemler.map(([etiket, deger]) => (
          <div key={etiket} className="flex items-baseline gap-1">
            <dt className="text-ots-soft">{etiket}</dt>
            <dd className="ots-sayi font-semibold text-ots-ink">{deger}</dd>
          </div>
        ))}
      </dl>
      {g.notMetni && (
        <p className="mt-2 flex items-start gap-1.5 text-[13px] leading-snug text-ots-soft">
          <MessageSquareText size={14} strokeWidth={2} aria-hidden className="mt-0.5 shrink-0" />
          <span>
            <span className="sr-only">Öğrencinin notu: </span>“{g.notMetni}”
          </span>
        </p>
      )}
    </div>
  );
}
