'use client';

import { Loader2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { hesapAc, kilidiAc, sifreSifirla } from '@/lib/ots/actions/ogrenci';

import { Bildirim, GIRDI } from '../Alan';
import { DUGME_LACIVERT, DUGME_SESSIZ } from '../Parcalar';

type Sonuc = { ok: boolean; mesaj: string };

/**
 * Giriş hesabı işlemleri.
 *
 * Üretilen geçici şifre yalnızca burada, bir kez gösterilir; hiçbir yere
 * kaydedilmez. Koç ekrandan kopyalayıp öğrenciye iletir — bu yüzden şifre
 * içeren başarı mesajı toast'a değil, kalıcı `Bildirim`e gider. Şifresiz
 * başarılar (kilit açma) toast ile duyurulur; hatalar form içinde kalır.
 */
export function HesapIslemleri({
  ogrenciId,
  hesapVar,
  eposta,
}: {
  ogrenciId: string;
  hesapVar: boolean;
  eposta: string;
}) {
  const [islemde, basla] = useTransition();
  const [sonuc, setSonuc] = useState<Sonuc | null>(null);
  const [yeniEposta, setYeniEposta] = useState(eposta);
  const [suren, setSuren] = useState<'sifre' | 'kilit' | 'hesap' | null>(null);

  function calistir(ad: 'sifre' | 'kilit' | 'hesap', is: () => Promise<Sonuc>) {
    setSonuc(null);
    setSuren(ad);
    basla(async () => {
      const cevap = await is();
      setSuren(null);
      if (cevap.ok && !cevap.mesaj.includes('şifre')) {
        toast.success(cevap.mesaj);
        return;
      }
      setSonuc(cevap);
    });
  }

  const donen = <Loader2 size={16} strokeWidth={2.25} aria-hidden className="animate-spin" />;

  return (
    <div className="flex flex-col gap-4">
      {sonuc && <Bildirim ok={sonuc.ok} mesaj={sonuc.mesaj} />}

      {hesapVar ? (
        <>
          <p className="text-[14px] leading-[1.5] text-ots-soft">
            Giriş hesabı var:{' '}
            <strong className="font-semibold text-ots-ink">{eposta}</strong>
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <button
              type="button"
              disabled={islemde}
              aria-busy={suren === 'sifre'}
              onClick={() => calistir('sifre', () => sifreSifirla(ogrenciId))}
              className={`${DUGME_SESSIZ} w-full sm:w-auto`}
            >
              {suren === 'sifre' && donen}
              Yeni şifre üret
            </button>
            <button
              type="button"
              disabled={islemde}
              aria-busy={suren === 'kilit'}
              onClick={() => calistir('kilit', () => kilidiAc(ogrenciId))}
              className={`${DUGME_SESSIZ} w-full sm:w-auto`}
            >
              {suren === 'kilit' && donen}
              Kilidi aç
            </button>
          </div>
          <p className="text-[12px] text-ots-faint">
            Şifre yalnızca üretildiği anda görünür, saklanmaz.
          </p>
        </>
      ) : (
        <>
          <p className="text-[14px] leading-[1.5] text-ots-soft">
            Bu öğrencinin giriş hesabı yok. E-posta vererek açabilirsin.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={yeniEposta}
              onChange={(olay) => setYeniEposta(olay.target.value)}
              placeholder="ogrenci@ornek.com"
              aria-label="Öğrenci e-postası"
              autoComplete="email"
              className={`${GIRDI} min-w-0 sm:flex-1`}
            />
            <button
              type="button"
              disabled={islemde || !yeniEposta}
              aria-busy={suren === 'hesap'}
              onClick={() => calistir('hesap', () => hesapAc(ogrenciId, yeniEposta))}
              className={`${DUGME_LACIVERT} h-12 lg:h-10 w-full sm:w-auto`}
            >
              {suren === 'hesap' && donen}
              Hesap aç
            </button>
          </div>
        </>
      )}
    </div>
  );
}
