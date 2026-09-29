'use client';

import { Eye, Loader2, Pencil, Plus, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import type { Ogrenci } from '@/lib/ots/sema';

import { GIRDI } from '../Alan';
import { Fab } from '../Fab';
import { Modal } from '../Modal';
import {
  Bos,
  DUGME_ALTIN,
  DUGME_IKON,
  DUGME_SESSIZ,
  Rozet,
  SayfaBasi,
  type RozetTonu,
} from '../Parcalar';
import { OgrenciBilgileri } from './OgrenciBilgileri';
import { OgrenciFormu } from './OgrenciFormu';

/** Tek seferde gösterilen kayıt sayısı; ötesi "Daha fazla göster" ile açılır (spec §5.4). */
const SAYFA = 20;

/* ------------------------------------------------------------ Satır verisi */

type Satir = {
  id: string;
  adSoyad: string;
  basHarfler: string;
  email: string;
  sinif: string;
  sinavTuru: string;
  hedef: string;
  /** "12. sınıf · YKS · Tıp" — kartın meta satırı */
  meta: string;
  durumRozeti: RozetBilgisi;
  hesapRozeti: RozetBilgisi;
  mezun: boolean;
  /** Kartta yan yana dizilen tüm rozetler */
  rozetler: RozetBilgisi[];
  detay: string;
};

type RozetBilgisi = { etiket: string; ton: RozetTonu };

/**
 * Tablo ve kart listesinin ortak veri kaynağı (spec §4.7, graft Ö3).
 * İki görünüm aynı diziyi tükettiği için sütun/rozet eklemek tek yerde biter.
 */
function satirVerisi(ogrenci: Ogrenci): Satir {
  const aktif = ogrenci.durum === 'aktif';
  const hesapVar = Boolean(ogrenci.kullaniciId);
  const hedef = ogrenci.hedefBolum || ogrenci.hedef || '';

  const durumRozeti: RozetBilgisi = {
    etiket: aktif ? 'Aktif' : 'Pasif',
    ton: aktif ? 'yesil' : 'notr',
  };
  const hesapRozeti: RozetBilgisi = {
    etiket: hesapVar ? 'Hesap var' : 'Hesap yok',
    ton: hesapVar ? 'yesil' : 'notr',
  };
  const mezunRozeti: RozetBilgisi = { etiket: 'Mezun', ton: 'sari' };

  return {
    id: ogrenci.id,
    adSoyad: ogrenci.adSoyad,
    basHarfler: basHarfleriAl(ogrenci.adSoyad),
    email: ogrenci.email,
    sinif: ogrenci.sinif || '—',
    sinavTuru: ogrenci.sinavTuru,
    hedef: hedef || '—',
    meta: [ogrenci.sinif, ogrenci.sinavTuru, hedef].filter(Boolean).join(' · '),
    durumRozeti,
    hesapRozeti,
    mezun: ogrenci.mezun,
    rozetler: ogrenci.mezun
      ? [durumRozeti, hesapRozeti, mezunRozeti]
      : [durumRozeti, hesapRozeti],
    detay: `/takip/ogrenciler/${ogrenci.id}`,
  };
}

function basHarfleriAl(adSoyad: string): string {
  const parcalar = adSoyad.trim().split(/\s+/).filter(Boolean);
  const ilk = parcalar[0]?.[0] ?? '';
  const son = parcalar.length > 1 ? parcalar[parcalar.length - 1][0] : '';
  return (ilk + son).toLocaleUpperCase('tr-TR') || '?';
}

/** Türkçe duyarsız, aksan toleranslı arama anahtarı. */
function anahtar(metin: string): string {
  return metin.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/* ------------------------------------------------------------------ Bileşen */

/**
 * Öğrenci listesi — md altı kart listesi, md+ tablo (spec §4.7, §5.4, §8).
 *
 * Ekleme ve düzenleme aynı formu kullanıyor; tek fark hangi öğrencinin
 * verisiyle açıldığı. Diyalog durumu burada tutuluyor; sayfa sunucu bileşeni
 * olarak kalıyor ve yalnızca veriyi veriyor. Form düğmeleri Modal'ın eylem
 * çubuğunda durur (`form={id}` ile bağlı), bekleme durumu formdan yukarı gelir.
 */
export function OgrenciListesi({ ogrenciler }: { ogrenciler: Ogrenci[] }) {
  const [ekle, setEkle] = useState(false);
  const [duzenlenen, setDuzenlenen] = useState<Ogrenci | null>(null);
  const [goruntulenen, setGoruntulenen] = useState<Ogrenci | null>(null);
  const [bekliyor, setBekliyor] = useState(false);
  const [arama, setArama] = useState('');
  const [gosterilen, setGosterilen] = useState(SAYFA);

  const pasifSayisi = ogrenciler.filter((o) => o.durum !== 'aktif').length;

  const satirlar = ogrenciler.map(satirVerisi);
  const aranan = anahtar(arama.trim());
  const filtreli = aranan
    ? satirlar.filter(
        (s) => anahtar(s.adSoyad).includes(aranan) || anahtar(s.email).includes(aranan),
      )
    : satirlar;
  const gorunen = filtreli.slice(0, gosterilen);
  const dahaVar = filtreli.length > gosterilen;

  const ogrenciBul = (id: string) => ogrenciler.find((o) => o.id === id) ?? null;

  const ekleFormu = 'ogrenci-ekle-formu';
  const duzenleFormu = 'ogrenci-duzenle-formu';

  return (
    <>
      <div className="ots-belir" style={{ '--i': 0 } as React.CSSProperties}>
        <SayfaBasi
          baslik="Öğrenciler"
          aciklama={`${ogrenciler.length} kayıt${pasifSayisi ? ` · ${pasifSayisi} pasif` : ''}`}
          sag={
            /* FAB varken aynı eylem mobilde gizlenir (spec §5.5) */
            <span className="hidden lg:block">
              <button type="button" onClick={() => setEkle(true)} className={DUGME_ALTIN}>
                <Plus size={18} strokeWidth={2.25} aria-hidden />
                Öğrenci ekle
              </button>
            </span>
          }
        />
      </div>

      {ogrenciler.length > 0 && (
        <div className="ots-belir relative" style={{ '--i': 1 } as React.CSSProperties}>
          <Search
            size={18}
            strokeWidth={2}
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ots-faint"
          />
          <input
            type="search"
            value={arama}
            onChange={(olay) => {
              setArama(olay.target.value);
              setGosterilen(SAYFA);
            }}
            placeholder="Ad ya da e-posta ile ara"
            aria-label="Öğrenci ara"
            autoComplete="off"
            className={`${GIRDI} pl-11`}
          />
        </div>
      )}

      <div className="ots-belir flex flex-col gap-4" style={{ '--i': 2 } as React.CSSProperties}>
        {ogrenciler.length === 0 ? (
          <Bos
            ikon={Users}
            baslik="Henüz öğrenci yok"
            aciklama="Öğrenci ekle düğmesinden ekleyebilir ya da onay bekleyen kayıtları onaylayabilirsin."
          />
        ) : filtreli.length === 0 ? (
          <Bos
            ikon={Search}
            baslik="Eşleşen öğrenci yok"
            aciklama={`"${arama.trim()}" ile eşleşen ad ya da e-posta bulunamadı.`}
          />
        ) : (
          <>
            {/* md altı: kart listesi */}
            <ul className="flex flex-col gap-3 md:hidden">
              {gorunen.map((s) => (
                <li
                  key={s.id}
                  className="ots-liste-oge ots-yuzey-hover relative flex min-h-[72px] items-center gap-3 rounded-2xl border border-ots-line bg-ots-surface p-4 shadow-ots active:bg-ots-raised has-[.kart-baglanti:focus-visible]:ring-2 has-[.kart-baglanti:focus-visible]:ring-ots-gold-deep"
                >
                  <span
                    aria-hidden
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ots-panel text-[14px] font-bold text-ots-gold-bright"
                  >
                    {s.basHarfler}
                  </span>

                  <div className="min-w-0 flex-1">
                    {/* Bağlantı kartın tamamına yayılır (::after); düğmeler üstünde kalır */}
                    <Link
                      href={s.detay}
                      className="kart-baglanti block truncate text-[15px] font-semibold text-ots-ink outline-none after:absolute after:inset-0 after:rounded-2xl after:content-['']"
                    >
                      {s.adSoyad}
                    </Link>
                    {s.meta && <p className="truncate text-[12px] text-ots-faint">{s.meta}</p>}
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {s.rozetler.map((r) => (
                        <Rozet key={r.etiket} ton={r.ton}>
                          {r.etiket}
                        </Rozet>
                      ))}
                    </div>
                  </div>

                  <SatirEylemleri
                    goruntule={() => setGoruntulenen(ogrenciBul(s.id))}
                    duzenle={() => setDuzenlenen(ogrenciBul(s.id))}
                  />
                </li>
              ))}
            </ul>

            {/* md+: tablo — yatay kaydırma yok, min-w yok (spec §4.7) */}
            <div className="hidden overflow-hidden rounded-2xl border border-ots-line bg-ots-surface shadow-ots md:block">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['Ad soyad', 'Sınıf', 'Sınav', 'Hedef', 'Hesap', 'Durum'].map((baslik) => (
                      <th key={baslik} scope="col" className={TH}>
                        {baslik}
                      </th>
                    ))}
                    <th scope="col" className={TH}>
                      <span className="sr-only">Eylemler</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {gorunen.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-ots-line transition-colors duration-150 last:border-0 hover:bg-ots-raised"
                    >
                      <td className={`${TD} text-ots-ink`}>
                        <Link
                          href={s.detay}
                          className="font-semibold text-ots-ink hover:text-ots-gold-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ots-gold-deep"
                        >
                          {s.adSoyad}
                        </Link>
                        {s.email && <p className="text-[12px] text-ots-faint">{s.email}</p>}
                      </td>
                      <td className={`${TD} text-ots-soft`}>{s.sinif}</td>
                      <td className={`${TD} text-ots-soft`}>{s.sinavTuru}</td>
                      <td className={`${TD} max-w-[14rem] truncate text-ots-soft`}>{s.hedef}</td>
                      <td className={TD}>
                        <Rozet ton={s.hesapRozeti.ton}>{s.hesapRozeti.etiket}</Rozet>
                      </td>
                      <td className={TD}>
                        <span className="flex flex-wrap gap-1.5">
                          <Rozet ton={s.durumRozeti.ton}>{s.durumRozeti.etiket}</Rozet>
                          {s.mezun && <Rozet ton="sari">Mezun</Rozet>}
                        </span>
                      </td>
                      <td className={`${TD} text-right`}>
                        <SatirEylemleri
                          goruntule={() => setGoruntulenen(ogrenciBul(s.id))}
                          duzenle={() => setDuzenlenen(ogrenciBul(s.id))}
                          className="justify-end"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {dahaVar && (
              <button
                type="button"
                onClick={() => setGosterilen((n) => n + SAYFA)}
                className={`${DUGME_SESSIZ} w-full`}
              >
                Daha fazla göster
                <span className="ots-sayi text-ots-faint">
                  ({filtreli.length - gosterilen})
                </span>
              </button>
            )}
          </>
        )}
      </div>

      <Fab etiket="Öğrenci ekle" onClick={() => setEkle(true)} />

      <Modal
        acik={ekle}
        kapat={() => setEkle(false)}
        baslik="Yeni öğrenci"
        altBaslik="E-posta verirsen giriş hesabı da açılır"
        eylemler={
          <ModalEylemleri formId={ekleFormu} bekliyor={bekliyor} vazgec={() => setEkle(false)}>
            Ekle
          </ModalEylemleri>
        }
      >
        <OgrenciFormu
          formId={ekleFormu}
          bitince={() => setEkle(false)}
          bekliyorDegisti={setBekliyor}
        />
      </Modal>

      {/* Görüntüle: yalnızca bilgiler, salt okunur. Program/rapor için ada tıklanır. */}
      <Modal
        acik={goruntulenen !== null}
        kapat={() => setGoruntulenen(null)}
        baslik={goruntulenen?.adSoyad ?? 'Öğrenci'}
        altBaslik="Öğrenci bilgileri"
        eylemler={
          <>
            <button
              type="button"
              onClick={() => setGoruntulenen(null)}
              className={`${DUGME_SESSIZ} order-2 h-12 w-full md:order-1 md:h-11 md:w-auto lg:h-9`}
            >
              Kapat
            </button>
            <button
              type="button"
              onClick={() => {
                const secili = goruntulenen;
                setGoruntulenen(null);
                setDuzenlenen(secili);
              }}
              className={`${DUGME_ALTIN} order-1 h-12 w-full md:order-2 md:h-11 md:w-auto lg:h-9`}
            >
              <Pencil size={16} strokeWidth={2} aria-hidden />
              Düzenle
            </button>
          </>
        }
      >
        {goruntulenen && <OgrenciBilgileri ogrenci={goruntulenen} />}
      </Modal>

      <Modal
        acik={duzenlenen !== null}
        kapat={() => setDuzenlenen(null)}
        baslik={duzenlenen?.adSoyad ?? 'Öğrenci'}
        altBaslik="Şifre alanını doldurursan öğrencinin şifresi değişir"
        eylemler={
          <ModalEylemleri
            formId={duzenleFormu}
            bekliyor={bekliyor}
            vazgec={() => setDuzenlenen(null)}
          >
            Kaydet
          </ModalEylemleri>
        }
      >
        {duzenlenen && (
          <OgrenciFormu
            key={duzenlenen.id}
            ogrenci={duzenlenen}
            formId={duzenleFormu}
            bitince={() => setDuzenlenen(null)}
            bekliyorDegisti={setBekliyor}
          />
        )}
      </Modal>
    </>
  );
}

/* --------------------------------------------------------------- Alt parçalar */

const TH = 'h-11 bg-ots-raised px-4 text-left text-[12px] font-semibold text-ots-faint lg:h-9';
/* Renk hücrede verilir — aynı özellik için iki yardımcı sınıf çakışmasın */
const TD = 'px-4 py-3 text-[14px] lg:py-2.5 lg:text-[13.5px]';

/**
 * Satır eylemleri — Görüntüle ve Düzenle, ikisi de yerinde pencere açar.
 * Kullanıcı isteği: Görüntüle yalnızca öğrencinin bilgilerini göstersin,
 * programa/rapora götürmesin. Öğrencinin program ve raporlarla dolu sayfası
 * için ada (kartta kartın tamamına) tıklanır.
 */
function SatirEylemleri({
  goruntule,
  duzenle,
  className = '',
}: {
  goruntule: () => void;
  duzenle: () => void;
  className?: string;
}) {
  return (
    <div className={`relative z-10 flex shrink-0 gap-2 lg:gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={(olay) => {
          olay.stopPropagation();
          goruntule();
        }}
        aria-label="Öğrenci bilgilerini görüntüle"
        title="Görüntüle"
        className={DUGME_IKON}
      >
        <Eye size={18} strokeWidth={2} aria-hidden />
      </button>
      <button
        type="button"
        onClick={(olay) => {
          olay.stopPropagation();
          duzenle();
        }}
        aria-label="Öğrenciyi düzenle"
        title="Düzenle"
        className={DUGME_IKON}
      >
        <Pencil size={18} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}

/**
 * Modal eylem çubuğu: md+ [Vazgeç][Kaydet] yatay, md altı Kaydet üstte dikey
 * (spec §4.10). DOM sırası Vazgeç → Kaydet; mobil sıra `order` ile döner.
 */
function ModalEylemleri({
  formId,
  bekliyor,
  vazgec,
  children,
}: {
  formId: string;
  bekliyor: boolean;
  vazgec: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <button
        type="button"
        onClick={vazgec}
        className={`${DUGME_SESSIZ} order-2 h-12 lg:h-10 w-full md:order-1 md:h-11 md:w-auto`}
      >
        Vazgeç
      </button>
      <button
        type="submit"
        form={formId}
        disabled={bekliyor}
        aria-busy={bekliyor}
        className={`${DUGME_ALTIN} order-1 h-12 lg:h-10 w-full md:order-2 md:h-11 md:w-auto`}
      >
        {bekliyor && <Loader2 size={16} strokeWidth={2.25} aria-hidden className="animate-spin" />}
        {children}
      </button>
    </>
  );
}
