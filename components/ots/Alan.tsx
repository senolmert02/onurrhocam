/**
 * ÖTS form alanları — spec §4.5–4.6.
 *
 * `GIRDI` yalnızca buradan dışa aktarılır; girdi sınırı `line-strong` (≥3:1),
 * yazı 16px (iOS zoom yok), yükseklik 48px. Hata mesajları `aria-live` ile
 * duyurulur ve girdiye `aria-invalid` / `aria-describedby` bağlanır — hata
 * yalnızca kırmızı bir çerçeve değil, ikonlu ve okunan bir metindir.
 *
 * Bu modülde hook yok; hem sunucu hem istemci formlarından içe aktarılabilir.
 */

import { CheckCircle2, ChevronDown, CircleAlert, Loader2 } from 'lucide-react';

import { DUGME_ALTIN } from './Parcalar';

/* --------------------------------------------------------------- Sınıf reçetesi */

/** Tek girdi reçetesi — input, select ve textarea bunun üstüne kurulur. */
export const GIRDI =
  /* lg altı 16px (iOS odakta yakınlaştırmasın); lg+ fare ölçüsü 40px / 14px */
  'h-12 w-full rounded-[10px] border border-ots-line-strong bg-ots-surface px-3.5 text-[16px] text-ots-ink ' +
  'lg:h-10 lg:rounded-lg lg:text-[14px] ' +
  'placeholder:text-ots-faint outline-none transition-[border-color,box-shadow] duration-150 ' +
  'hover:border-ots-faint focus:outline-none focus:border-ots-gold-deep focus:ring-2 focus:ring-ots-gold-deep/40 ' +
  'aria-[invalid=true]:border-ots-kirmizi aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-ots-kirmizi/20 ' +
  'aria-[invalid=true]:focus:border-ots-kirmizi aria-[invalid=true]:focus:ring-ots-kirmizi/30 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

const ETIKET = 'text-[13px] font-medium leading-snug text-ots-soft';

/* ------------------------------------------------------------------ Yardımcılar */

function Etiket({
  icin,
  children,
  aciklama,
  istegeBagli,
}: {
  icin: string;
  children: React.ReactNode;
  aciklama?: string;
  istegeBagli?: boolean;
}) {
  return (
    <label htmlFor={icin} className={ETIKET}>
      {children}
      {aciklama ? (
        <span className="ml-1 font-normal text-ots-faint">{aciklama}</span>
      ) : (
        istegeBagli && <span className="ml-1 font-normal text-ots-faint">(isteğe bağlı)</span>
      )}
    </label>
  );
}

function HataMetni({ id, mesaj }: { id: string; mesaj: string }) {
  return (
    <p id={id} aria-live="polite" className="flex items-center gap-1 text-[13px] font-medium text-ots-kirmizi">
      <CircleAlert size={14} strokeWidth={2} aria-hidden className="shrink-0" />
      {mesaj}
    </p>
  );
}

/* ------------------------------------------------------------------------ Alan */

type AlanOzellikleri = {
  ad: string;
  etiket: string;
  tur?: React.HTMLInputTypeAttribute;
  gerekli?: boolean;
  varsayilan?: string;
  ipucu?: string;
  otomatik?: string;
  /** Etiketin yanında duran kısa açıklama — "(isteğe bağlı)" yerine geçer. */
  aciklama?: string;
  hatalar?: string[];
  /**
   * DOM kimliği; verilmezse `ad` kullanılır. Aynı sayfada aynı formun birden
   * çok kopyası çizildiğinde (ör. görev kartları) id çakışmasını önlemek için
   * benzersiz bir önekle verilmelidir. `name` her zaman `ad` kalır.
   */
  kimlik?: string;
};

