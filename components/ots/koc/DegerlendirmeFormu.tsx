'use client';

import { useEffect, useId } from 'react';
import { toast } from 'sonner';

import { useFormGonder } from '@/components/ots/hooks/useFormGonder';

import { degerlendirmeKaydet } from '@/lib/ots/actions/rapor';
import { BOS_DURUM } from '@/lib/ots/dogrulama';

import { Bildirim, GIRDI, GonderDugmesi } from '../Alan';

/* Çok satırlı alan: GIRDI reçetesinin sabit yüksekliği yerine min-h-32 + py-3
   (spec §4.5 textarea, §8 Rapor "textarea min-h-32 text-[16px]"). */
const METIN_ALANI = GIRDI.replace(/\bh-12\b/, 'min-h-32 py-3 resize-y');

const ETIKET = 'text-[13px] font-medium leading-snug text-ots-soft';

/**
 * Haftalık rapora koçun yazdığı iki alan.
 * Öğrenci bunları raporunda görür ama değiştiremez.
 *
 * Form içi bildirim yalnızca hata için; başarı toast ile duyurulur (spec §4.6).
 * Kaydet sayfanın tek birincil düğmesidir: mobilde tam genişlik, sm+ içerik kadar.
 */
export function DegerlendirmeFormu({
  ogrenciId,
  hafta,
  degerlendirme,
  hedefler,
}: {
  ogrenciId: string;
  hafta: string;
  degerlendirme: string;
  hedefler: string;
}) {
  // Kaydedilen metin ekranda kalır; hatada da yazılanlar silinmez.
  const { durum, gonder, bekliyor, gonderElle } = useFormGonder(degerlendirmeKaydet, BOS_DURUM);
  const kimlik = useId();
  const degerlendirmeId = `${kimlik}-degerlendirme`;
  const hedeflerId = `${kimlik}-hedefler`;

  // Başarı: her yeni sonuç nesnesinde bir kez toast.
  useEffect(() => {
    if (durum.ok && durum.mesaj) toast.success(durum.mesaj);
  }, [durum]);

  return (
    <form action={gonder} onSubmit={gonderElle} className="flex flex-col gap-4">
      <input type="hidden" name="ogrenciId" value={ogrenciId} />
      <input type="hidden" name="hafta" value={hafta} />

      {!durum.ok && <Bildirim ok={false} mesaj={durum.mesaj} />}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={degerlendirmeId} className={ETIKET}>
          Koç değerlendirmesi
        </label>
        <textarea
          id={degerlendirmeId}
          name="kocDegerlendirmesi"
          defaultValue={degerlendirme}
          placeholder="Bu hafta nasıl geçti, neyi iyi yaptı, nerede zorlandı?"
          className={METIN_ALANI}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={hedeflerId} className={ETIKET}>
          Gelecek haftanın hedefleri
        </label>
        <textarea
          id={hedeflerId}
          name="gelecekHedefler"
          defaultValue={hedefler}
          placeholder="Önümüzdeki hafta neye odaklanacak?"
          className={METIN_ALANI}
        />
      </div>

      <GonderDugmesi bekliyor={bekliyor} className="sm:w-auto sm:self-start">
        Kaydet
      </GonderDugmesi>
    </form>
  );
}
