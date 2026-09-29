import { LogOut } from 'lucide-react';

import { AltSekmeCubugu } from '@/components/ots/AltSekmeCubugu';
import { HareketAyari } from '@/components/ots/HareketAyari';
import { KenarMenu, type MenuOgesi } from '@/components/ots/KenarMenu';
import { OtsToaster } from '@/components/ots/OtsToaster';
import { DUGME_TEMELI } from '@/components/ots/Parcalar';
import { UstCubuk } from '@/components/ots/UstCubuk';
import { cikisYap } from '@/lib/ots/actions/kimlik';
import { girisGerekli } from '@/lib/ots/dal';
import { onayBekleyenSayisi } from '@/lib/ots/sorgular/koc';

/**
 * Menü tanımları burada, sunucuda. İkonlar yalnızca **ad** olarak taşınır
 * (RSC kuralı: istemci bileşenine fonksiyon geçilemez); karşılığı
 * `KenarMenu.IKONLAR`'da. İlk dört öğe alt sekme çubuğunun birincil
 * yuvaları; `kisaEtiket` ≤9 karakter (spec §4.11).
 */
const ALT_SEKME_SAYISI = 4;

const OGRENCI_MENUSU: MenuOgesi[] = [
  { etiket: 'Ana Sayfa', kisaEtiket: 'Ana Sayfa', adres: '/takip', ikon: 'anasayfa' },
  { etiket: 'Haftalık Program', kisaEtiket: 'Program', adres: '/takip/program', ikon: 'program' },
  { etiket: 'Konu Takibi', kisaEtiket: 'Konular', adres: '/takip/konular', ikon: 'konu' },
  { etiket: 'Denemeler', kisaEtiket: 'Denemeler', adres: '/takip/denemeler', ikon: 'deneme' },
  { etiket: 'Kaynaklarım', adres: '/takip/kaynaklar', ikon: 'kaynak' },
  { etiket: 'Çalışma Geçmişim', adres: '/takip/gecmis', ikon: 'gecmis' },
  { etiket: 'Raporlarım', adres: '/takip/rapor', ikon: 'rapor' },
  { etiket: 'Profilim', adres: '/takip/profil', ikon: 'profil' },
];

/* Çıkış düğmeleri: kenar menüde hayalet (panel üstünde), sheet'te çerçeveli
   kırmızı metin (spec §5.1, §8). İkisi de aynı server action'ı çağırır. */
/* Kenar menüde çıkış menü öğeleriyle aynı hizada (sola yaslı); `!` DUGME_TEMELI'nin ortalamasını ezer */
const CIKIS_KENAR = `${DUGME_TEMELI} w-full justify-start! px-2.5! font-medium text-ots-panel-soft hover:bg-ots-kirmizi-tint hover:text-ots-kirmizi`;
const CIKIS_SHEET =
  `${DUGME_TEMELI} w-full border border-ots-line-strong bg-ots-surface text-ots-kirmizi ` +
  'hover:border-ots-kirmizi/50 hover:bg-ots-kirmizi-tint';

/**
 * Panel kabuğu.
 *
 * `girisGerekli()` burada çağrılıyor ama bu **tek başına yeterli değil**:
 * her sayfa ve her Server Action kendi kontrolünü de yapar. Layout'taki
 * kontrol bir güvenlik sınırı değil, doğru yere yönlendirme işidir.
 *
 * Gezinme CSS ile dallanır (spec §5.1): lg+ kenar menü, lg altı üst çubuk +
 * alt sekme çubuğu. JS media query yok, hydration sorunu yok.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const kullanici = await girisGerekli();

  // Onay bekleyen sayısı menüde rozet olarak görünür; koç ekranı açmadan bilir.
  const bekleyen = kullanici.koc ? await onayBekleyenSayisi() : 0;

  const menu: MenuOgesi[] = kullanici.koc
    ? [
        { etiket: 'Dashboard', kisaEtiket: 'Dashboard', adres: '/takip', ikon: 'dashboard' },
        { etiket: 'Öğrenciler', kisaEtiket: 'Öğrenci', adres: '/takip/ogrenciler', ikon: 'ogrenciler' },
        { etiket: 'Programlar', kisaEtiket: 'Program', adres: '/takip/programlar', ikon: 'program' },
        { etiket: 'Dikkat Gerekenler', kisaEtiket: 'Dikkat', adres: '/takip/dikkat', ikon: 'dikkat' },
        { etiket: 'Konu Takibi', adres: '/takip/konular', ikon: 'konu' },
        { etiket: 'Kaynaklar', adres: '/takip/kaynaklar', ikon: 'kaynak' },
        { etiket: 'Denemeler', adres: '/takip/denemeler', ikon: 'deneme' },
        { etiket: 'Öğrenci Raporu', adres: '/takip/rapor', ikon: 'rapor' },
        { etiket: 'Haftalık Rapor', adres: '/takip/haftalik', ikon: 'haftalik' },
        { etiket: 'Koç Notları', adres: '/takip/notlar', ikon: 'notlar' },
        {
          etiket: 'Onaylar',
          adres: '/takip/onaylar',
          ikon: 'onay',
          rozet: bekleyen || undefined,
        },
        { etiket: 'Ayarlar', adres: '/takip/ayarlar', ikon: 'ayarlar' },
        { etiket: 'Profilim', adres: '/takip/profil', ikon: 'profil' },
      ]
    : OGRENCI_MENUSU;

  const cikisKenar = (
    <form action={cikisYap}>
      <button type="submit" className={CIKIS_KENAR}>
        <LogOut size={18} aria-hidden />
        Çıkış Yap
      </button>
    </form>
  );

  const cikisSheet = (
    <form action={cikisYap}>
      <button type="submit" className={CIKIS_SHEET}>
        <LogOut size={18} aria-hidden />
        Çıkış Yap
      </button>
    </form>
  );

  return (
    <HareketAyari>
      <div className="flex flex-1 flex-col lg:flex-row">
        <KenarMenu
          ogeler={menu}
          kullaniciAdi={kullanici.adSoyad}
          rolAdi={kullanici.rolAdi}
          cikis={cikisKenar}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <UstCubuk ogeler={menu} kullaniciAdi={kullanici.adSoyad} />

          {/* Alt boşluk: alt sekme çubuğu (3.5rem) + safe-area + 1rem; lg+'da çubuk yok.
              Yatay: safe-area'dan az olmayan px-4/sm:px-6 (spec §5.6). */}
          <main
            className="mx-auto w-full max-w-6xl flex-1 px-4 pt-4
              pb-[calc(3.5rem+env(safe-area-inset-bottom)+1rem)]
              pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]
              sm:px-6 sm:pt-8
              sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]
              lg:pb-8"
          >
            {children}
          </main>
        </div>

        <AltSekmeCubugu
          ogeler={menu.slice(0, ALT_SEKME_SAYISI)}
          dahaFazla={menu.slice(ALT_SEKME_SAYISI)}
          kocMu={kullanici.koc}
          kullaniciAdi={kullanici.adSoyad}
          rolAdi={kullanici.rolAdi}
          cikis={cikisSheet}
          onayRozeti={bekleyen || undefined}
        />
      </div>

      <OtsToaster />
    </HareketAyari>
  );
}
