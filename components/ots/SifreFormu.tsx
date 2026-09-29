'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

import { sifreDegistir } from '@/lib/ots/actions/kimlik';
import { BOS_DURUM } from '@/lib/ots/dogrulama';

import { Alan, Bildirim, GonderDugmesi } from './Alan';
import { useFormGonder } from './hooks/useFormGonder';

/**
 * Şifre değiştirme formu — spec §8 "Ayarlar / Profil".
 *
 * Başarı `toast.success` ile duyurulur (`OtsToaster` (panel)/layout'ta);
 * form içi `Bildirim` yalnızca hata için (spec §4.6). Kaydet düğmesi mobilde
 * tam genişlik, sm+ içerik genişliğinde.
 */
export function SifreFormu() {
  // Hatada yazılanlar kalır; başarıda üç şifre alanı boşaltılır.
  const { durum, gonder, bekliyor, gonderElle } = useFormGonder(sifreDegistir, BOS_DURUM, {
    basaridaSifirla: true,
  });

  // Kanca her eylem sonucunda yeni nesne verir; başarı bir kez duyurulur.
  useEffect(() => {
    if (durum.ok && durum.mesaj) toast.success(durum.mesaj);
  }, [durum]);

  return (
    <form action={gonder} onSubmit={gonderElle} className="flex flex-col gap-4">
      {!durum.ok && <Bildirim ok={false} mesaj={durum.mesaj} />}

      <Alan
        ad="mevcutSifre"
        etiket="Mevcut şifre"
        tur="password"
        gerekli
        otomatik="current-password"
        hatalar={durum.alanHatalari?.mevcutSifre}
      />
      <Alan
        ad="yeniSifre"
        etiket="Yeni şifre"
        tur="password"
        gerekli
        otomatik="new-password"
        ipucu="En az 8 karakter, harf ve rakam"
        hatalar={durum.alanHatalari?.yeniSifre}
      />
      <Alan
        ad="yeniSifreTekrar"
        etiket="Yeni şifre tekrar"
        tur="password"
        gerekli
        otomatik="new-password"
        hatalar={durum.alanHatalari?.yeniSifreTekrar}
      />

      <GonderDugmesi bekliyor={bekliyor} className="sm:w-auto">
        Şifreyi değiştir
      </GonderDugmesi>
    </form>
  );
}
