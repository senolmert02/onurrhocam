'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useFormGonder } from '@/components/ots/hooks/useFormGonder';

import { gorevGeriAl, gorevTamamla } from '@/lib/ots/actions/gorev';
import { BOS_DURUM, type FormDurumu } from '@/lib/ots/dogrulama';
import type { GorevSatiri } from '@/lib/ots/sorgular/temel';
import { sureBicimle } from '@/lib/ots/tarih';

import { Alan, Bildirim, GonderDugmesi, SayiAlani } from './Alan';
import { DUGME_ALTIN, DUGME_HAYALET, Rozet } from './Parcalar';

/** Tek easing — spec §2.1 `--ease-ots`. */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const ONCELIK_TONU = {
  Yüksek: 'kirmizi',
  Normal: 'notr',
  Düşük: 'notr',
} as const;

/**
 * Öğrencinin tek görev kartı — spec §8 "Öğrenci ana sayfa".
 *
 * Bekleyen kart `surface`, tamamlanan kart `yesil-tint` zeminlidir; durum hem
 * renkle hem "Tamamlandı" rozeti ve işaretle söylenir. "Tamamla" düğmesi kartın
 * altında inline formu açar (yükseklik/opaklık, 220 ms); kayıt başarılıysa form
 * kapanır ve toast gelir — form içinde yalnızca hata bildirimi kalır.
 *
 * Hem ana sayfadaki listede hem `HaftaIzgarasi`'nın gün modalında kullanılır;
 * imza `{ gorev }` değişmez.
 */
