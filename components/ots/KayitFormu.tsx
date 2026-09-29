'use client';

import { CheckCircle2 } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { useActionState, useState, useTransition, type FormEvent } from 'react';

import { kayitOl } from '@/lib/ots/actions/kimlik';
import { BOS_DURUM } from '@/lib/ots/dogrulama';

import { Alan, Bildirim, GonderDugmesi, SayiAlani } from './Alan';
import { DUGME_ALTIN, DUGME_HAYALET, ODAK_HALKASI } from './Parcalar';

/** Tek easing — spec §2.1 `--ease-ots`. */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Kayıt formu — spec §8 "Giriş" + revizyon (mezun / geçen yıl sıralaması).
 *
 * "Mezun öğrenciyim" işaretlenince sıralama alanı 220 ms yükseklik animasyonuyla
 * açılır (spec §6 akordeon istisnası); azaltılmış hareket tercihinde anında.
 * Onay kutusu kontrollüdür: mezun durumu sıralama alanının görünürlüğünü sürer.
 *
 * Otomatik sıfırlama: React 19, `<form action>` eylemi bittiğinde — sonuç
 * `ok:false` olsa bile — kontrolsüz alanları `defaultValue`'ya döndürür; bu da
 * doğrulama hatasında yazılan her şeyi silerdi. Bu yüzden gönderimi `onSubmit`
 * içinde `preventDefault` + `startTransition` ile kendimiz başlatıyoruz: React
 * olayı önceden engellenmiş gördüğünde eylemi yeniden çalıştırmaz ve sıfırlama
 * istemez. `action={gonder}` yine de kalır — hidrasyon öncesi (JS yüklenmeden)
 * gönderim sunucu eylemine düz POST olarak gider. Başarıda form zaten sonuç
 * ekranıyla değiştiği için elle `reset()` gerekmez.
 */
export function KayitFormu() {
  const [durum, gonder, bekliyor] = useActionState(kayitOl, BOS_DURUM);
  const [mezun, setMezun] = useState(false);
  const azalt = useReducedMotion() === true;
  const [, gecisBaslat] = useTransition();

  function gonderElle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const veri = new FormData(e.currentTarget);
    gecisBaslat(() => gonder(veri));
  }

  // Sunucu sıralama alanına hata döndürdüyse alan gizli kalmasın.
  const siralamaHatalari = durum.alanHatalari?.gecenYilSiralama;
  const siralamaGoster = mezun || Boolean(siralamaHatalari?.length);

  // Kayıt alındıysa formu tekrar göstermenin anlamı yok; onay bekleniyor.
  // Bu kalıcı bir sonuç ekranıdır, geçici toast değil — mesaj ekranda kalır.
  if (durum.ok) {
    return (
      <div role="status" aria-live="polite" className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="grid h-12 lg:h-10 w-12 lg:w-10 place-items-center rounded-full bg-ots-yesil-tint text-ots-yesil">
            <CheckCircle2 size={22} strokeWidth={2} aria-hidden />
          </span>
          <p className="font-display text-[18px] font-bold tracking-[-0.01em] text-ots-ink">
            Kaydın alındı
          </p>
          <p className="text-[14px] leading-relaxed text-ots-soft">{durum.mesaj}</p>
        </div>
        <Link href="/takip/giris" className={`${DUGME_ALTIN} h-12 lg:h-10 w-full`}>
          Giriş ekranına dön
        </Link>
      </div>
    );
  }

  return (
    <form action={gonder} onSubmit={gonderElle} className="flex flex-col gap-4">
      <Bildirim ok={false} mesaj={durum.mesaj} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Alan ad="ad" etiket="Ad" gerekli otomatik="given-name" hatalar={durum.alanHatalari?.ad} />
        <Alan
          ad="soyad"
          etiket="Soyad"
          gerekli
          otomatik="family-name"
          hatalar={durum.alanHatalari?.soyad}
        />
      </div>

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
        ad="telefon"
        etiket="Telefon"
        tur="tel"
        otomatik="tel"
        ipucu="05xx xxx xx xx"
        hatalar={durum.alanHatalari?.telefon}
      />

      {/* Mezun onayı + koşullu sıralama alanı. Sarmalayıcı tek flex öğesi:
          alan kapanınca formun gap'i boş satır bırakmaz. */}
      <div className="flex flex-col">
        <label className="flex min-h-11 lg:min-h-9 cursor-pointer select-none items-center gap-3 text-[15px] text-ots-ink">
          <input
            type="checkbox"
            name="mezun"
            checked={mezun}
            onChange={(e) => setMezun(e.target.checked)}
            className={`h-[22px] w-[22px] shrink-0 cursor-pointer rounded accent-[var(--color-ots-gold)] ${ODAK_HALKASI} focus-visible:ring-offset-ots-surface!`}
          />
          Mezun öğrenciyim
        </label>

        <AnimatePresence initial={false}>
          {siralamaGoster && (
            <motion.div
              key="gecenYilSiralama"
              initial={azalt ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={azalt ? { opacity: 0, transition: { duration: 0 } } : { height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="pt-4">
                <SayiAlani
                  ad="gecenYilSiralama"
                  etiket="Geçen yılki sıralaman"
                  ipucu="Örn. 45000 — bilmiyorsan boş bırak"
                  min={1}
                  hatalar={siralamaHatalari}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Alan
        ad="sifre"
        etiket="Şifre"
        tur="password"
        gerekli
        otomatik="new-password"
        ipucu="En az 8 karakter, harf ve rakam"
        hatalar={durum.alanHatalari?.sifre}
      />

      <Alan
        ad="sifreTekrar"
        etiket="Şifre tekrar"
        tur="password"
        gerekli
        otomatik="new-password"
        hatalar={durum.alanHatalari?.sifreTekrar}
      />

      <GonderDugmesi bekliyor={bekliyor}>Kayıt ol</GonderDugmesi>

      <p className="flex flex-wrap items-center justify-center gap-x-3 text-[14px] text-ots-soft">
        <span>Zaten hesabın var mı?</span>
        <Link href="/takip/giris" className={DUGME_HAYALET}>
          Giriş yap
        </Link>
      </p>
    </form>
  );
}
