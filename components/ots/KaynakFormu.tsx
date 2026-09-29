'use client';

import { Loader2, Plus } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { toast } from 'sonner';

import { kaynakEkle } from '@/lib/ots/actions/kaynak';
import { BOS_DURUM, KAYNAK_TURLERI } from '@/lib/ots/dogrulama';

import { Alan, Bildirim, GIRDI, Secim } from './Alan';
import { Fab } from './Fab';
import { useFormGonder } from './hooks/useFormGonder';
import { Modal } from './Modal';
import { DUGME_ALTIN, DUGME_SESSIZ } from './Parcalar';

/**
 * Kaynak ekleme — tetikleyiciler + Modal (md altı sheet, md+ diyalog).
 *
 * Sayfanın tek birincil eylemi budur (spec §4.1 "sayfa başına 1 birincil"):
 * lg altında FAB (spec §5.5), lg ve üstünde `SayfaBasi`'na oturan altın düğme.
 * İkisi aynı modalı açar. FAB'ın kaydırma/klavye gizlemesi ortak `Fab`
 * bileşenindedir (spec §5.1).
 *
 * Form başarıyla kaydedilince anında kapanır ve `toast.success` çıkar
 * (`setTimeout` yok — spec §9/14). Modal her açılışta yeniden kurulur
 * (`key`), böylece bir önceki denemenin hataları yeni forma taşınmaz.
 */
export function KaynakFormu({
  ogrenciId,
  dersler,
  altBaslik,
}: {
  /** Koç için zorunlu; öğrencide verilmez (kimlik oturumdan gelir). */
  ogrenciId?: string;
  /** Öğrencinin sınav türüne göre ders listesi — konu kataloğuyla aynı adlar. */
  dersler: readonly string[];
  /** Modal alt başlığı — koçta öğrencinin adı. */
  altBaslik?: string;
}) {
  const [acik, setAcik] = useState(false);
  // Her açılışta artar → modal içi form durumu sıfırdan kurulur
  const [anahtar, setAnahtar] = useState(0);

  function ac() {
    setAnahtar((k) => k + 1);
    setAcik(true);
  }

  // Sabit kimlik: modal içindeki başarı efekti buna bağlı, her render'da yenilenmesin
  const kapat = useCallback(() => setAcik(false), []);

  return (
    <>
      {/* lg+: sayfa başındaki birincil düğme */}
      <button type="button" onClick={ac} className={`${DUGME_ALTIN} max-lg:hidden`}>
        <Plus size={18} strokeWidth={2.25} aria-hidden />
        Kaynak ekle
      </button>

      {/* lg altı: ortak FAB — kaydırma/klavye gizlemesi bileşenin içinde */}
      <Fab etiket="Kaynak ekle" onClick={ac} />

      <KaynakModali
        key={anahtar}
        acik={acik}
        kapat={kapat}
        ogrenciId={ogrenciId}
        dersler={dersler}
        altBaslik={altBaslik}
      />
    </>
  );
}

/* -------------------------------------------------------------------- Modal */

function KaynakModali({
  acik,
  kapat,
  ogrenciId,
  dersler,
  altBaslik,
}: {
  acik: boolean;
  kapat: () => void;
  ogrenciId?: string;
  dersler: readonly string[];
  altBaslik?: string;
}) {
  // Hata dönünce yazılanlar silinmesin; başarıda modal kapanıp form unmount olur (sıfırlama gereksiz)
  const { durum, gonder, bekliyor, gonderElle } = useFormGonder(kaynakEkle, BOS_DURUM);
  const formId = useId();
  // Aynı durum nesnesi iki kez işlenmesin (StrictMode çift efekt)
  const sonIslenen = useRef(durum);

  useEffect(() => {
    if (durum === sonIslenen.current) return;
    sonIslenen.current = durum;
    if (durum.ok) {
      toast.success(durum.mesaj);
      kapat();
    }
  }, [durum, kapat]);

  const hatalar = durum.alanHatalari;

  const eylemler = (
    <>
      <button
        type="button"
        onClick={kapat}
        disabled={bekliyor}
        className={`${DUGME_SESSIZ} h-12 lg:h-10 w-full md:h-11 md:w-auto`}
      >
        Vazgeç
      </button>
      {/* Md altı: Kaydet üstte (order-first); md+: sağda */}
      <button
        type="submit"
        form={formId}
        disabled={bekliyor}
        aria-busy={bekliyor}
        className={`${DUGME_ALTIN} order-first h-12 lg:h-10 w-full md:order-none md:h-11 md:w-auto`}
      >
        {bekliyor && <Loader2 size={16} strokeWidth={2.25} aria-hidden className="animate-spin" />}
        Kaydet
      </button>
    </>
  );

  return (
    <Modal acik={acik} kapat={kapat} baslik="Kaynak ekle" altBaslik={altBaslik} eylemler={eylemler}>
      <form id={formId} action={gonder} onSubmit={gonderElle} className="flex flex-col gap-4">
        {ogrenciId && <input type="hidden" name="ogrenciId" value={ogrenciId} />}

        {/* Form içi bildirim yalnızca hata; başarı toast'a gider */}
        <Bildirim ok={false} mesaj={durum.ok ? '' : durum.mesaj} />

        {dersler.length > 0 ? (
          <Secim
            ad="ders"
            etiket="Ders"
            secenekler={[...dersler]}
            varsayilan={dersler[0]}
            gerekli
            hatalar={hatalar?.ders}
          />
        ) : (
          <Alan ad="ders" etiket="Ders" gerekli ipucu="örn. TYT Matematik" hatalar={hatalar?.ders} />
        )}

        <Alan
          ad="ad"
          etiket="Kaynak adı"
          gerekli
          ipucu="örn. 3D Yayınları TYT Matematik Soru Bankası"
          hatalar={hatalar?.ad}
        />

        <Secim
          ad="tur"
          etiket="Tür"
          secenekler={[...KAYNAK_TURLERI]}
          varsayilan={KAYNAK_TURLERI[0]}
          gerekli
          hatalar={hatalar?.tur}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="notMetni" className="text-[13px] font-medium leading-snug text-ots-soft">
            Not
            <span className="ml-1 font-normal text-ots-faint">(isteğe bağlı)</span>
          </label>
          <textarea
            id="notMetni"
            name="notMetni"
            placeholder="Hangi bölümler bitti, nereden devam edilecek…"
            className={`${GIRDI} min-h-28 resize-y py-3`}
          />
        </div>
      </form>
    </Modal>
  );
}
