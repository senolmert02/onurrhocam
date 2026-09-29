'use client';

import { ChevronDown, Loader2, Plus, Trash2 } from 'lucide-react';
import { useId, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { gorevEkle, gorevGuncelle, gorevSil } from '@/lib/ots/actions/program';
import { BOS_DURUM, type FormDurumu } from '@/lib/ots/dogrulama';
import { GOREV_TURLERI, ONCELIKLER } from '@/lib/ots/sabitler';
import type { GorevSatiri } from '@/lib/ots/sorgular/temel';
import { sureBicimle } from '@/lib/ots/tarih';

import { useFormGonder } from '../hooks/useFormGonder';

import { Alan, Bildirim, GIRDI, SayiAlani, Secim, SegmentliSecim } from '../Alan';
import { GerceklesenOzeti } from '../GerceklesenOzeti';
import { Modal } from '../Modal';
import {
  DUGME_ALTIN,
  DUGME_SESSIZ,
  DUGME_TEHLIKE,
  DUGME_TEHLIKE_DOLU,
  ODAK_HALKASI,
  Rozet,
} from '../Parcalar';

/* ------------------------------------------------------------------ Yardımcı */

/**
 * "Görev ekle" — spec §5.4/4: her gün kartının altında HER ZAMAN görünür,
 * kesikli çerçeve, altın metin. Yazdırmada gizli. Izgara hücresi (`group`)
 * lg+'da üstüne `lg:opacity-60 lg:group-hover:opacity-100` ekler — hiç kaybolmaz.
 */
export const GOREV_EKLE_DUGMESI =
  'yazdirma-disi flex h-11 lg:h-9 w-full items-center justify-center gap-1.5 rounded-[10px] ' +
  'border border-dashed border-ots-line-strong/60 text-[14px] font-semibold text-ots-gold-ink ' +
  'select-none touch-manipulation transition-[background-color,border-color,opacity] duration-150 ' +
  `ease-[var(--ease-ots)] hover:border-ots-line-strong hover:bg-ots-gold-tint active:bg-ots-gold-tint ${ODAK_HALKASI}`;

/* ------------------------------------------------------------ Görev modalı */

/**
 * Koçun görev ekleme / düzenleme modalı — spec §4.10 + §5.4 "Modal".
 *
 * Modal'ı kendisi çizer ki eylem çubuğundaki Kaydet düğmesi formun bekleme
 * durumunu görebilsin (çubuk formun DIŞINDA render edilir; düğme `form=` ile
 * bağlanır). md altı vaul sheet, md+ merkez diyalog — ayrım Modal'da.
 *
 * Kaydedince: toast + anında kapat (setTimeout yok). Form içi bildirim yalnızca
 * hata için. Sil iki adımlı: çerçeveli → dolu onay.
 *
 * Çağıran her açılışta `key` değiştirsin ki form durumu sıfırdan başlasın;
 * kapanışta `acik=false` ile aynı örnek kalır, çıkış animasyonu bozulmaz.
 */
export function GorevModali({
  acik,
  kapat,
  ogrenciId,
  tarih,
  tarihBasligi,
  dersler,
  gorev,
}: {
  acik: boolean;
  kapat: () => void;
  ogrenciId: string;
  tarih: string;
  /** Alt başlıkta gösterilen okunur tarih — ör. "Pazartesi · 29 Eyl". */
  tarihBasligi?: string;
  dersler: readonly string[];
  /** Verilirse düzenleme; yoksa ekleme. */
  gorev?: GorevSatiri;
}) {
  const duzenleme = Boolean(gorev);
  const formId = useId();
  // Başarı: toast + anında kapat (setTimeout yok). Eylemin içinde yapılır;
  // etkiyle durum izlemek gereksiz yeniden çizim doğururdu. useFormGonder:
  // doğrulama hatasında yazılanlar silinmez; başarıda modal kapandığı için
  // ayrıca sıfırlamaya gerek yok.
  const { durum, gonder, bekliyor, gonderElle } = useFormGonder(
    async (onceki: FormDurumu, form: FormData): Promise<FormDurumu> => {
      const sonuc = await (duzenleme ? gorevGuncelle : gorevEkle)(onceki, form);
      if (sonuc.ok) {
        toast.success(duzenleme ? 'Görev güncellendi' : 'Görev eklendi');
        kapat();
      }
      return sonuc;
    },
    BOS_DURUM,
  );
  const [siliniyor, silmeyeBasla] = useTransition();
  const [silOnayi, setSilOnayi] = useState(false);

  function sil() {
    if (!gorev) return;
    if (!silOnayi) {
      setSilOnayi(true);
      return;
    }
    silmeyeBasla(async () => {
      const sonuc = await gorevSil(gorev.id);
      if (sonuc.ok) {
        toast.success('Görev silindi');
        kapat();
      } else {
        toast.error(sonuc.mesaj || 'Görev silinemedi');
        setSilOnayi(false);
      }
    });
  }

  const hatalar = durum.ok ? undefined : durum.alanHatalari;

  const silDugmesi = duzenleme && (
    <button
      type="button"
      onClick={sil}
      disabled={siliniyor}
      aria-busy={siliniyor}
      className={`${silOnayi ? DUGME_TEHLIKE_DOLU : DUGME_TEHLIKE} h-12 lg:h-10 w-full md:h-11 md:w-auto`}
    >
      {siliniyor ? (
        <Loader2 size={16} strokeWidth={2.25} aria-hidden className="animate-spin" />
      ) : (
        <Trash2 size={16} strokeWidth={2} aria-hidden />
      )}
      {silOnayi ? 'Silmeyi onayla' : 'Sil'}
    </button>
  );

  return (
    <Modal
      acik={acik}
      kapat={kapat}
      baslik={duzenleme ? 'Görevi düzenle' : 'Görev ekle'}
      altBaslik={tarihBasligi}
      genislik="max-w-2xl"
      eylemler={
        <>
          {/* Sil: yalnızca md+ eylem çubuğunda, en solda; mobilde formun altında (spec §4.10) */}
          {duzenleme && (
            <div className="hidden md:mr-auto md:block md:order-1">{silDugmesi}</div>
          )}
          <button
            type="submit"
            form={formId}
            disabled={bekliyor}
            aria-busy={bekliyor}
            className={`${DUGME_ALTIN} order-1 h-12 lg:h-10 w-full md:order-3 md:h-11 md:w-auto`}
          >
            {bekliyor && (
              <Loader2 size={16} strokeWidth={2.25} aria-hidden className="animate-spin" />
            )}
            {duzenleme ? 'Kaydet' : 'Ekle'}
          </button>
          <button
            type="button"
            onClick={kapat}
            className={`${DUGME_SESSIZ} order-2 h-12 lg:h-10 w-full md:order-2 md:h-11 md:w-auto`}
          >
            Vazgeç
          </button>
        </>
      }
    >
      <form id={formId} action={gonder} onSubmit={gonderElle} className="flex flex-col gap-4">
        <input type="hidden" name="ogrenciId" value={ogrenciId} />
        <input type="hidden" name="tarih" value={gorev?.tarih ?? tarih} />
        {gorev && <input type="hidden" name="gorevId" value={gorev.id} />}
        {gorev && <input type="hidden" name="durum" value={gorev.durum} />}

        {!durum.ok && <Bildirim ok={false} mesaj={durum.mesaj} />}

        {/* Tamamlanmış görev düzenlenirken öğrencinin girdiği sonuç üstte, salt okunur */}
        {gorev?.durum === 'tamamlandi' && gorev.gerceklesen && (
          <GerceklesenOzeti g={gorev.gerceklesen} />
        )}

        {/* Ders + Görev türü: mobilde tek sütun, md+ iki sütun */}
        <div className="grid gap-4 md:grid-cols-2">
          <Secim
            ad="ders"
            kimlik={`${formId}-ders`}
            etiket="Ders"
            secenekler={[...dersler]}
            varsayilan={gorev?.ders ?? dersler[0]}
            gerekli
            hatalar={hatalar?.ders}
          />
          <Secim
            ad="gorevTuru"
            kimlik={`${formId}-gorevTuru`}
            etiket="Görev türü"
            secenekler={[...GOREV_TURLERI]}
            varsayilan={gorev?.gorevTuru ?? 'Soru çözümü'}
            gerekli
            hatalar={hatalar?.gorevTuru}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Alan
            ad="konu"
            kimlik={`${formId}-konu`}
            etiket="Konu"
            varsayilan={gorev?.konu}
            hatalar={hatalar?.konu}
          />
          <Alan
            ad="altKonu"
            kimlik={`${formId}-altKonu`}
            etiket="Alt konu"
            varsayilan={gorev?.altKonu}
            hatalar={hatalar?.altKonu}
          />
        </div>

        {/* Hedef soru / Süre yan yana */}
        <div className="grid grid-cols-2 gap-4">
          <SayiAlani
            ad="hedefSoru"
            kimlik={`${formId}-hedefSoru`}
            etiket="Hedef soru"
            min={0}
            varsayilan={gorev?.hedefSoru || ''}
            ipucu="0"
            hatalar={hatalar?.hedefSoru}
          />
          <SayiAlani
            ad="hedefSure"
            kimlik={`${formId}-hedefSure`}
            etiket="Süre (dk)"
            min={0}
            varsayilan={gorev?.hedefSure || ''}
            ipucu="0"
            hatalar={hatalar?.hedefSure}
          />
        </div>

        {/* Başlangıç / Bitiş yan yana */}
        <div className="grid grid-cols-2 gap-4">
          <Alan
            ad="baslangicSaati"
            kimlik={`${formId}-baslangicSaati`}
            etiket="Başlangıç"
            tur="time"
            varsayilan={gorev?.baslangicSaati?.slice(0, 5) ?? ''}
            hatalar={hatalar?.baslangicSaati}
          />
          <Alan
            ad="bitisSaati"
            kimlik={`${formId}-bitisSaati`}
            etiket="Bitiş"
            tur="time"
            varsayilan={gorev?.bitisSaati?.slice(0, 5) ?? ''}
            hatalar={hatalar?.bitisSaati}
          />
        </div>

        <Alan
          ad="aciklama"
          kimlik={`${formId}-aciklama`}
          etiket="Açıklama"
          varsayilan={gorev?.aciklama}
          ipucu="Kaynak, sayfa, uyarı…"
          hatalar={hatalar?.aciklama}
        />

        <SegmentliSecim
          ad="oncelik"
          kimlik={`${formId}-oncelik`}
          etiket="Öncelik"
          secenekler={[...ONCELIKLER]}
          varsayilan={gorev?.oncelik ?? 'Normal'}
        />

        {/* Sil: md altında eylem çubuğunun dışında, formun en altında (spec §4.10 sheet) */}
        {duzenleme && (
          <div className="mt-2 border-t border-ots-line pt-4 md:hidden">{silDugmesi}</div>
        )}
      </form>
    </Modal>
  );
}

/* ---------------------------------------------------- Satır içi ekleme formu */

/**
 * Koçun öğrenci detay sayfasında bir güne hızlı görev eklemesi (satır içi).
 * Aynı sayfada gün başına bir örnek yaşadığı için girdiler `id` yerine
 * `aria-label` taşır — Alan bileşenlerinin sabit id'leri çakışırdı.
 */
export function GorevEkleFormu({
  ogrenciId,
  tarih,
  dersler,
}: {
  ogrenciId: string;
  tarih: string;
  dersler: readonly string[];
}) {
  const [acik, setAcik] = useState(false);
  // Tekrarlanan formlarda benzersiz id öneki (gün başına bir örnek).
  const formId = `gorev-ekle-${tarih}`;
  // Başarı: toast + formu kapat — eylemin içinde. Başarıda form unmount olur,
  // basaridaSifirla gereksiz; hatada yazılanlar korunur.
  const { durum, gonder, bekliyor, gonderElle } = useFormGonder(
    async (onceki: FormDurumu, form: FormData): Promise<FormDurumu> => {
      const sonuc = await gorevEkle(onceki, form);
      if (sonuc.ok) {
        toast.success('Görev eklendi');
        setAcik(false);
      }
      return sonuc;
    },
    BOS_DURUM,
  );

  if (!acik) {
    return (
      <button type="button" onClick={() => setAcik(true)} className={GOREV_EKLE_DUGMESI}>
        <Plus size={16} strokeWidth={2} aria-hidden />
        Görev ekle
      </button>
    );
  }

  return (
    <form
      action={gonder}
      onSubmit={gonderElle}
      className="flex flex-col gap-4 rounded-2xl border border-ots-line bg-ots-raised p-4"
    >
      <input type="hidden" name="ogrenciId" value={ogrenciId} />
      <input type="hidden" name="tarih" value={tarih} />

      {!durum.ok && <Bildirim ok={false} mesaj={durum.mesaj} />}

      <div className="grid gap-4 md:grid-cols-2">
        <SadeSecim ad="ders" etiket="Ders" secenekler={dersler} gerekli />
        <SadeSecim
          ad="gorevTuru"
          etiket="Görev türü"
          secenekler={GOREV_TURLERI}
          varsayilan="Soru çözümü"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input name="konu" placeholder="Konu" className={GIRDI} aria-label="Konu" />
        <input name="altKonu" placeholder="Alt konu" className={GIRDI} aria-label="Alt konu" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <input
          name="hedefSoru"
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          min={0}
          placeholder="Hedef soru"
          className={`${GIRDI} ots-sayi text-center font-semibold`}
          aria-label="Hedef soru"
        />
        <input
          name="hedefSure"
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          min={0}
          placeholder="Süre (dk)"
          className={`${GIRDI} ots-sayi text-center font-semibold`}
          aria-label="Hedef süre (dakika)"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <input
          name="baslangicSaati"
          type="time"
          className={GIRDI}
          aria-label="Başlangıç saati"
        />
        <input name="bitisSaati" type="time" className={GIRDI} aria-label="Bitiş saati" />
      </div>

      <input
        name="aciklama"
        placeholder="Açıklama / kaynak"
        className={GIRDI}
        aria-label="Açıklama"
      />

      <SegmentliSecim
        ad="oncelik"
        kimlik={`${formId}-oncelik`}
        etiket="Öncelik"
        secenekler={[...ONCELIKLER]}
        varsayilan="Normal"
      />

      <div className="flex flex-col gap-2 border-t border-ots-line pt-4 sm:flex-row-reverse">
        <button
          type="submit"
          disabled={bekliyor}
          aria-busy={bekliyor}
          className={`${DUGME_ALTIN} h-12 lg:h-10 w-full sm:h-11 sm:w-auto`}
        >
          {bekliyor && <Loader2 size={16} strokeWidth={2.25} aria-hidden className="animate-spin" />}
          Ekle
        </button>
        <button
          type="button"
          onClick={() => setAcik(false)}
          className={`${DUGME_SESSIZ} h-12 lg:h-10 w-full sm:h-11 sm:w-auto`}
        >
          Vazgeç
        </button>
      </div>
    </form>
  );
}

/** `Secim`in id'siz sürümü — aynı sayfada birden çok form için. */
function SadeSecim({
  ad,
  etiket,
  secenekler,
  varsayilan,
  gerekli,
}: {
  ad: string;
  etiket: string;
  secenekler: readonly string[];
  varsayilan?: string;
  gerekli?: boolean;
}) {
  return (
    <div className="relative">
      <select
        name={ad}
        aria-label={etiket}
        required={gerekli}
        defaultValue={varsayilan}
        className={`${GIRDI} appearance-none pr-10`}
      >
        {secenekler.map((s) => (
          <option key={s} value={s} className="bg-ots-surface text-ots-ink">
            {s}
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
  );
}

/* --------------------------------------------------------- Koç görev satırı */

/** Koç görünümünde tek görev satırı — iki adımlı silme. */
export function KocGorevSatiri({ gorev }: { gorev: GorevSatiri }) {
  const [siliniyor, basla] = useTransition();
  const [onay, setOnay] = useState(false);
  const [hata, setHata] = useState('');

  function sil() {
    if (!onay) {
      setOnay(true);
      return;
    }
    basla(async () => {
      const sonuc = await gorevSil(gorev.id);
      if (sonuc.ok) {
        toast.success('Görev silindi');
      } else {
        setHata(sonuc.mesaj);
        setOnay(false);
      }
    });
  }

  const g = gorev.gerceklesen;
  const tamamlandi = gorev.durum === 'tamamlandi';

  return (
    <li
      className={`rounded-2xl border p-4 ${
        tamamlandi ? 'border-ots-yesil/30 bg-ots-yesil-tint' : 'border-ots-line bg-ots-surface'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-ots-ink">
            {gorev.ders}
            {tamamlandi && <Rozet ton="yesil">Tamamlandı</Rozet>}
            {gorev.oncelik === 'Yüksek' && <Rozet ton="kirmizi">Yüksek öncelik</Rozet>}
          </p>
          {(gorev.konu || gorev.altKonu) && (
            <p className="mt-0.5 text-[13px] leading-snug text-ots-soft">
              {[gorev.konu, gorev.altKonu].filter(Boolean).join(' · ')}
            </p>
          )}
          <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-ots-faint">
            <span>{gorev.gorevTuru}</span>
            {gorev.baslangicSaati && <span>{gorev.baslangicSaati.slice(0, 5)}</span>}
            {gorev.hedefSoru > 0 && <span>{gorev.hedefSoru} soru</span>}
            {gorev.hedefSure > 0 && <span>{sureBicimle(gorev.hedefSure)}</span>}
          </p>
          {g && (
            <p className="ots-sayi mt-1.5 text-[13px] text-ots-soft">
              Gerçekleşen: S {g.soru} · D {g.dogru} · Y {g.yanlis} · B {g.bos} ·{' '}
              {sureBicimle(g.sure)}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={sil}
          disabled={siliniyor}
          aria-busy={siliniyor}
          aria-label={onay ? `${gorev.ders} görevini silmeyi onayla` : `${gorev.ders} görevini sil`}
          className={`${onay ? DUGME_TEHLIKE_DOLU : DUGME_TEHLIKE} shrink-0`}
        >
          {siliniyor ? (
            <Loader2 size={16} strokeWidth={2.25} aria-hidden className="animate-spin" />
          ) : (
            <Trash2 size={16} strokeWidth={2} aria-hidden />
          )}
          {onay ? 'Onayla' : 'Sil'}
        </button>
      </div>
      {hata && (
        <p role="alert" className="mt-2 text-[13px] font-medium text-ots-kirmizi">
          {hata}
        </p>
      )}
    </li>
  );
}
