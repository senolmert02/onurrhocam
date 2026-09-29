'use client';

import { Check, ChevronDown, Loader2, Pencil } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useId, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { useFormGonder } from '@/components/ots/hooks/useFormGonder';

import { konuDurumuGuncelle } from '@/lib/ots/actions/konu';
import { BOS_DURUM, type FormDurumu } from '@/lib/ots/dogrulama';
import { KONU_DURUMLARI, konuTamamMi } from '@/lib/ots/sabitler';
import { trTarih } from '@/lib/ots/tarih';

import { Bildirim, GIRDI } from '../Alan';
import {
  DUGME_ALTIN,
  DUGME_IKON,
  DUGME_SESSIZ,
  Rozet,
  type RozetTonu,
} from '../Parcalar';

/** Konu durumu → rozet tonu. Renk tek başına anlam taşımaz; metin her zaman yanında. */
export const KONU_TONLARI: Record<string, RozetTonu> = {
  'Tamamlandı': 'yesil',
  'Deneme ile kontrol edildi': 'yesil',
  'Çalışılıyor': 'sari',
  'Tekrar gerekli': 'kirmizi',
  'Eksik': 'kirmizi',
  'Başlanmadı': 'notr',
};

export type KonuKayitOzeti = {
  durum: string;
  soruSayisi: number;
  basariYuzdesi: number;
  tekrarTarihi: string | null;
  tamamlanmaTarihi: string | null;
  notMetni: string;
} | null;

/* Tek easing — spec §2.1 */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const ETIKET = 'text-[13px] font-medium leading-snug text-ots-soft';
const SAYI_GIRDISI = `${GIRDI} ots-sayi text-center font-semibold`;

/**
 * Tek konunun koç tarafından yönetildiği satır — spec §8 "Konu kartları".
 *
 * Satırın tamamı bir `<label>`: 22px onay kutusu konuyu "Tamamlandı" yapar ya da
 * geri "Çalışılıyor"a alır (hızlı yol, mevcut soru/başarı/not korunur). Sağdaki
 * kalem ayrıntı formunu açar: durum listesi, tekrar tarihi, soru, başarı, not.
 * Başarı toast ile duyurulur; form içi bildirim yalnızca hata içindir.
 */
