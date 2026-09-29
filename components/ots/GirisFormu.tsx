'use client';

import Link from 'next/link';

import { girisYap } from '@/lib/ots/actions/kimlik';
import { BOS_DURUM } from '@/lib/ots/dogrulama';

import { Alan, Bildirim, GonderDugmesi } from './Alan';
import { useFormGonder } from './hooks/useFormGonder';
import { DUGME_HAYALET } from './Parcalar';

/**
 * Giriş formu — spec §8 "Giriş". Başarıda sunucu eylemi yönlendirir; form içi
 * bildirim yalnızca hata için (spec §4.6). Girdiler 48px / 16px, düğme altın
 * tam genişlik, "Kayıt ol" bağlantısı 44px hayalet düğme.
 */
export function GirisFormu() {
  // Hatada form sıfırlanmaz: e-posta ve şifre korunur (başarıda sunucu yönlendirir).
  const { durum, gonder, bekliyor, gonderElle } = useFormGonder(girisYap, BOS_DURUM);

  return (
    <form action={gonder} onSubmit={gonderElle} className="flex flex-col gap-4">
      {!durum.ok && <Bildirim ok={false} mesaj={durum.mesaj} />}

      <Alan
        ad="eposta"
        etiket="E-posta"
        tur="email"
        gerekli
        otomatik="email"
        ipucu="ornek@eposta.com"
        hatalar={durum.alanHatalari?.eposta}
      />

      <Alan
        ad="sifre"
        etiket="Şifre"
        tur="password"
        gerekli
        otomatik="current-password"
        hatalar={durum.alanHatalari?.sifre}
      />

      <GonderDugmesi bekliyor={bekliyor}>Giriş yap</GonderDugmesi>

      <p className="flex flex-wrap items-center justify-center gap-x-3 text-[14px] text-ots-soft">
        <span>Hesabın yok mu?</span>
        <Link href="/takip/kayit" className={DUGME_HAYALET}>
          Kayıt ol
        </Link>
      </p>
    </form>
  );
}
