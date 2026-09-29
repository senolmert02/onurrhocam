import 'server-only';

/**
 * Ekran verisi birleştiricileri.
 *
 * Her fonksiyon bir ekranın ihtiyacı olan her şeyi hazırlar: sorgu katmanından
 * veriyi çeker, `hesap.ts` içindeki saf fonksiyonlara verir, sayfanın
 * doğrudan çizebileceği biçimde döner. Sayfa bileşenleri hesap yapmaz.
 */

import {
  haftaKarsilastir,
  haftalikSeri,
  konuIstatistikleri,
  ozetle,
  uyarilarUret,
  type EsikAyarlari,
  type Ozet,
} from '../hesap';
import { turlereGoreSeri, yanlisNedenOzeti } from '../net';
import type { Ogrenci } from '../sema';
import {
  bugun as bugunuAl,
  gunAdi,
  gunEkle,
  haftaBasi,
  haftaGunleri,
  trTarih,
  type GunAnahtari,
} from '../tarih';
import {
  aralikDenemeleri,
  aralikKonuTamamlama,
  degerlendirmeGetir,
  yanlisNedenleri,
  calismaGirdileri,
  denemeGirdileri,
  gorevGirdileri,
  gorevListesi,
  konuGirdileri,
  type GorevSatiri,
} from './temel';

function sinavTuru(ogrenci: Ogrenci): 'YKS' | 'LGS' {
  return ogrenci.sinavTuru === 'LGS' ? 'LGS' : 'YKS';
}

/* ------------------------------------------------------------------ Ana sayfa */

export async function anaSayfaVerisi(ogrenci: Ogrenci) {
  const bugun = bugunuAl();
  const hafta = haftaBasi(bugun);
  const haftaSonu = gunEkle(hafta, 6);

  // Haftanın tamamı tek seferde çekilir; bugünün özeti aynı veriden süzülür.
  const [gorevler, calismalar, konular, denemeler] = await Promise.all([
    gorevGirdileri(ogrenci.id, hafta, haftaSonu),
    calismaGirdileri(ogrenci.id, hafta, haftaSonu),
    konuGirdileri(ogrenci.id),
    denemeGirdileri(ogrenci.id, 20),
  ]);

  const bugunGorevleri = await gorevListesi(ogrenci.id, bugun, bugun);

  const gunOzeti = ozetle({ gorevler, calismalar, baslangic: bugun, bitis: bugun, bugun });
  const haftaOzeti = ozetle({
    gorevler,
    calismalar,
    baslangic: hafta,
    bitis: haftaSonu,
    bugun,
  });

  return {
    bugun,
    bugunTr: trTarih(bugun),
    gunAdi: gunAdi(bugun),
    gorevler: bugunGorevleri,
    gun: {
      ozet: gunOzeti,
      hedefSoru: gunOzeti.hedefSoru || ogrenci.gunlukSoruHedefi,
      hedefSure: gunOzeti.hedefSure || ogrenci.gunlukSureHedefi,
    },
    hafta: {
      baslangic: hafta,
      bitis: haftaSonu,
      araligTr: `${trTarih(hafta)} – ${trTarih(haftaSonu)}`,
      ozet: haftaOzeti,
    },
    konu: konuIstatistikleri(konular, sinavTuru(ogrenci)),
    denemeSerileri: turlereGoreSeri(denemeler, 8),
  };
}

/* ------------------------------------------------------------ Haftalık program */

export type HaftaGunu = {
  tarih: GunAnahtari;
  tarihTr: string;
  gunAdi: string;
  bugunMu: boolean;
  gorevler: GorevSatiri[];
  tamamlanan: number;
  toplam: number;
};

