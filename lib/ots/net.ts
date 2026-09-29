/**
 * Deneme hesapları: net, gelişim serisi ve net düşüşü tespiti.
 *
 * Net = doğru − (yanlış / katsayı).  YKS'de 4 yanlış 1 doğru götürür, LGS'de 3.
 *
 * Saf fonksiyonlar: veritabanına dokunmaz, "bugün"ü kendi hesaplamaz.
 * Girdileri çağıran katman verir, böylece test edilebilir kalır.
 */

import { DENEME_TURLERI, ESIKLER, type DenemeTuru } from './sabitler';
import { type GunAnahtari } from './tarih';

export type DenemeGirdisi = {
  tarih: GunAnahtari;
  tur: string;
  toplamNet: number;
  denemeAdi?: string;
};

export type SeriNoktasi = {
  tarih: GunAnahtari;
  ad: string;
  tur: string;
  net: number;
};

/** Tek bölümün neti. İki ondalığa yuvarlanır. */
export function netHesapla(dogru: number, yanlis: number, yanlisBolen: number): number {
  const bolen = yanlisBolen > 0 ? yanlisBolen : 4;
  const net = (Number(dogru) || 0) - (Number(yanlis) || 0) / bolen;
  return Math.round(net * 100) / 100;
}

/** Deneme türünün yanlış katsayısı. Bilinmeyen tür için TYT varsayılır. */
export function yanlisBolen(tur: string): number {
  const ayar = DENEME_TURLERI[tur as DenemeTuru];
  return ayar ? ayar.yanlisBolen : DENEME_TURLERI.TYT.yanlisBolen;
}

/** Bölüm netlerinin toplamı. */
export function toplamNet(
  bolumler: readonly { dogru: number; yanlis: number }[],
  tur: string,
): number {
  const bolen = yanlisBolen(tur);
  const toplam = bolumler.reduce((acc, b) => acc + netHesapla(b.dogru, b.yanlis, bolen), 0);
  return Math.round(toplam * 100) / 100;
}

/**
 * Gelişim serisi — eskiden yeniye, grafik için.
 *
 * `tur` verilmezse tüm denemeler tek seriye girer. Bunu yalnızca liste
 * görünümlerinde kullanın: TYT ve AYT netleri farklı ölçekte olduğu için
 * (TYT ~90, AYT ~45) ikisini aynı çizgide göstermek yanıltıcıdır.
 * Grafiklerde tür başına ayrı seri çizilir.
 */
export function denemeSerisi(
  denemeler: readonly DenemeGirdisi[],
  tur?: string,
  limit?: number,
): SeriNoktasi[] {
  const secilen = tur
    ? denemeler.filter((d) => d.tur.toUpperCase() === tur.toUpperCase())
    : [...denemeler];

  secilen.sort((a, b) => a.tarih.localeCompare(b.tarih));

  const dilim = limit && limit > 0 ? secilen.slice(-limit) : secilen;
  return dilim.map((d) => ({
    tarih: d.tarih,
    ad: d.denemeAdi ?? '',
    tur: d.tur,
    net: Math.round(d.toplamNet * 10) / 10,
  }));
}

/** Her deneme türü için ayrı seri. Grafiklerde kullanılan biçim. */
export function turlereGoreSeri(
  denemeler: readonly DenemeGirdisi[],
  limit = 12,
): Record<DenemeTuru, SeriNoktasi[]> {
  return {
    TYT: denemeSerisi(denemeler, 'TYT', limit),
    AYT: denemeSerisi(denemeler, 'AYT', limit),
    LGS: denemeSerisi(denemeler, 'LGS', limit),
  };
}

export type NetDususSonucu = {
  dusus: boolean;
  /** Düşüşün görüldüğü deneme türü. */
  tur?: DenemeTuru;
  seri: SeriNoktasi[];
  /** İlk denemeden sonuncuya net değişimi (düşüşte negatif). */
  fark: number;
};

/**
 * Son denemelerde kesintisiz net düşüşü var mı?
 *
 * Karşılaştırma **aynı deneme türü içinde** yapılır. Apps Script sürümü tür
 * filtresi olmadan son üç denemeye bakıyordu; TYT(90) → AYT(60) → AYT(55)
 * dizisi "3 denemede 35 net düşüş" uyarısı üretiyordu, oysa öğrenci iki sınavda
 * da gerilemiş olmayabilir — sadece ölçekler farklıdır. Artık her tür kendi
 * içinde değerlendirilir; birden fazla türde düşüş varsa en büyüğü bildirilir.
 */
export function netDususVarMi(
  denemeler: readonly DenemeGirdisi[],
  denemeAdedi: number = ESIKLER.NET_DUSUS_DENEME,
): NetDususSonucu {
  let enKotu: NetDususSonucu = { dusus: false, seri: [], fark: 0 };

  for (const tur of Object.keys(DENEME_TURLERI) as DenemeTuru[]) {
    const seri = denemeSerisi(denemeler, tur, denemeAdedi);
    if (seri.length < denemeAdedi) continue;

    let kesintisizDusus = true;
    for (let i = 1; i < seri.length; i++) {
      if (seri[i].net >= seri[i - 1].net) {
        kesintisizDusus = false;
        break;
      }
    }
    if (!kesintisizDusus) continue;

    const fark = Math.round((seri[seri.length - 1].net - seri[0].net) * 10) / 10;
    if (!enKotu.dusus || fark < enKotu.fark) {
      enKotu = { dusus: true, tur, seri, fark };
    }
  }

  // Düşüş yoksa en azından genel seriyi döndür; arayüz boş grafik çizmesin.
  if (!enKotu.dusus) {
    enKotu.seri = denemeSerisi(denemeler, undefined, denemeAdedi);
  }
  return enKotu;
}

/** Neden bazında yanlış toplamı; haftalık raporda "en sık yanlış nedeni" için. */
export function yanlisNedenOzeti(
  kayitlar: readonly { neden: string; adet: number }[],
): { liste: { neden: string; adet: number }[]; enSik: { neden: string; adet: number } | null } {
  const toplamlar = new Map<string, number>();
  for (const k of kayitlar) {
    const neden = k.neden.trim();
    if (!neden) continue;
    toplamlar.set(neden, (toplamlar.get(neden) ?? 0) + k.adet);
  }

  const liste = [...toplamlar.entries()]
    .map(([neden, adet]) => ({ neden, adet }))
    .sort((a, b) => b.adet - a.adet);

  return { liste, enSik: liste[0] ?? null };
}