export function GorevKarti({ gorev }: { gorev: GorevSatiri }) {
  const [acik, setAcik] = useState(false);
  const [geriAlBekliyor, setGeriAlBekliyor] = useState(false);
  const azalt = useReducedMotion() === true;

  // Başarı sunucu yanıtı gelir gelmez işlenir (etki değil, eylemin kendisi):
  // form kapanır, bildirim toast'a gider (spec §4.6). Hata formda kalır ve
  // useFormGonder sayesinde yazılan değerler silinmez. Başarıda form unmount
  // olduğundan basaridaSifirla gerekmez.
  const { durum, gonder, bekliyor, gonderElle } = useFormGonder(
    async (onceki: FormDurumu, form: FormData): Promise<FormDurumu> => {
      const sonuc = await gorevTamamla(onceki, form);
      if (sonuc.ok) {
        toast.success(sonuc.mesaj || 'Görev tamamlandı.');
        setAcik(false);
      }
      return sonuc;
    },
    BOS_DURUM,
  );

  const tamamlandi = gorev.durum === 'tamamlandi';
  // Sayfa yüklenirken zaten tamamlanmış görevde işaret animasyonsuz gelir; animasyon
  // yalnızca oturum içinde tamamlanınca oynar. Başlangıç render'da hareket tercihine
  // bağlı olmadığı için sunucu ve istemci aynı HTML'i üretir (hidrasyon uyumlu).
  const [yuklenirkenTamam] = useState(tamamlandi);
  const g = gorev.gerceklesen;
  const formId = `gorev-form-${gorev.id}`;

  async function geriAl() {
    setGeriAlBekliyor(true);
    const sonuc = await gorevGeriAl(gorev.id);
    setGeriAlBekliyor(false);
    if (sonuc.ok) toast.success(sonuc.mesaj);
    else toast.error(sonuc.mesaj);
  }

  return (
    <li
      className={`rounded-2xl border p-4 transition-colors duration-[220ms] ease-[var(--ease-ots)] ${
        tamamlandi ? 'border-ots-yesil/30 bg-ots-yesil-tint' : 'border-ots-line bg-ots-surface'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {tamamlandi && (
              <CheckCircle2
                size={18}
                strokeWidth={2}
                aria-hidden
                className="shrink-0 text-ots-yesil"
              />
            )}
            <p className="text-[15px] font-semibold leading-[1.5] text-ots-ink">{gorev.ders}</p>
            {gorev.oncelik !== 'Normal' && (
              <Rozet ton={ONCELIK_TONU[gorev.oncelik as keyof typeof ONCELIK_TONU] ?? 'notr'}>
                {gorev.oncelik} öncelik
              </Rozet>
            )}
            {tamamlandi && (
              <motion.span
                className="inline-flex"
                initial={yuklenirkenTamam || azalt ? false : { scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: azalt ? 0 : 0.22, ease: EASE }}
              >
                <Rozet ton="yesil">Tamamlandı</Rozet>
              </motion.span>
            )}
          </div>

          {(gorev.konu || gorev.altKonu) && (
            <p className="mt-0.5 text-[13px] leading-snug text-ots-soft">
              {[gorev.konu, gorev.altKonu].filter(Boolean).join(' · ')}
            </p>
          )}

          <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-ots-faint">
            <span>{gorev.gorevTuru}</span>
            {gorev.baslangicSaati && (
              <span className="ots-sayi">
                {gorev.baslangicSaati.slice(0, 5)}
                {gorev.bitisSaati ? ` – ${gorev.bitisSaati.slice(0, 5)}` : ''}
              </span>
            )}
            {gorev.hedefSoru > 0 && <span>Hedef: {gorev.hedefSoru} soru</span>}
            {gorev.hedefSure > 0 && <span>{sureBicimle(gorev.hedefSure)}</span>}
          </p>

          {gorev.aciklama && (
            <p className="mt-2 rounded-lg bg-ots-gold-tint px-3 py-2 text-[13px] leading-snug text-ots-soft">
              {gorev.aciklama}
            </p>
          )}

          {tamamlandi && g && (
            <dl className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
              <Gerceklesen etiket="Soru" deger={g.soru} />
              <Gerceklesen etiket="Doğru" deger={g.dogru} />
              <Gerceklesen etiket="Yanlış" deger={g.yanlis} />
              <Gerceklesen etiket="Boş" deger={g.bos} />
              <Gerceklesen etiket="Süre" deger={sureBicimle(g.sure)} />
            </dl>
          )}
          {tamamlandi && g?.notMetni && (
            <p className="mt-2 text-[12px] text-ots-faint">“{g.notMetni}”</p>
          )}
        </div>

        {/* Eylem: mobilde tam genişlik, sm'den itibaren sağda kendi genişliğinde */}
        <div className="flex shrink-0 sm:justify-end">
          {tamamlandi ? (
            <button
              type="button"
              onClick={geriAl}
              disabled={geriAlBekliyor}
              aria-busy={geriAlBekliyor}
              className={`${DUGME_HAYALET} w-full sm:w-auto`}
            >
              {geriAlBekliyor && (
                <Loader2 size={16} strokeWidth={2.25} aria-hidden className="animate-spin" />
              )}
              Geri al
            </button>
          ) : acik ? (
            <button
              type="button"
              onClick={() => setAcik(false)}
              aria-expanded
              aria-controls={formId}
              className={`${DUGME_HAYALET} w-full sm:w-auto`}
            >
              Vazgeç
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setAcik(true)}
              aria-expanded={false}
              aria-controls={formId}
              className={`${DUGME_ALTIN} h-11 lg:h-9 w-full sm:w-auto`}
            >
              Tamamla
            </button>
          )}
        </div>
      </div>

      {/* Inline tamamlama formu — yükseklik + opaklık, 220 ms (spec §6) */}
      <AnimatePresence initial={false}>
        {acik && !tamamlandi && (
          <motion.div
            key="form"
            id={formId}
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: azalt ? 0 : 0.22, ease: EASE }}
          >
            <form action={gonder} onSubmit={gonderElle} className="mt-3 flex flex-col gap-4 border-t border-ots-line pt-3">
              <input type="hidden" name="gorevId" value={gorev.id} />

              {!durum.ok && durum.mesaj && <Bildirim ok={false} mesaj={durum.mesaj} />}

              <div className="grid grid-cols-3 gap-3">
                <SayiAlani
                  ad="soru"
                  kimlik={`${formId}-soru`}
                  etiket="Soru"
                  min={0}
                  ipucu="0"
                  varsayilan={gorev.hedefSoru || undefined}
                  hatalar={durum.alanHatalari?.soru}
                />
                <SayiAlani
                  ad="dogru"
                  kimlik={`${formId}-dogru`}
                  etiket="Doğru"
                  min={0}
                  ipucu="0"
                  hatalar={durum.alanHatalari?.dogru}
                />
                <SayiAlani
                  ad="yanlis"
                  kimlik={`${formId}-yanlis`}
                  etiket="Yanlış"
                  min={0}
                  ipucu="0"
                  hatalar={durum.alanHatalari?.yanlis}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SayiAlani
                  ad="bos"
                  kimlik={`${formId}-bos`}
                  etiket="Boş"
                  min={0}
                  ipucu="0"
                  hatalar={durum.alanHatalari?.bos}
                />
                <SayiAlani
                  ad="sure"
                  kimlik={`${formId}-sure`}
                  etiket="Süre (dk)"
                  min={0}
                  ipucu="0"
                  varsayilan={gorev.hedefSure || undefined}
                  hatalar={durum.alanHatalari?.sure}
                />
              </div>

              <p className="-mt-2 text-[12px] text-ots-faint">
                Soru sayısını boş bırakırsan doğru + yanlış + boş toplamı yazılır.
              </p>

              <Alan
                ad="notMetni"
                kimlik={`${formId}-notMetni`}
                etiket="Not"
                ipucu="Kısa bir not"
                hatalar={durum.alanHatalari?.notMetni}
              />

              <GonderDugmesi bekliyor={bekliyor}>Kaydet</GonderDugmesi>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function Gerceklesen({ etiket, deger }: { etiket: string; deger: string | number }) {
  return (
    <div className="flex gap-1">
      <dt className="text-ots-faint">{etiket}:</dt>
      <dd className="ots-sayi font-semibold text-ots-ink">{deger}</dd>
    </div>
  );
}