export async function haftaVerisi(ogrenci: Ogrenci, haftaAnahtari?: GunAnahtari) {
  const bugun = bugunuAl();
  const baslangic = haftaBasi(haftaAnahtari || bugun);
  const bitis = gunEkle(baslangic, 6);

  const [satirlar, gorevler, calismalar] = await Promise.all([
    gorevListesi(ogrenci.id, baslangic, bitis),
    gorevGirdileri(ogrenci.id, baslangic, bitis),
    calismaGirdileri(ogrenci.id, baslangic, bitis),
  ]);

  const gunlereGore = new Map<GunAnahtari, GorevSatiri[]>();
  for (const satir of satirlar) {
    const liste = gunlereGore.get(satir.tarih) ?? [];
    liste.push(satir);
    gunlereGore.set(satir.tarih, liste);
  }

  const gunler: HaftaGunu[] = haftaGunleri(baslangic).map((tarih) => {
    const liste = gunlereGore.get(tarih) ?? [];
    return {
      tarih,
      tarihTr: trTarih(tarih),
      gunAdi: gunAdi(tarih),
      bugunMu: tarih === bugun,
      gorevler: liste,
      tamamlanan: liste.filter((g) => g.durum === 'tamamlandi').length,
      toplam: liste.length,
    };
  });

  return {
    baslangic,
    bitis,
    araligTr: `${trTarih(baslangic)} – ${trTarih(bitis)}`,
    oncekiHafta: gunEkle(baslangic, -7),
    sonrakiHafta: gunEkle(baslangic, 7),
    buHaftaMi: baslangic === haftaBasi(bugun),
    gunler,
    ozet: ozetle({ gorevler, calismalar, baslangic, bitis, bugun }),
  };
}

/* -------------------------------------------------------------- Haftalık rapor */

export async function raporVerisi(ogrenci: Ogrenci, haftaAnahtari?: GunAnahtari) {
  const bugun = bugunuAl();
  const baslangic = haftaBasi(haftaAnahtari || bugun);
  const bitis = gunEkle(baslangic, 6);
  const oncekiBaslangic = gunEkle(baslangic, -7);

  // Trend için sekiz haftalık pencere; aynı veriden hem hafta hem seri çıkar.
  const seriBaslangic = gunEkle(haftaBasi(bugun), -7 * 7);
  const seriBitis = gunEkle(haftaBasi(bugun), 6);

  const [
    seriGorevler,
    seriCalismalar,
    konular,
    haftaDenemeleri,
    tamamlananKonu,
    nedenler,
    degerlendirme,
  ] = await Promise.all([
      gorevGirdileri(ogrenci.id, seriBaslangic < oncekiBaslangic ? seriBaslangic : oncekiBaslangic, seriBitis > bitis ? seriBitis : bitis),
      calismaGirdileri(ogrenci.id, seriBaslangic < oncekiBaslangic ? seriBaslangic : oncekiBaslangic, seriBitis > bitis ? seriBitis : bitis),
      konuGirdileri(ogrenci.id),
      aralikDenemeleri(ogrenci.id, baslangic, bitis),
      aralikKonuTamamlama(ogrenci.id, baslangic, bitis),
      yanlisNedenleri(ogrenci.id, baslangic, bitis),
      degerlendirmeGetir(ogrenci.id, baslangic),
    ]);

  const hafta = ozetle({
    gorevler: seriGorevler,
    calismalar: seriCalismalar,
    baslangic,
    bitis,
    bugun,
  });
  const onceki = ozetle({
    gorevler: seriGorevler,
    calismalar: seriCalismalar,
    baslangic: oncekiBaslangic,
    bitis: gunEkle(oncekiBaslangic, 6),
    bugun,
  });

  const gucluSiralama = [...hafta.dersler].sort((a, b) => b.uyum - a.uyum);

  return {
    hafta: {
      baslangic,
      bitis,
      araligTr: `${trTarih(baslangic)} – ${trTarih(bitis)}`,
      oncekiHafta: oncekiBaslangic,
      sonrakiHafta: gunEkle(baslangic, 7),
      buHaftaMi: baslangic === haftaBasi(bugun),
    },
    ozet: hafta,
    karsilastirma: haftaKarsilastir(hafta, onceki),
    konu: {
      genel: konuIstatistikleri(konular, sinavTuru(ogrenci)).genel,
      haftaTamamlanan: tamamlananKonu,
    },
    denemeler: haftaDenemeleri,
    trend: haftalikSeri({
      gorevler: seriGorevler,
      calismalar: seriCalismalar,
      bugun,
      haftaSayisi: 8,
    }),
    /* Yanlış analizi — deneme formunda toplanıyordu ama gösterilmiyordu. */
    yanlisAnalizi: {
      liste: nedenler,
      enSik: nedenler[0] ?? null,
      toplam: nedenler.reduce((a, n) => a + n.adet, 0),
    },
    /* Koçun bu haftaya yazdığı değerlendirme ve gelecek hafta hedefleri. */
    degerlendirme,
    /* Son 30 günün toplamı — haftalık görünümün yanında aylık resim. */
    aylik: (() => {
      const ayBaslangic = gunEkle(bugun, -29);
      const ozet = ozetle({
        gorevler: seriGorevler,
        calismalar: seriCalismalar,
        baslangic: ayBaslangic,
        bitis: bugun,
        bugun,
      });
      return {
        baslangic: ayBaslangic,
        bitis: bugun,
        araligTr: `${trTarih(ayBaslangic)} – ${trTarih(bugun)}`,
        uyum: ozet.uyum,
        soru: ozet.cozulenSoru,
        sure: ozet.calismaSuresi,
        tamamlanan: ozet.tamamlanan,
        vadesiGelen: ozet.vadesiGelenGorev,
      };
    })(),
    gucluDers: gucluSiralama[0]?.ders ?? '',
    gelisecekDers: gucluSiralama.at(-1)?.ders ?? '',
  };
}