export function Alan({
  ad,
  etiket,
  tur = 'text',
  gerekli,
  varsayilan,
  ipucu,
  otomatik,
  aciklama,
  hatalar,
  kimlik,
}: AlanOzellikleri) {
  const hataVar = Boolean(hatalar?.length);
  const id = kimlik ?? ad;
  const hataId = `${id}-hata`;

  return (
    <div className="flex flex-col gap-1.5">
      <Etiket icin={id} aciklama={aciklama} istegeBagli={!gerekli}>
        {etiket}
      </Etiket>

      <input
        id={id}
        name={ad}
        type={tur}
        required={gerekli}
        defaultValue={varsayilan}
        autoComplete={otomatik}
        aria-invalid={hataVar}
        aria-describedby={hataVar ? hataId : undefined}
        className={GIRDI}
        placeholder={ipucu}
      />

      {hataVar && <HataMetni id={hataId} mesaj={hatalar![0]} />}
    </div>
  );
}

/* ----------------------------------------------------------------------- Seçim */

export function Secim({
  ad,
  etiket,
  secenekler,
  varsayilan,
  etiketler,
  hatalar,
  gerekli,
  aciklama,
  deger,
  onChange,
  kimlik,
}: {
  ad: string;
  etiket: string;
  secenekler: string[];
  varsayilan?: string;
  /** Değer → görünen metin; verilmeyen seçenek kendi değeriyle gösterilir. */
  etiketler?: Record<string, string>;
  hatalar?: string[];
  gerekli?: boolean;
  aciklama?: string;
  /** Kontrollü kullanım (istemci formları). Verilirse `varsayilan` yoksayılır. */
  deger?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  /** DOM kimliği; verilmezse `ad`. Çoklu form kopyalarında benzersiz önek verin. */
  kimlik?: string;
}) {
  const hataVar = Boolean(hatalar?.length);
  const id = kimlik ?? ad;
  const hataId = `${id}-hata`;
  const kontrollu = deger !== undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <Etiket icin={id} aciklama={aciklama} istegeBagli={!gerekli}>
        {etiket}
      </Etiket>

      <div className="relative">
        <select
          id={id}
          name={ad}
          required={gerekli}
          {...(kontrollu ? { value: deger, onChange } : { defaultValue: varsayilan, onChange })}
          aria-invalid={hataVar}
          aria-describedby={hataVar ? hataId : undefined}
          className={`${GIRDI} appearance-none bg-ots-surface pr-10 text-ots-ink`}
        >
          {secenekler.map((s) => (
            <option key={s} value={s} className="bg-ots-surface text-ots-ink">
              {etiketler?.[s] ?? s}
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

      {hataVar && <HataMetni id={hataId} mesaj={hatalar![0]} />}
    </div>
  );
}

/* ------------------------------------------------------------------- Sayı alanı */

export function SayiAlani({
  ad,
  etiket,
  varsayilan,
  min,
  max,
  ipucu,
  adim,
  gerekli,
  hatalar,
  kimlik,
}: {
  ad: string;
  etiket: string;
  varsayilan?: number | string;
  min?: number;
  max?: number;
  ipucu?: string;
  adim?: number;
  gerekli?: boolean;
  hatalar?: string[];
  /** DOM kimliği; verilmezse `ad`. Çoklu form kopyalarında benzersiz önek verin. */
  kimlik?: string;
}) {
  const hataVar = Boolean(hatalar?.length);
  const id = kimlik ?? ad;
  const hataId = `${id}-hata`;

  return (
    <div className="flex flex-col gap-1.5">
      <Etiket icin={id} istegeBagli={false}>
        {etiket}
      </Etiket>

      <input
        id={id}
        name={ad}
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        min={min}
        max={max}
        step={adim}
        required={gerekli}
        defaultValue={varsayilan}
        placeholder={ipucu}
        aria-invalid={hataVar}
        aria-describedby={hataVar ? hataId : undefined}
        className={`${GIRDI} ots-sayi text-center font-semibold`}
      />

      {hataVar && <HataMetni id={hataId} mesaj={hatalar![0]} />}
    </div>
  );
}

/* ------------------------------------------------------------- Segmentli seçim */

/**
 * 2–4 seçenekli alanlar için segmented control — Öncelik gibi.
 * Gerçek radio girdileri görsel olarak gizli; seçili hâl CSS `has-checked` ile
 * gelir, JS/hook gerekmez. Form gönderiminde `name=ad` ile değer taşınır.
 */
export function SegmentliSecim({
  ad,
  secenekler,
  varsayilan,
  etiketler,
  etiket,
  kimlik,
}: {
  ad: string;
  secenekler: string[];
  varsayilan: string;
  etiketler?: Record<string, string>;
  /** Görünür grup etiketi; verilmezse grup `aria-label` olarak `ad` kullanılır. */
  etiket?: string;
  /** Grup etiketi id öneki; verilmezse `ad`. Çoklu form kopyalarında benzersiz önek verin. */
  kimlik?: string;
}) {
  const etiketId = `${kimlik ?? ad}-etiket`;

  return (
    <div className="flex flex-col gap-1.5">
      {etiket && (
        <span id={etiketId} className={ETIKET}>
          {etiket}
        </span>
      )}
      <div
        role="radiogroup"
        aria-labelledby={etiket ? etiketId : undefined}
        aria-label={etiket ? undefined : ad}
        className="grid gap-1 rounded-[10px] border border-ots-line-strong p-1"
        style={{ gridTemplateColumns: `repeat(${secenekler.length}, minmax(0, 1fr))` }}
      >
        {secenekler.map((s) => (
          <label
            key={s}
            className="relative flex h-10 cursor-pointer select-none items-center justify-center rounded-[8px] px-2 text-[14px] font-semibold lg:h-8 lg:rounded-md lg:text-[13px] text-ots-soft transition-[background-color,color,box-shadow] duration-150 ease-[var(--ease-ots)] has-checked:bg-ots-raised has-checked:text-ots-ink has-checked:shadow-[inset_0_0_0_1px_var(--color-ots-line-strong)] has-focus-visible:ring-2 has-focus-visible:ring-ots-gold-deep has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-ots-surface"
          >
            <input type="radio" name={ad} value={s} defaultChecked={s === varsayilan} className="sr-only" />
            <span className="truncate">{etiketler?.[s] ?? s}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- Bildirim */

/**
 * Form başındaki genel bildirim. Tasarım sisteminde form içi bildirim yalnızca
 * HATA içindir; başarı `toast.success()` ile verilir. Toast entegrasyonu
 * tamamlanana dek `ok=true` da görünür kalır (yeşil tint).
 */
export function Bildirim({ ok, mesaj }: { ok: boolean; mesaj: string }) {
  if (!mesaj) return null;

  const Ikon = ok ? CheckCircle2 : CircleAlert;

  return (
    <div
      role={ok ? 'status' : 'alert'}
      aria-live="polite"
      className={`flex items-start gap-2 rounded-[10px] border px-3.5 py-3 text-[14px] leading-snug ${
        ok
          ? 'border-ots-yesil/40 bg-ots-yesil-tint text-ots-yesil'
          : 'border-ots-kirmizi/30 bg-ots-kirmizi-tint text-ots-kirmizi'
      }`}
    >
      <Ikon size={16} strokeWidth={2} aria-hidden className="mt-0.5 shrink-0" />
      <span>{mesaj}</span>
    </div>
  );
}

/* --------------------------------------------------------------- Gönder düğmesi */

/** Formun birincil düğmesi — metin sabit kalır, beklerken sola dönen ikon gelir. */
export function GonderDugmesi({
  bekliyor,
  children,
  className = '',
}: {
  bekliyor: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={bekliyor}
      aria-busy={bekliyor}
      className={`${DUGME_ALTIN} h-12 w-full lg:h-10 ${className}`}
    >
      {bekliyor && <Loader2 size={16} strokeWidth={2.25} aria-hidden className="animate-spin" />}
      {children}
    </button>
  );
}
