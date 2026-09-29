'use client';

import { CircleAlert, Loader2, Trash2 } from 'lucide-react';
import { useEffect, useId, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { useFormGonder } from '@/components/ots/hooks/useFormGonder';

import { notKaydet, notSil, takibiKapat } from '@/lib/ots/actions/not';
import { BOS_DURUM } from '@/lib/ots/dogrulama';
import { trTarih } from '@/lib/ots/tarih';

import { Alan, Bildirim, GIRDI, GonderDugmesi } from '../Alan';
import { DUGME_SESSIZ, DUGME_TEHLIKE, DUGME_TEHLIKE_DOLU, Rozet } from '../Parcalar';

/** Çok satırlı metin: GIRDI'nin sabit yüksekliği yerine `min-h-28 py-3` (spec §4.5). */
const METIN_ALANI = GIRDI.replace(/\bh-12\b/, 'min-h-28 py-3');

const ETIKET = 'text-[13px] font-medium leading-snug text-ots-soft';

/**
 * Koç notu formu. Başarı toast ile duyurulur ve form sıfırlanır; form içi
 * bildirim yalnızca hata içindir (spec §4.6).
 */
export function NotFormu({ ogrenciId, bugun }: { ogrenciId: string; bugun: string }) {
  // Hatada yazılanlar korunur; başarıda form kanca tarafından boşaltılır.
  const { durum, gonder, bekliyor, gonderElle } = useFormGonder(notKaydet, BOS_DURUM, {
    basaridaSifirla: true,
  });
  const kimlik = useId();

  useEffect(() => {
    if (durum.ok && durum.mesaj) toast.success(durum.mesaj);
  }, [durum]);

  const notHatasi = durum.alanHatalari?.notMetni?.[0];
  const notHataId = `${kimlik}-not-hata`;

  return (
    <form action={gonder} onSubmit={gonderElle} className="flex flex-col gap-4">
      <input type="hidden" name="ogrenciId" value={ogrenciId} />

      {!durum.ok && <Bildirim ok={false} mesaj={durum.mesaj} />}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${kimlik}-not`} className={ETIKET}>
          Not
        </label>
        <textarea
          id={`${kimlik}-not`}
          name="notMetni"
          required
          placeholder="Görüşmede konuşulanlar, gözlemler…"
          aria-invalid={Boolean(notHatasi)}
          aria-describedby={notHatasi ? notHataId : undefined}
          className={METIN_ALANI}
        />
        {notHatasi && (
          <p
            id={notHataId}
            aria-live="polite"
            className="flex items-center gap-1 text-[13px] font-medium text-ots-kirmizi"
          >
            <CircleAlert size={14} strokeWidth={2} aria-hidden className="shrink-0" />
            {notHatasi}
          </p>
        )}
      </div>

      <Alan
        ad="aksiyon"
        etiket="Aksiyon / karar"
        ipucu="Bir sonraki görüşmeye kadar ne yapılacak?"
        hatalar={durum.alanHatalari?.aksiyon}
      />

      <div className="grid grid-cols-2 gap-4">
        <Alan
          ad="tarih"
          etiket="Not tarihi"
          tur="date"
          gerekli
          varsayilan={bugun}
          hatalar={durum.alanHatalari?.tarih}
        />
        <Alan
          ad="takipTarihi"
          etiket="Takip tarihi"
          tur="date"
          hatalar={durum.alanHatalari?.takipTarihi}
        />
      </div>

      <p className="text-[12px] text-ots-faint">
        Takip tarihi verirsen, o gün geldiğinde panelde hatırlatılır.
      </p>

      <GonderDugmesi bekliyor={bekliyor} className="sm:w-auto sm:self-start">
        Not ekle
      </GonderDugmesi>
    </form>
  );
}

/**
 * Geçmiş not kartı. Vadesi gelen takip altın vurguyla öne çıkar; silme iki
 * adımlıdır (çerçeveli → dolu). Sonuçlar toast ile duyurulur.
 */
export function NotSatiri({
  not,
  bugun,
}: {
  not: {
    id: string;
    tarih: string;
    notMetni: string;
    aksiyon: string;
    takipTarihi: string | null;
    yazan: string;
  };
  bugun: string;
}) {
  const [islemde, basla] = useTransition();
  const [hata, setHata] = useState('');
  const [onay, setOnay] = useState(false);

  function calistir(is: () => Promise<{ ok: boolean; mesaj: string }>) {
    setHata('');
    basla(async () => {
      const sonuc = await is();
      if (sonuc.ok) toast.success(sonuc.mesaj);
      else setHata(sonuc.mesaj || 'İşlem tamamlanamadı.');
      setOnay(false);
    });
  }

  const vadesiGeldi = Boolean(not.takipTarihi && not.takipTarihi <= bugun);

  return (
    <li
      className={`ots-liste-oge rounded-2xl border p-4 shadow-ots sm:p-5 ${
        vadesiGeldi ? 'border-ots-gold-deep/40 bg-ots-gold-tint' : 'border-ots-line bg-ots-surface'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="ots-sayi text-[12px] text-ots-faint">{trTarih(not.tarih)}</span>
        {not.takipTarihi && (
          <Rozet ton={vadesiGeldi ? 'sari' : 'notr'}>
            {vadesiGeldi ? 'Takip günü geldi' : 'Takip'} · {trTarih(not.takipTarihi)}
          </Rozet>
        )}
      </div>

      <p className="mt-2 whitespace-pre-wrap text-[15px] leading-[1.5] text-ots-ink">{not.notMetni}</p>

      {not.aksiyon && (
        <p className="mt-2 rounded-lg bg-ots-raised px-3 py-2 text-[13px] leading-snug text-ots-soft">
          <strong className="font-semibold text-ots-ink">Aksiyon:</strong> {not.aksiyon}
        </p>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {not.takipTarihi && (
          <button
            type="button"
            disabled={islemde}
            onClick={() => calistir(() => takibiKapat(not.id))}
            className={`${DUGME_SESSIZ} w-full sm:w-auto`}
          >
            Takibi kapat
          </button>
        )}

        {onay ? (
          <div
            role="group"
            aria-label="Silme onayı"
            className="flex flex-col gap-2 sm:ml-auto sm:flex-row"
          >
            <button
              type="button"
              disabled={islemde}
              aria-busy={islemde}
              onClick={() => calistir(() => notSil(not.id))}
              className={`${DUGME_TEHLIKE_DOLU} w-full sm:w-auto`}
            >
              {islemde && (
                <Loader2 size={16} strokeWidth={2.25} aria-hidden className="animate-spin" />
              )}
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
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOnay(true)}
            aria-label="Notu sil"
            className={`${DUGME_TEHLIKE} w-full sm:ml-auto sm:w-auto`}
          >
            <Trash2 size={16} strokeWidth={2} aria-hidden />
            Sil
          </button>
        )}
      </div>

      {hata && (
        <p
          aria-live="polite"
          className="mt-2 flex items-center gap-1 text-[13px] font-medium text-ots-kirmizi"
        >
          <CircleAlert size={14} strokeWidth={2} aria-hidden className="shrink-0" />
          {hata}
        </p>
      )}
    </li>
  );
}
