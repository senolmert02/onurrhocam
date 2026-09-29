'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ogrenciEkle, ogrenciGuncelle } from '@/lib/ots/actions/ogrenci';
import { BOS_DURUM } from '@/lib/ots/dogrulama';
import { ALANLAR } from '@/lib/ots/sabitler';
import type { Ogrenci } from '@/lib/ots/sema';

import { Alan, Bildirim, GonderDugmesi, SayiAlani, Secim } from '../Alan';
import { useFormGonder } from '../hooks/useFormGonder';
import { DUGME_SESSIZ } from '../Parcalar';

/**
 * Öğrenci ekleme ve düzenleme formu — diyalog içinde ya da satır içi kullanılır.
 *
 * Şifre alanı iki işi birden görüyor:
 * - **Eklerken** boş bırakılırsa sistem üretir, doluysa koçun yazdığı kullanılır.
 * - **Düzenlerken** doluysa öğrencinin şifresi o değerle değiştirilir; boş
 *   bırakılırsa şifreye dokunulmaz.
 *
 * Bu yüzden ayrı bir "şifremi unuttum" akışına gerek kalmıyor — öğrenci
 * unutursa koç buradan yenisini verir.
 *
 * İki kullanım biçimi:
 * - `formId` verilmişse düğmeler formun DIŞINDA (Modal `eylemler` çubuğunda)
 *   durur; form yalnızca `id` alır ve bekleme durumunu `bekliyorDegisti` ile
 *   yukarı bildirir. Sunucu bileşeninden çağrılırken bu prop'lar verilmez.
 * - Verilmemişse form kendi Kaydet (ve varsa Vazgeç) düğmesini taşır.
 */
