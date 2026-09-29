'use client';

import { Loader2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { kaydiOnayla, kaydiReddet } from '@/lib/ots/actions/onay';
import { trTarihSaat } from '@/lib/ots/tarih';

import { Bildirim } from '../Alan';
import {
  DUGME_ALTIN,
  DUGME_SESSIZ,
  DUGME_TEHLIKE,
  DUGME_TEHLIKE_DOLU,
  Rozet,
} from '../Parcalar';

type Aday = {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  telefon: string;
  olusturmaZamani: Date;
};

/**
 * Onay bekleyen tek kayıt.
 *
 * "Onayla" liste başına tekrar eden birincil eylemdir (görev kartındaki
 * "Tamamla" gibi liste istisnası). Reddetme iki adımlı: çerçeveli → dolu.
 * Başarı toast'a gider (satır zaten listeden düşer); hata satırın altında kalır.
 */
export function OnaySatiri({ aday, kalanGun }: { aday: Aday; kalanGun: number }) {
  const [islemde, basla] = useTransition();
  const [hata, setHata] = useState('');
  const [onay, setOnay] = useState(false);

  function calistir(is: () => Promise<{ ok: boolean; mesaj: string }>) {
    setHata('');
    basla(async () => {
      const sonuc = await is();
      if (sonuc.ok) toast.success(sonuc.mesaj);
      else setHata(sonuc.mesaj);
    });
  }

  const donen = <Loader2 size={16} strokeWidth={2.25} aria-hidden className="animate-spin" />;

  return (
    <li className="ots-liste-oge rounded-2xl border border-ots-line bg-ots-surface p-4 shadow-ots">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-[16px] font-bold tracking-[-0.01em] text-ots-ink">
            {aday.ad} {aday.soyad}
          </p>
          <p className="truncate text-[14px] text-ots-soft">{aday.email}</p>
          {aday.telefon && <p className="text-[14px] text-ots-faint">{aday.telefon}</p>}
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px] text-ots-faint">
            <span>Kayıt: {trTarihSaat(aday.olusturmaZamani)}</span>
            {kalanGun <= 2 && (
              <Rozet ton={kalanGun <= 0 ? 'kirmizi' : 'turuncu'}>
                {kalanGun <= 0 ? 'Bugün silinecek' : `${kalanGun} gün sonra silinecek`}
              </Rozet>
            )}
          </div>
        </div>

        {/* Mobilde tam genişlik dikey, sm'den itibaren yan yana */}
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-3">
          {onay ? (
            <>
              <button
                type="button"
                disabled={islemde}
                aria-busy={islemde}
                onClick={() => calistir(() => kaydiReddet(aday.id))}
                className={`${DUGME_TEHLIKE_DOLU} w-full sm:w-auto`}
              >
                {islemde && donen}
                Evet, sil
              </button>
              <button
                type="button"
                disabled={islemde}
                onClick={() => setOnay(false)}
                className={`${DUGME_SESSIZ} w-full sm:w-auto`}
              >
                Vazgeç
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={islemde}
                aria-busy={islemde}
                onClick={() => calistir(() => kaydiOnayla(aday.id))}
                className={`${DUGME_ALTIN} w-full sm:w-auto`}
              >
                {islemde && donen}
                Onayla
              </button>
              <button
                type="button"
                disabled={islemde}
                onClick={() => setOnay(true)}
                className={`${DUGME_TEHLIKE} w-full sm:w-auto`}
              >
                Reddet
              </button>
            </>
          )}
        </div>
      </div>

      {hata && (
        <div className="mt-3">
          <Bildirim ok={false} mesaj={hata} />
        </div>
      )}
    </li>
  );
}
