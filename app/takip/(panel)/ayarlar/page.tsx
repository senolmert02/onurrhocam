import { Lock, SlidersHorizontal } from 'lucide-react';

import { AyarFormu, type AyarAlani } from '@/components/ots/koc/AyarFormu';
import { Kart, SayfaBasi } from '@/components/ots/Parcalar';
import { AYAR_TANIMLARI, esikleriGetir } from '@/lib/ots/ayarlar';
import { kocGerekli } from '@/lib/ots/dal';
import { ESIKLER, KAYIT, GUVENLIK } from '@/lib/ots/sabitler';

export const metadata = { title: 'Ayarlar — OnurrHocam ÖTS' };

/** `.ots-belir` kademesi — kart başına 40 ms, en fazla 6 (spec §6). */
const kademe = (i: number) => ({ '--i': Math.min(i, 6) }) as React.CSSProperties;

export default async function AyarlarSayfasi() {
  await kocGerekli();
  const esikler = await esikleriGetir();

  const alanlar: AyarAlani[] = AYAR_TANIMLARI.map((t) => ({
    anahtar: t.anahtar,
    etiket: t.etiket,
    enAz: t.enAz,
    enCok: t.enCok,
    deger: esikler[t.anahtar as keyof typeof esikler],
    varsayilan: ESIKLER[t.anahtar as keyof typeof ESIKLER],
  }));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 sm:gap-8">
      <SayfaBasi
        baslik="Ayarlar"
        aciklama="Uyarı eşikleri — Dikkat Gerekenler panelini bu değerler besler"
      />

      <div className="ots-belir" style={kademe(0)}>
        <Kart
          baslik="Uyarı eşikleri"
          altBaslik="Değişiklik anında geçerli olur, geçmiş veriler yeniden değerlendirilir"
          ikon={SlidersHorizontal}
        >
          <AyarFormu alanlar={alanlar} />
        </Kart>
      </div>

      <div className="ots-belir" style={kademe(1)}>
        <Kart
          baslik="Kodda sabit olanlar"
          altBaslik="Değiştirmek için kod düzenlemesi gerekir"
          ikon={Lock}
        >
          <dl className="flex flex-col divide-y divide-ots-line">
            <Satir etiket="Kayıt açık mı" deger={KAYIT.ACIK ? 'Evet' : 'Hayır'} />
            <Satir
              etiket="Onay bekleme süresi"
              deger={`${KAYIT.ONAY_BEKLEME_GUN} gün sonra kayıt silinir`}
            />
            <Satir etiket="Oturum ömrü" deger={`${GUVENLIK.OTURUM_SAAT} saat`} />
            <Satir
              etiket="Hesap kilidi"
              deger={`${GUVENLIK.MAKS_HATALI_DENEME} hatalı denemede ${GUVENLIK.KILIT_DAKIKA} dakika`}
            />
            <Satir
              etiket="Soru hedefi uyarısı"
              deger={`Hedefin %${Math.round(ESIKLER.SORU_HEDEF_ORANI * 100)} altına düşünce`}
            />
          </dl>
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
      <dd className="ots-sayi font-medium text-ots-ink sm:text-right">{deger}</dd>
    </div>
  );
}