export function OgrenciFormu({
  ogrenci,
  bitince,
  formId,
  bekliyorDegisti,
}: {
  ogrenci?: Ogrenci;
  bitince?: () => void;
  /** Verilirse düğme satırı çizilmez; çağıran `form={formId}` ile bağlar. */
  formId?: string;
  /** Gönderim bekleme durumunu dışarıdaki Kaydet düğmesine taşır. */
  bekliyorDegisti?: (bekliyor: boolean) => void;
}) {
  const duzenleme = Boolean(ogrenci);
  // Hata dönünce yazılanlar silinmez (React 19'un koşulsuz form sıfırlaması
  // atlanır). Başarıda da otomatik sıfırlama yok: detay sayfasında form ekranda
  // kalır ve kaydedilen değerleri göstermeye devam etmeli.
  const { durum, gonder, bekliyor, gonderElle } = useFormGonder(
    duzenleme ? ogrenciGuncelle : ogrenciEkle,
    BOS_DURUM,
  );
  const [mezun, setMezun] = useState(ogrenci?.mezun ?? false);
  const formRef = useRef<HTMLFormElement>(null);

  // Sistem bir şifre ürettiyse mesaj ekranda kalmalı — koç onu kopyalayıp
  // öğrenciye iletecek. Diğer başarılar toast'a gider ve diyalog anında kapanır.
  const uretilenSifreVar = durum.ok && durum.mesaj.includes('şifre:');

  useEffect(() => {
    bekliyorDegisti?.(bekliyor);
  }, [bekliyor, bekliyorDegisti]);

  // Form kapanırken dışarıdaki düğme "bekliyor" hâlinde kalmasın
  useEffect(() => () => bekliyorDegisti?.(false), [bekliyorDegisti]);

  // Başarıdan sonra:
  // - Düzenlemede yalnızca şifre alanı boşalır — yazılan şifre ekranda durmasın,
  //   diğer alanlar kaydedilen değerleri göstermeye devam eder.
  // - Eklemede (üretilen şifre mesajıyla modal açık kalabilir) form boşalır;
  //   yoksa "Ekle"ye ikinci kez basmak aynı öğrenciyi yeniden ekler. Eski
  //   koşulsuz sıfırlamanın gördüğü işti. Mezun kutusu kontrollü, ayrıca kapanır.
  useEffect(() => {
    if (!durum.ok) return;
    const form = formRef.current;
    if (!form) return;
    if (duzenleme) {
      const sifre = form.elements.namedItem('sifre');
      if (sifre instanceof HTMLInputElement) sifre.value = '';
    } else {
      form.reset();
      setMezun(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durum]);

  // `durum` nesnesi her sunucu yanıtında yenilenir; aynı sonuç iki kez gelse de
  // (peş peşe iki başarılı kayıt) toast her seferinde çıkar.
  useEffect(() => {
    if (!durum.ok || uretilenSifreVar) return;
    toast.success(durum.mesaj || 'Kaydedildi.');
    bitince?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durum]);

  return (
    <form
      ref={formRef}
      id={formId}
      action={gonder}
      onSubmit={gonderElle}
      className="flex flex-col gap-4"
    >
      {duzenleme && <input type="hidden" name="ogrenciId" value={ogrenci!.id} />}

      {/* Hata her zaman form içinde; başarı yalnızca üretilen şifre varsa kalır */}
      {(!durum.ok || uretilenSifreVar) && <Bildirim ok={durum.ok} mesaj={durum.mesaj} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Alan
          ad="adSoyad"
          etiket="Ad soyad"
          gerekli
          varsayilan={ogrenci?.adSoyad}
          hatalar={durum.alanHatalari?.adSoyad}
        />
        <Alan
          ad="sinif"
          etiket="Sınıf"
          ipucu="12. sınıf"
          varsayilan={ogrenci?.sinif}
          hatalar={durum.alanHatalari?.sinif}
        />
      </div>

      {/* Mezun durumu sınıfın hemen yanında; işaretlenince sıralama alanı açılır */}
      <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
        <label className="flex min-h-11 lg:min-h-9 items-center gap-3 text-[15px] text-ots-ink sm:h-12">
          <input
            type="checkbox"
            name="mezun"
            checked={mezun}
            onChange={(olay) => setMezun(olay.target.checked)}
            className="h-[22px] w-[22px] shrink-0 rounded accent-[var(--color-ots-gold)]"
          />
          Mezun öğrenci
        </label>
        {mezun && (
          <SayiAlani
            ad="gecenYilSiralama"
            etiket="Geçen yılki sıralaması"
            varsayilan={ogrenci?.gecenYilSiralama ?? ''}
            ipucu="Örn. 45000"
            min={1}
            hatalar={durum.alanHatalari?.gecenYilSiralama}
          />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Alan
          ad="eposta"
          etiket="E-posta"
          tur="email"
          ipucu="ogrenci@ornek.com"
          varsayilan={ogrenci?.email}
          aciklama={duzenleme ? '(giriş için)' : '(verirsen hesap açılır)'}
          hatalar={durum.alanHatalari?.eposta}
        />
        <Alan
          ad="sifre"
          etiket="Şifre"
          ipucu={duzenleme ? 'Değiştirmek için yaz' : 'Ots123456'}
          aciklama={duzenleme ? '(boşsa değişmez)' : '(boşsa otomatik)'}
          hatalar={durum.alanHatalari?.sifre}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Secim
          ad="sinavTuru"
          etiket="Sınav"
          gerekli
          secenekler={['YKS', 'LGS']}
          varsayilan={ogrenci?.sinavTuru ?? 'YKS'}
        />
        <Secim
          ad="alan"
          etiket="Alan"
          gerekli
          secenekler={[...ALANLAR]}
          varsayilan={ogrenci?.alan ?? 'Belirtilmedi'}
        />
        <Alan
          ad="telefon"
          etiket="Telefon"
          tur="tel"
          varsayilan={ogrenci?.telefon}
          hatalar={durum.alanHatalari?.telefon}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Alan
          ad="hedefUniversite"
          etiket="Hedef üniversite"
          varsayilan={ogrenci?.hedefUniversite}
          hatalar={durum.alanHatalari?.hedefUniversite}
        />
        <Alan
          ad="hedefBolum"
          etiket="Hedef bölüm"
          varsayilan={ogrenci?.hedefBolum}
          hatalar={durum.alanHatalari?.hedefBolum}
        />
      </div>

      <Alan
        ad="hedef"
        etiket="Hedef / açıklama"
        varsayilan={ogrenci?.hedef}
        hatalar={durum.alanHatalari?.hedef}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Alan
          ad="veliAdi"
          etiket="Veli adı"
          varsayilan={ogrenci?.veliAdi}
          hatalar={durum.alanHatalari?.veliAdi}
        />
        <Alan
          ad="veliTelefon"
          etiket="Veli telefonu"
          tur="tel"
          varsayilan={ogrenci?.veliTelefon}
          hatalar={durum.alanHatalari?.veliTelefon}
        />
      </div>

      <Alan
        ad="adres"
        etiket="Adres"
        ipucu="Mahalle, ilçe, il"
        varsayilan={ogrenci?.adres}
        hatalar={durum.alanHatalari?.adres}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <SayiAlani
          ad="gunlukSoruHedefi"
          etiket="Günlük soru hedefi"
          min={0}
          varsayilan={ogrenci?.gunlukSoruHedefi ?? 0}
          hatalar={durum.alanHatalari?.gunlukSoruHedefi}
        />
        <SayiAlani
          ad="gunlukSureHedefi"
          etiket="Günlük süre (dk)"
          min={0}
          varsayilan={ogrenci?.gunlukSureHedefi ?? 0}
          hatalar={durum.alanHatalari?.gunlukSureHedefi}
        />
        <div className="col-span-2 sm:col-span-1">
          <Alan
            ad="baslangicTarihi"
            etiket="Başlangıç tarihi"
            tur="date"
            varsayilan={ogrenci?.baslangicTarihi ?? undefined}
            hatalar={durum.alanHatalari?.baslangicTarihi}
          />
        </div>
      </div>

      {duzenleme && (
        <Secim
          ad="durum"
          etiket="Durum"
          gerekli
          secenekler={['aktif', 'pasif']}
          etiketler={{ aktif: 'Aktif', pasif: 'Pasif — giriş kapanır' }}
          varsayilan={ogrenci?.durum ?? 'aktif'}
        />
      )}

      {/* Düğmeler yalnızca form kendi başınayken; diyalogda eylem çubuğu taşır */}
      {!formId && (
        <div className="mt-1 flex flex-col-reverse gap-3 border-t border-ots-line pt-4 sm:flex-row sm:justify-end">
          {bitince && (
            <button type="button" onClick={bitince} className={`${DUGME_SESSIZ} h-12 lg:h-10 w-full sm:h-11 sm:w-auto`}>
              Vazgeç
            </button>
          )}
          <GonderDugmesi bekliyor={bekliyor} className="sm:h-11 sm:w-auto">
            {duzenleme ? 'Kaydet' : 'Ekle'}
          </GonderDugmesi>
        </div>
      )}
    </form>
  );
}
