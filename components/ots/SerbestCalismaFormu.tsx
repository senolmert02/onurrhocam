'use client';

import { Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { serbestCalismaEkle } from '@/lib/ots/actions/gorev';
import { BOS_DURUM, type FormDurumu } from '@/lib/ots/dogrulama';

import { Alan, Bildirim, SayiAlani, Secim } from './Alan';
import { Fab } from './Fab';
import { useFormGonder } from './hooks/useFormGonder';
import { Modal } from './Modal';
import { DUGME_ALTIN, DUGME_SESSIZ } from './Parcalar';

const FORM_ID = 'serbest-calisma-formu';

/**
 * Programda olmayan çalışmanın kaydı — spec §5.5 / §8.
 *
 * Bileşen tetikleyicileri de taşır. `tetikleyici="fab"` (varsayılan): lg
 * altında FAB, lg+ sayfa başındaki "Serbest çalışma" düğmesi (sayfada tek
 * birincil eylem). `tetikleyici="satir"`: tüm genişliklerde kart içinde tam
 * genişlik sessiz düğme, FAB yok (ör. ana sayfadaki program kartı). Form `Modal` içinde
 * açılır (md altı bottom sheet). Kayıt başarılıysa modal anında kapanır ve
 * toast gelir; form içinde yalnızca hata bildirimi kalır.
 *
 * Ders listesi öğrencinin sınav türüne göre konu kataloğundan gelir.
 */
export function SerbestCalismaFormu({
  dersler,
  bugun,
  tetikleyici = 'fab',
}: {
  dersler: readonly string[];
  bugun: string;
  /** Açma düğmesinin biçimi; varsayılan: lg altı FAB + lg+ altın düğme. */
  tetikleyici?: 'fab' | 'satir';
}) {
  const [acik, setAcik] = useState(false);

  // Başarı sunucu yanıtı gelir gelmez işlenir (etki değil, eylemin kendisi):
  // modal anında kapanır, bildirim toast'a gider (spec §4.6, §9/14 — setTimeout yok).
  // `useFormGonder`: hata dönünce yazılanlar silinmez; modal başarıda kapandığı
  // için başarıda sıfırlama gerekmez.
  const { durum, gonder, bekliyor, gonderElle } = useFormGonder(
    async (onceki: FormDurumu, form: FormData): Promise<FormDurumu> => {
      const sonuc = await serbestCalismaEkle(onceki, form);
      if (sonuc.ok) {
        toast.success(sonuc.mesaj || 'Çalışma kaydedildi.');
        setAcik(false);
      }
      return sonuc;
    },
    BOS_DURUM,
  );

  const hatalar = durum.alanHatalari;

  return (
    <>
      {tetikleyici === 'satir' ? (
        /* Kart içi satır düğmesi — tüm genişliklerde, FAB yok */
        <button type="button" onClick={() => setAcik(true)} className={`${DUGME_SESSIZ} h-11 lg:h-9 w-full`}>
          <Plus size={18} strokeWidth={2} aria-hidden />
          Serbest çalışma ekle
        </button>
      ) : (
        <>
          {/* lg+: sayfa başındaki birincil düğme; FAB varken mobilde gizli (spec §5.5) */}
          <div className="hidden lg:block">
            <button type="button" onClick={() => setAcik(true)} className={DUGME_ALTIN}>
              <Plus size={18} strokeWidth={2.25} aria-hidden />
              Serbest çalışma
            </button>
          </div>

          {/* lg altı: ortak FAB — kaydırma/klavye gizlemesi içinde (spec §5.1, §5.5) */}
          <Fab etiket="Serbest çalışma ekle" onClick={() => setAcik(true)} />
        </>
      )}

      <Modal
        acik={acik}
        kapat={() => setAcik(false)}
        baslik="Serbest çalışma"
        altBaslik="Programda olmayan çalışmanı buradan ekle"
        eylemler={
          <>
            <button
              type="button"
              onClick={() => setAcik(false)}
              className={`${DUGME_SESSIZ} order-2 w-full md:order-1 md:w-auto`}
            >
              Vazgeç
            </button>
            <button
              type="submit"
              form={FORM_ID}
              disabled={bekliyor}
              aria-busy={bekliyor}
              className={`${DUGME_ALTIN} order-1 h-12 lg:h-10 w-full md:order-2 md:h-11 md:w-auto`}
            >
              {bekliyor && <Loader2 size={16} strokeWidth={2.25} aria-hidden className="animate-spin" />}
              Kaydet
            </button>
          </>
        }
      >
        <form id={FORM_ID} action={gonder} onSubmit={gonderElle} className="flex flex-col gap-4">
          {!durum.ok && durum.mesaj && <Bildirim ok={false} mesaj={durum.mesaj} />}

          <Alan ad="tarih" etiket="Tarih" tur="date" gerekli varsayilan={bugun} hatalar={hatalar?.tarih} />

          <Secim ad="ders" etiket="Ders" secenekler={[...dersler]} gerekli hatalar={hatalar?.ders} />

          <Alan ad="konu" etiket="Konu" ipucu="Örn. Türev" hatalar={hatalar?.konu} />

          {/* Sayı ızgarası 3+2 (spec §4.5) */}
          <div className="grid grid-cols-3 gap-3">
            <SayiAlani ad="soru" etiket="Soru" min={0} ipucu="0" hatalar={hatalar?.soru} />
            <SayiAlani ad="dogru" etiket="Doğru" min={0} ipucu="0" hatalar={hatalar?.dogru} />
            <SayiAlani ad="yanlis" etiket="Yanlış" min={0} ipucu="0" hatalar={hatalar?.yanlis} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SayiAlani ad="bos" etiket="Boş" min={0} ipucu="0" hatalar={hatalar?.bos} />
            <SayiAlani ad="sure" etiket="Süre (dk)" min={0} ipucu="0" hatalar={hatalar?.sure} />
          </div>

          <p className="-mt-2 text-[12px] text-ots-faint">
            Soru sayısını boş bırakırsan doğru + yanlış + boş toplamı yazılır.
          </p>

          <Alan ad="notMetni" etiket="Not" ipucu="Kısa bir not" hatalar={hatalar?.notMetni} />
        </form>
      </Modal>
    </>
  );
}