export function KonuSatiri({
  ogrenciId,
  konuId,
  konuAdi,
  kayit,
}: {
  ogrenciId: string;
  konuId: string;
  konuAdi: string;
  kayit: KonuKayitOzeti;
}) {
  const [hizliBekliyor, hizliBasla] = useTransition();
  const [acik, setAcik] = useState(false);
  const azalt = useReducedMotion() === true;
  const kimlik = useId();

  const mevcutDurum = kayit?.durum ?? 'Başlanmadı';
  const tamam = konuTamamMi(mevcutDurum);

  // Kaydedince anında kapat + toast (spec §4.6); hata formda kalır ve yazılanlar
  // silinmez (useFormGonder). Başarıda form zaten kapanıp unmount olur.
  const { durum, gonder, bekliyor, gonderElle } = useFormGonder(
    async (onceki: FormDurumu, form: FormData) => {
      const sonuc = await konuDurumuGuncelle(onceki, form);
      if (sonuc.ok) {
        toast.success(sonuc.mesaj);
        setAcik(false);
      }
      return sonuc;
    },
    BOS_DURUM,
  );

  /** Onay kutusu: diğer alanlar korunur, yalnızca durum değişir. */
  function hizliDegistir(isaretli: boolean) {
    const veri = new FormData();
    veri.set('ogrenciId', ogrenciId);
    veri.set('konuId', konuId);
    veri.set('durum', isaretli ? 'Tamamlandı' : 'Çalışılıyor');
    veri.set('soruSayisi', String(kayit?.soruSayisi ?? 0));
    veri.set('basariYuzdesi', String(kayit?.basariYuzdesi ?? 0));
    veri.set('tekrarTarihi', kayit?.tekrarTarihi ?? '');
    veri.set('notMetni', kayit?.notMetni ?? '');

    hizliBasla(async () => {
      const sonuc = await konuDurumuGuncelle(BOS_DURUM, veri);
      if (sonuc.ok) toast.success(sonuc.mesaj);
      else toast.error(sonuc.mesaj || 'Konu durumu güncellenemedi.');
    });
  }

  return (
    <li className="border-b border-ots-line last:border-0">
      {/* Satır 48px; label self-stretch ile satırın tamamını dokunma alanı yapar (spec §5.7) */}
      <div className="flex min-h-12 lg:min-h-10 items-center gap-3 px-1">
        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 self-stretch py-1">
          {/*
            Onay kutusu bekleme sırasında DOM'dan çıkmaz: klavye odağı korunur.
            `disabled` bilerek kullanılmıyor (odaklı öğeyi blur eder); çift gönderim
            aria-disabled + olay korumasıyla engellenir. Odak halkası sarmalayıcıda,
            böylece kutu gizliyken de görünür kalır.
          */}
          <span
            className="relative grid h-[22px] w-[22px] shrink-0 place-items-center rounded has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ots-gold-deep has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-ots-bg"
          >
            <input
              type="checkbox"
              checked={tamam}
              onClick={(olay) => {
                if (hizliBekliyor) olay.preventDefault();
              }}
              onChange={(olay) => {
                if (hizliBekliyor) return;
                hizliDegistir(olay.target.checked);
              }}
              aria-label={`${konuAdi} tamamlandı`}
              aria-busy={hizliBekliyor}
              aria-disabled={hizliBekliyor}
              className={`h-[22px] w-[22px] rounded accent-[var(--color-ots-yesil)] focus-visible:outline-none ${hizliBekliyor ? 'cursor-wait opacity-0' : 'cursor-pointer'}`}
            />
            {hizliBekliyor && (
              <Loader2
                size={20}
                strokeWidth={2}
                aria-hidden
                className="pointer-events-none absolute animate-spin text-ots-faint"
              />
            )}
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] leading-[1.5] text-ots-ink">{konuAdi}</span>
            {kayit?.notMetni && (
              <span className="block truncate text-[13px] leading-snug text-ots-soft">
                {kayit.notMetni}
              </span>
            )}
          </span>
        </label>

        <div className="flex shrink-0 items-center gap-2">
          {kayit?.tamamlanmaTarihi && (
            <span className="ots-sayi hidden items-center gap-1 text-[12px] text-ots-faint sm:inline-flex">
              <Check size={14} strokeWidth={2} aria-hidden />
              {trTarih(kayit.tamamlanmaTarihi)}
            </span>
          )}
          <Rozet ton={KONU_TONLARI[mevcutDurum] ?? 'notr'}>{mevcutDurum}</Rozet>
          <button
            type="button"
            onClick={() => setAcik((v) => !v)}
            aria-expanded={acik}
            aria-controls={`${kimlik}-form`}
            aria-label={acik ? `${konuAdi} ayrıntılarını kapat` : `${konuAdi} ayrıntılarını düzenle`}
            className={DUGME_IKON}
          >
            {acik ? (
              <ChevronDown size={18} strokeWidth={2} aria-hidden />
            ) : (
              <Pencil size={18} strokeWidth={2} aria-hidden />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {acik && (
          <motion.div
            id={`${kimlik}-form`}
            key="form"
            initial={azalt ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: azalt ? 0 : 0.22, ease: EASE }}
            className="overflow-hidden"
          >
            <form
              action={gonder}
              onSubmit={gonderElle}
              className="mx-1 mb-3 flex flex-col gap-4 rounded-2xl bg-ots-raised p-4"
            >
              <input type="hidden" name="ogrenciId" value={ogrenciId} />
              <input type="hidden" name="konuId" value={konuId} />

              {!durum.ok && <Bildirim ok={false} mesaj={durum.mesaj} />}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`${kimlik}-durum`} className={ETIKET}>
                    Durum
                  </label>
                  <div className="relative">
                    <select
                      id={`${kimlik}-durum`}
                      name="durum"
                      defaultValue={mevcutDurum}
                      className={`${GIRDI} appearance-none pr-10`}
                    >
                      {KONU_DURUMLARI.map((d) => (
                        <option key={d} value={d} className="bg-ots-surface text-ots-ink">
                          {d}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      strokeWidth={2}
                      aria-hidden
                      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ots-faint"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`${kimlik}-tekrar`} className={ETIKET}>
                    Tekrar tarihi <span className="font-normal text-ots-faint">(isteğe bağlı)</span>
                  </label>
                  <input
                    id={`${kimlik}-tekrar`}
                    name="tekrarTarihi"
                    type="date"
                    defaultValue={kayit?.tekrarTarihi ?? ''}
                    className={GIRDI}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`${kimlik}-soru`} className={ETIKET}>
                    Çözülen soru
                  </label>
                  <input
                    id={`${kimlik}-soru`}
                    name="soruSayisi"
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min={0}
                    defaultValue={kayit?.soruSayisi ?? 0}
                    className={SAYI_GIRDISI}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`${kimlik}-basari`} className={ETIKET}>
                    Başarı %
                  </label>
                  <input
                    id={`${kimlik}-basari`}
                    name="basariYuzdesi"
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min={0}
                    max={100}
                    defaultValue={kayit?.basariYuzdesi ?? 0}
                    className={SAYI_GIRDISI}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${kimlik}-not`} className={ETIKET}>
                  Not <span className="font-normal text-ots-faint">(isteğe bağlı)</span>
                </label>
                <input
                  id={`${kimlik}-not`}
                  name="notMetni"
                  defaultValue={kayit?.notMetni ?? ''}
                  placeholder="Kısa bir not"
                  className={GIRDI}
                />
              </div>

              {/* Liste içi kayıt — görev kartındaki "Tamamla" gibi liste istisnası */}
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setAcik(false)}
                  className={`${DUGME_SESSIZ} w-full sm:w-auto`}
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={bekliyor}
                  aria-busy={bekliyor}
                  className={`${DUGME_ALTIN} w-full max-sm:order-first sm:w-auto`}
                >
                  {bekliyor && (
                    <Loader2 size={16} strokeWidth={2.25} aria-hidden className="animate-spin" />
                  )}
                  Kaydet
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