/* ------------------------------------------------ Koç: tek geçişte öğrenci özeti */

export type OgrenciOzetSatiri = {
  ogrenciId: string;
  adSoyad: string;
  sinif: string;
  sinavTuru: string;
  uyum: number;
  durum: Ozet['durum'];
  soru: number;
  sure: number;
  konuYuzde: number;
  tamamlanan: number;
  vadesiGelen: number;
  eksik: number;
  gunlukGorev: number;
  gunlukTamamlanan: number;
  uyarilar: ReturnType<typeof uyarilarUret>;
  kritik: boolean;
};

/**
 * Bir öğrencinin koç panelindeki tüm sayıları — tek veri kümesinden.
 * `coachOverview_` içindeki tek geçiş mantığının karşılığı.
 */
export function ogrenciOzetiHesapla(girdi: {
  ogrenci: Pick<Ogrenci, 'id' | 'adSoyad' | 'sinif' | 'sinavTuru'>;
  gorevler: Awaited<ReturnType<typeof gorevGirdileri>>;
  calismalar: Awaited<ReturnType<typeof calismaGirdileri>>;
  konular: Awaited<ReturnType<typeof konuGirdileri>>;
  denemeler: Awaited<ReturnType<typeof denemeGirdileri>>;
  gun: GunAnahtari;
  haftaBaslangic: GunAnahtari;
  bugun: GunAnahtari;
  esikler?: EsikAyarlari;
}): OgrenciOzetSatiri {
  const { ogrenci, gorevler, calismalar, konular, denemeler, gun, haftaBaslangic, bugun } =
    girdi;
  const esikler = girdi.esikler;

  const gunluk = ozetle({ gorevler, calismalar, baslangic: gun, bitis: gun, bugun, esikler });
  const hafta = ozetle({
    gorevler,
    calismalar,
    baslangic: haftaBaslangic,
    bitis: gunEkle(haftaBaslangic, 6),
    bugun,
    esikler,
  });
  const onceki = ozetle({
    gorevler,
    calismalar,
    baslangic: gunEkle(haftaBaslangic, -7),
    bitis: gunEkle(haftaBaslangic, -1),
    bugun,
    esikler,
  });

  const uyarilar = uyarilarUret({
    hafta,
    oncekiHafta: onceki,
    gorevler,
    calismalar,
    denemeler,
    konular,
    bugun,
    esikler,
  });

  return {
    ogrenciId: ogrenci.id,
    adSoyad: ogrenci.adSoyad,
    sinif: ogrenci.sinif,
    sinavTuru: ogrenci.sinavTuru,
    uyum: hafta.uyum,
    durum: hafta.durum,
    soru: hafta.cozulenSoru,
    sure: hafta.calismaSuresi,
    konuYuzde: konuIstatistikleri(konular, ogrenci.sinavTuru === 'LGS' ? 'LGS' : 'YKS')
      .genel.yuzde,
    tamamlanan: hafta.tamamlanan,
    vadesiGelen: hafta.vadesiGelenGorev,
    eksik: hafta.tamamlanmayan,
    gunlukGorev: gunluk.toplamGorev,
    gunlukTamamlanan: gunluk.tamamlanan,
    uyarilar,
    kritik: uyarilar.some((u) => u.seviye === 'kritik'),
  };
}

/** Yanlış analizi özeti — haftalık raporda kullanılır. */
export { yanlisNedenOzeti };
