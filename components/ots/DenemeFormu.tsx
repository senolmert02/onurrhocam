'use client';

import { ChevronDown, Loader2, Plus, Trash2 } from 'lucide-react';
import { useId, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { denemeEkle, denemeSil } from '@/lib/ots/actions/deneme';
import { BOS_DURUM, type FormDurumu } from '@/lib/ots/dogrulama';
import {
  DENEME_TURLERI,
  DENEME_TUR_ADLARI,
  YANLIS_NEDENLERI,
  type DenemeTuru,
} from '@/lib/ots/sabitler';

import { Alan, Bildirim, GIRDI, SayiAlani, Secim } from './Alan';
import { Fab } from './Fab';
import { useFormGonder } from './hooks/useFormGonder';
import { Modal } from './Modal';
import {
  DUGME_ALTIN,
  DUGME_HAYALET,
  DUGME_SESSIZ,
  DUGME_TEHLIKE,
  DUGME_TEHLIKE_DOLU,
} from './Parcalar';

/** Çok satırlı metin: GIRDI'nin sabit yüksekliği yerine `min-h-28 py-3` (spec §4.5). */
const METIN_ALANI = GIRDI.replace(/\bh-12\b/, 'min-h-28 py-3');

/**
 * Bölüm sonuçları için kısa sayı girdisi — D/Y/B ızgarasında. `px-3.5` derlenen
 * CSS'te `px-2`'den sonra geldiği için sınıf eklemek yetmez; değiştirilir (56px
 * hücrede 3 haneye yer kalsın).
 */
const SAYI_GIRDISI = `${GIRDI.replace(/\bpx-3\.5\b/, 'px-2')} ots-sayi text-center font-semibold`;

const ETIKET = 'text-[13px] font-medium leading-snug text-ots-soft';

const FORM_ID = 'deneme-formu';

/**
 * Deneme kaydı — spec §8 "Denemeler".
 *
 * Tetikleyici iki yerde yaşar ama sayfa başına tek birincil eylemdir: lg altında
 * sağ altta FAB, lg ve üstünde `SayfaBasi` düğmesi. Form md altında bottom sheet,
 * md+ diyalog olarak açılır; Kaydet/Vazgeç yapışkan eylem çubuğunda.
 *
 * Bölümler seçilen deneme türüne göre değişir (TYT 4, AYT 8, LGS 6 bölüm),
 * bu yüzden tür istemci tarafında tutulur. Alan adları `d_0`, `y_0`, `b_0`
 * biçiminde; indeks sunucudaki bölüm sırasına denk gelir.
 *
 * Net hesabı sunucuda yapılır — istemciden gelen nete güvenilmez.
 */
export function DenemeFormu({
  ogrenciId,
  bugun,
  kocMu = false,
}: {
  ogrenciId?: string;
  bugun: string;
  kocMu?: boolean;
}) {
  const [acik, setAcik] = useState(false);
  const [tur, setTur] = useState<DenemeTuru>('TYT');
  const [nedenlerAcik, setNedenlerAcik] = useState(false);
  const kimlik = useId();

  // Kaydedince anında kapat + toast (spec §4.6); hata formda kalır — useFormGonder
  // doğrulama hatasında girilen değerleri silmez. Modal başarıda kapandığı için
  // basaridaSifirla gerekmez.
  const { durum, gonder, bekliyor, gonderElle } = useFormGonder(
    async (onceki: FormDurumu, form: FormData) => {
      const sonuc = await denemeEkle(onceki, form);
      if (sonuc.ok) {
        toast.success(sonuc.mesaj);
        setAcik(false);
      }
      return sonuc;
    },
    BOS_DURUM,
  );

  const bolumler = DENEME_TURLERI[tur].bolumler;

  return (
    <>
      {/* lg+: sayfa başındaki birincil düğme; lg altında FAB devralır */}
      <button
        type="button"
        onClick={() => setAcik(true)}
        className={`${DUGME_ALTIN} max-lg:hidden`}
      >
        <Plus size={18} strokeWidth={2.25} aria-hidden />
        Deneme ekle
      </button>

      <Fab etiket="Deneme ekle" onClick={() => setAcik(true)} />

      <Modal
        acik={acik}
        kapat={() => setAcik(false)}
        baslik="Yeni deneme"
        altBaslik={`Net: ${DENEME_TURLERI[tur].yanlisBolen} yanlış 1 doğru götürür`}
        eylemler={
          <>
            <button
              type="button"
              onClick={() => setAcik(false)}
              className={`${DUGME_SESSIZ} w-full md:w-auto`}
            >
              Vazgeç
            </button>
            <button
              type="submit"
              form={FORM_ID}
              disabled={bekliyor}
              aria-busy={bekliyor}
              className={`${DUGME_ALTIN} h-12 lg:h-10 w-full max-md:order-first md:h-11 md:w-auto`}
            >
              {bekliyor && (
                <Loader2 size={16} strokeWidth={2.25} aria-hidden className="animate-spin" />
              )}
              Denemeyi kaydet
            </button>
          </>
        }
      >
        <form id={FORM_ID} action={gonder} onSubmit={gonderElle} className="flex flex-col gap-4">
          {ogrenciId && <input type="hidden" name="ogrenciId" value={ogrenciId} />}

          {!durum.ok && <Bildirim ok={false} mesaj={durum.mesaj} />}

          <div className="grid grid-cols-2 gap-4">
            <Alan
              ad="denemeAdi"
              etiket="Deneme adı"
              ipucu={`örn. ${tur} 5`}
              hatalar={durum.alanHatalari?.denemeAdi}
            />
            <Alan
              ad="tarih"
              etiket="Tarih"
              tur="date"
              gerekli
              varsayilan={bugun}
              hatalar={durum.alanHatalari?.tarih}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Secim
              ad="tur"
              etiket="Tür"
              gerekli
              secenekler={DENEME_TUR_ADLARI}
              deger={tur}
              onChange={(olay) => setTur(olay.target.value as DenemeTuru)}
              hatalar={durum.alanHatalari?.tur}
            />
            <SayiAlani
              ad="sure"
              etiket="Süre (dk)"
              min={0}
              max={1440}
              ipucu="0"
              hatalar={durum.alanHatalari?.sure}
            />
          </div>

          {/* Bölüm sonuçları — satır başına Doğru / Yanlış / Boş */}
          <fieldset className="flex flex-col gap-3 rounded-2xl border border-ots-line p-4">
            <legend className="px-1 text-[13px] font-medium text-ots-soft">Bölüm sonuçları</legend>

            <div
              aria-hidden
              className="grid grid-cols-[1fr_repeat(3,minmax(0,3.5rem))] gap-2 text-[12px] font-medium text-ots-faint sm:grid-cols-[1fr_repeat(3,minmax(0,4.5rem))]"
            >
              <span />
              <span className="text-center">Doğru</span>
              <span className="text-center">Yanlış</span>
              <span className="text-center">Boş</span>
            </div>

            {bolumler.map((bolum, i) => (
              <div
                key={bolum}
                className="grid grid-cols-[1fr_repeat(3,minmax(0,3.5rem))] items-center gap-2 sm:grid-cols-[1fr_repeat(3,minmax(0,4.5rem))]"
              >
                <span className="min-w-0 truncate text-[14px] text-ots-ink">{bolum}</span>
                {(['d', 'y', 'b'] as const).map((onek) => {
                  const ad = onek === 'd' ? 'doğru' : onek === 'y' ? 'yanlış' : 'boş';
                  return (
                    <input
                      key={onek}
                      name={`${onek}_${i}`}
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min={0}
                      placeholder="0"
                      aria-label={`${bolum} ${ad}`}
                      className={SAYI_GIRDISI}
                    />
                  );
                })}
              </div>
            ))}

            <p className="text-[12px] text-ots-faint">Sonuç girilmeyen bölümler kaydedilmez.</p>
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${kimlik}-deg`} className={ETIKET}>
              Değerlendirmen <span className="font-normal text-ots-faint">(isteğe bağlı)</span>
            </label>
            <textarea
              id={`${kimlik}-deg`}
              name="degerlendirme"
              placeholder="Nasıl geçti, nerede zorlandın?"
              className={METIN_ALANI}
            />
          </div>

          {kocMu && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${kimlik}-plan`} className={ETIKET}>
                Yapılması gerekenler{' '}
                <span className="font-normal text-ots-faint">(koç · isteğe bağlı)</span>
              </label>
              <textarea id={`${kimlik}-plan`} name="yapilmasiGerekenler" className={METIN_ALANI} />
            </div>
          )}

          {/* Yanlış nedenleri — isteğe bağlı, kapalı başlar */}
          <div className="rounded-2xl border border-ots-line p-4">
            <button
              type="button"
              onClick={() => setNedenlerAcik((v) => !v)}
              aria-expanded={nedenlerAcik}
              aria-controls={`${kimlik}-nedenler`}
              className={`${DUGME_HAYALET} w-[calc(100%+1rem)] justify-between`}
            >
              Yanlış analizi (isteğe bağlı)
              <ChevronDown
                size={18}
                strokeWidth={2}
                aria-hidden
                className={`transition-transform duration-150 ${nedenlerAcik ? 'rotate-180' : ''}`}
              />
            </button>

            {nedenlerAcik && (
              <ul id={`${kimlik}-nedenler`} className="mt-2 flex flex-col divide-y divide-ots-line">
                {YANLIS_NEDENLERI.map((neden, i) => (
                  <li key={neden} className="flex min-h-14 lg:min-h-12 items-center justify-between gap-3 py-2">
                    <label htmlFor={`${kimlik}-n-${i}`} className="text-[14px] text-ots-ink">
                      {neden}
                    </label>
                    {/* w-20 GIRDI'nin w-full'una yenilir; max-w-20 farklı özellik olduğundan 80px'e kırpar */}
                    <input
                      id={`${kimlik}-n-${i}`}
                      name={`n_${i}`}
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min={0}
                      placeholder="0"
                      className={`${SAYI_GIRDISI} max-w-20 shrink-0`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </form>
      </Modal>
    </>
  );
}

/* --------------------------------------------------------------- Deneme silme */

/**
 * Koçun deneme silmesi — iki adım (spec §8): çerçeveli "Sil" → dolu "Evet, sil"
 * + Vazgeç. Sonuç toast ile; hata metni satırda kalır.
 */
export function DenemeSil({ denemeId, denemeAdi }: { denemeId: string; denemeAdi: string }) {
  const [onay, setOnay] = useState(false);
  const [islemde, basla] = useTransition();

  function sil() {
    basla(async () => {
      const sonuc = await denemeSil(denemeId);
      if (sonuc.ok) toast.success(sonuc.mesaj);
      else toast.error(sonuc.mesaj || 'Deneme silinemedi.');
      setOnay(false);
    });
  }

  if (!onay) {
    return (
      <button
        type="button"
        onClick={() => setOnay(true)}
        aria-label={`${denemeAdi} denemesini sil`}
        className={`${DUGME_TEHLIKE} w-full sm:w-auto`}
      >
        <Trash2 size={16} strokeWidth={2} aria-hidden />
        Sil
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row" role="group" aria-label="Silme onayı">
      <button
        type="button"
        disabled={islemde}
        aria-busy={islemde}
        onClick={sil}
        className={`${DUGME_TEHLIKE_DOLU} w-full sm:w-auto`}
      >
        {islemde && <Loader2 size={16} strokeWidth={2.25} aria-hidden className="animate-spin" />}
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
  );
}
