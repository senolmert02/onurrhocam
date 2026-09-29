'use client';

import { CircleAlert, Loader2 } from 'lucide-react';
import { useEffect, useTransition } from 'react';
import { toast } from 'sonner';

import { useFormGonder } from '@/components/ots/hooks/useFormGonder';

import {
  ayarlariKaydet,
  ayarlariVarsayilanaDondur,
} from '@/lib/ots/actions/rapor';
import { BOS_DURUM } from '@/lib/ots/dogrulama';

import { Bildirim, GIRDI, GonderDugmesi } from '../Alan';
import { DUGME_SESSIZ, Rozet } from '../Parcalar';

export type AyarAlani = {
  anahtar: string;
  etiket: string;
  enAz: number;
  enCok: number;
  deger: number;
  varsayilan: number;
};

/**
 * Uyarı eşikleri formu — spec §8 "Ayarlar".
 *
 * Varsayılandan farklı olan alanlar rozetle işaretlenir; koç hangi eşiği kendi
 * değiştirdiğini görür. Başarı toast ile, hata formda. Sunucudan yeni değerler
 * gelince form `key` ile yeniden kurulur ki `defaultValue`'lar güncel kalsın.
 */
export function AyarFormu({ alanlar }: { alanlar: AyarAlani[] }) {
  // Hatada girilen eşikler silinmez; başarıda `key` yeni değerlerle formu yeniden kurar.
  const { durum, gonder, bekliyor, gonderElle } = useFormGonder(ayarlariKaydet, BOS_DURUM);
  const [sifirlaniyor, basla] = useTransition();

  useEffect(() => {
    if (durum.ok && durum.mesaj) toast.success(durum.mesaj);
  }, [durum]);

  function sifirla() {
    basla(async () => {
      const sonuc = await ayarlariVarsayilanaDondur();
      if (sonuc.ok) toast.success(sonuc.mesaj);
      else toast.error(sonuc.mesaj || 'Varsayılanlara dönülemedi.');
    });
  }

  const anahtar = alanlar.map((a) => a.deger).join('|');

  return (
    <form key={anahtar} action={gonder} onSubmit={gonderElle} className="flex flex-col gap-4">
      {!durum.ok && <Bildirim ok={false} mesaj={durum.mesaj} />}

      <ul className="flex flex-col divide-y divide-ots-line">
        {alanlar.map((alan) => {
          const degisik = alan.deger !== alan.varsayilan;
          const hata = durum.alanHatalari?.[alan.anahtar]?.[0];
          const hataId = `${alan.anahtar}-hata`;

          return (
            <li
              key={alan.anahtar}
              className="flex min-h-14 lg:min-h-12 flex-wrap items-center justify-between gap-3 py-3"
            >
              <label htmlFor={alan.anahtar} className="min-w-0 flex-1">
                <span className="block text-[15px] leading-[1.5] text-ots-ink">{alan.etiket}</span>
                <span className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-ots-faint">
                  <span className="ots-sayi">
                    varsayılan {alan.varsayilan} · {alan.enAz}–{alan.enCok}
                  </span>
                  {degisik && <Rozet ton="sari">Değiştirilmiş</Rozet>}
                </span>
              </label>

              {/* Genişlik sarmalayıcıda: GIRDI içindeki w-full, girdiye verilen w-* sınıfını CSS sırasında ezer. */}
              <div className="flex w-28 shrink-0 flex-col gap-1.5">
                <input
                  id={alan.anahtar}
                  name={alan.anahtar}
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={alan.enAz}
                  max={alan.enCok}
                  defaultValue={alan.deger}
                  aria-invalid={Boolean(hata)}
                  aria-describedby={hata ? hataId : undefined}
                  className={`${GIRDI} ots-sayi text-center font-semibold`}
                />
                {hata && (
                  <p
                    id={hataId}
                    aria-live="polite"
                    className="flex items-center gap-1 text-[13px] font-medium text-ots-kirmizi"
                  >
                    <CircleAlert size={14} strokeWidth={2} aria-hidden className="shrink-0" />
                    {hata}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={sifirlaniyor}
          aria-busy={sifirlaniyor}
          onClick={sifirla}
          className={`${DUGME_SESSIZ} w-full sm:w-auto`}
        >
          {sifirlaniyor && (
            <Loader2 size={16} strokeWidth={2.25} aria-hidden className="animate-spin" />
          )}
          Varsayılanlara dön
        </button>
        <GonderDugmesi bekliyor={bekliyor} className="max-sm:order-first sm:h-11 sm:w-auto">
          Kaydet
        </GonderDugmesi>
      </div>
    </form>
  );
}
