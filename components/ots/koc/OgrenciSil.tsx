'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useId, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { ogrenciSil } from '@/lib/ots/actions/ogrenci';

import { Bildirim, GIRDI } from '../Alan';
import { DUGME_SESSIZ, DUGME_TEHLIKE, DUGME_TEHLIKE_DOLU } from '../Parcalar';

/**
 * Öğrenciyi ve tüm verisini kalıcı olarak siler.
 *
 * Geri alınamaz bir işlem olduğu için iki kapı var (spec §4.1: çerçeveli →
 * dolu): önce bölümü açmak, sonra öğrencinin adını harfi harfine yazmak.
 * Yanlış satıra basıp bir öğrencinin bir yıllık verisini silmek aksi hâlde
 * tek tıklık iş olurdu.
 */
export function OgrenciSil({
  ogrenciId,
  adSoyad,
}: {
  ogrenciId: string;
  adSoyad: string;
}) {
  const router = useRouter();
  const girdiId = useId();
  const [acik, setAcik] = useState(false);
  const [metin, setMetin] = useState('');
  const [hata, setHata] = useState('');
  const [siliniyor, basla] = useTransition();

  const eslesiyor = metin.trim() === adSoyad.trim();

  function sil() {
    setHata('');
    basla(async () => {
      const sonuc = await ogrenciSil(ogrenciId, metin);
      if (sonuc.ok) {
        toast.success(sonuc.mesaj);
        router.push('/takip/ogrenciler');
      } else {
        setHata(sonuc.mesaj);
      }
    });
  }

  if (!acik) {
    return (
      <button
        type="button"
        onClick={() => setAcik(true)}
        className={`${DUGME_TEHLIKE} w-full sm:w-auto`}
      >
        Öğrenciyi kalıcı olarak sil
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-ots-kirmizi/30 bg-ots-kirmizi-tint p-4">
      {hata && <Bildirim ok={false} mesaj={hata} />}

      <div>
        <p className="text-[14px] font-semibold text-ots-kirmizi">Bu işlem geri alınamaz.</p>
        <p className="mt-1 text-[14px] leading-[1.5] text-ots-soft">
          {adSoyad} ile birlikte{' '}
          <strong className="font-semibold text-ots-ink">
            tüm görevleri, çalışma kayıtları, konu durumları, denemeleri, yanlış
            analizleri, koç notları ve giriş hesabı
          </strong>{' '}
          kalıcı olarak silinecek.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={girdiId} className="text-[13px] font-medium leading-snug text-ots-soft">
          Onaylamak için öğrencinin adını tam olarak yaz:{' '}
          <strong className="font-semibold text-ots-ink">{adSoyad}</strong>
        </label>
        <input
          id={girdiId}
          value={metin}
          onChange={(olay) => setMetin(olay.target.value)}
          placeholder={adSoyad}
          autoComplete="off"
          className={GIRDI}
        />
      </div>

      {/* Onay adımı: dolu tehlike üstte/solda, Vazgeç altta/sağda (spec §4.10) */}
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <button
          type="button"
          disabled={!eslesiyor || siliniyor}
          aria-busy={siliniyor}
          onClick={sil}
          className={`${DUGME_TEHLIKE_DOLU} h-12 lg:h-10 w-full sm:h-11 sm:w-auto`}
        >
          {siliniyor && <Loader2 size={16} strokeWidth={2.25} aria-hidden className="animate-spin" />}
          Kalıcı olarak sil
        </button>
        <button
          type="button"
          onClick={() => {
            setAcik(false);
            setMetin('');
            setHata('');
          }}
          className={`${DUGME_SESSIZ} h-12 lg:h-10 w-full sm:h-11 sm:w-auto`}
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}
