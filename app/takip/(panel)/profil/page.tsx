import { GraduationCap, KeyRound, LogOut, UserRound } from 'lucide-react';

import { DUGME_TEHLIKE, Kart, Rozet, SayfaBasi } from '@/components/ots/Parcalar';
import { SifreFormu } from '@/components/ots/SifreFormu';
import { cikisYap } from '@/lib/ots/actions/kimlik';
import { girisGerekli, kullanicininOgrencisi } from '@/lib/ots/dal';
import { trTarih, trTarihSaat } from '@/lib/ots/tarih';

export const metadata = { title: 'Profilim — OnurrHocam ÖTS' };

/** `.ots-belir` kademesi — kart başına 40 ms, en fazla 6 (spec §6). */
const kademe = (i: number) => ({ '--i': Math.min(i, 6) }) as React.CSSProperties;

/**
 * Profil — spec §8 "Ayarlar / Profil": tek sütun `max-w-2xl`, her bölüm bir
 * `Kart`, kartlar arası `gap-6`; çıkış en altta ayrı kartta çerçeveli tehlike.
 */
export default async function ProfilSayfasi() {
  const kullanici = await girisGerekli();
  const ogrenci = kullanici.koc ? null : await kullanicininOgrencisi(kullanici.id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 sm:gap-8">
      <SayfaBasi baslik="Profilim" aciklama="Hesap bilgilerin ve şifren" />

      <div className="ots-belir" style={kademe(0)}>
        <Kart baslik="Bilgilerim" ikon={UserRound}>
          <dl className="flex flex-col divide-y divide-ots-line">
            <Satir etiket="Ad soyad" deger={kullanici.adSoyad} />
            <Satir etiket="E-posta" deger={kullanici.eposta} />
            <Satir etiket="Rol" deger={kullanici.rolAdi} />
            <Satir etiket="Telefon" deger={kullanici.telefon || '—'} />
            <Satir
              etiket="Son giriş"
              deger={trTarihSaat(kullanici.sonGiris) || 'İlk girişin'}
            />
          </dl>
        </Kart>
      </div>

      {ogrenci && (
        <div className="ots-belir" style={kademe(1)}>
          <Kart
            baslik="Öğrenci bilgilerim"
            altBaslik="Bu bilgileri koçun günceller"
            ikon={GraduationCap}
            sag={
              ogrenci.mezun ? (
                <Rozet ton="sari">Mezun</Rozet>
              ) : (
                <Rozet>{ogrenci.sinif || 'Sınıf belirtilmedi'}</Rozet>
              )
            }
          >
            <dl className="flex flex-col divide-y divide-ots-line">
              <Satir etiket="Sınıf" deger={ogrenci.mezun ? 'Mezun' : ogrenci.sinif || '—'} />
              <Satir etiket="Sınav" deger={ogrenci.sinavTuru} />
              <Satir etiket="Alan" deger={ogrenci.alan} />
              {ogrenci.mezun && (
                <Satir
                  etiket="Geçen yıl sıralama"
                  deger={
                    ogrenci.gecenYilSiralama
                      ? ogrenci.gecenYilSiralama.toLocaleString('tr-TR')
                      : 'Belirtilmedi'
                  }
                />
              )}
              <Satir etiket="Hedef üniversite" deger={ogrenci.hedefUniversite || '—'} />
              <Satir etiket="Hedef bölüm" deger={ogrenci.hedefBolum || '—'} />
              <Satir etiket="Başlangıç" deger={trTarih(ogrenci.baslangicTarihi)} />
              <Satir
                etiket="Günlük hedef"
                deger={`${ogrenci.gunlukSoruHedefi} soru · ${ogrenci.gunlukSureHedefi} dk`}
              />
            </dl>
          </Kart>
        </div>
      )}

      <div className="ots-belir" style={kademe(2)}>
        <Kart
          baslik="Şifre değiştir"
          altBaslik="Güvenlik için mevcut şifren sorulur"
          ikon={KeyRound}
        >
          <SifreFormu />
        </Kart>
      </div>

      <div className="ots-belir" style={kademe(3)}>
        <Kart baslik="Oturum" altBaslik="Bu cihazdaki oturumu kapatır" ikon={LogOut}>
          <form action={cikisYap}>
            <button type="submit" className={`${DUGME_TEHLIKE} w-full sm:w-auto`}>
              <LogOut size={18} strokeWidth={2} aria-hidden />
              Çıkış yap
            </button>
          </form>
        </Kart>
      </div>
    </div>
  );
}

/** Etiket sol, değer sağ; mobilde değer alta iner. */
function Satir({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <div className="flex min-h-12 lg:min-h-10 flex-col justify-center gap-0.5 py-2.5 text-[14px] sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <dt className="text-ots-faint">{etiket}</dt>
      <dd className="ots-sayi min-w-0 break-words font-medium text-ots-ink sm:text-right">
        {deger}
      </dd>
    </div>
  );
}
