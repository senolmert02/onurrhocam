import 'server-only';

/**
 * Koç paneli sorguları.
 *
 * Tasarım kuralı: **öğrenci başına sorgu atılmaz.** 20 öğrencinin verisi
 * `in (...)` ile dört sorguda çekilir, sonra bellekte öğrenciye göre gruplanır.
 * Apps Script sürümündeki `dataIndex_` fikrinin aynısı, ama tarih süzgeci
 * artık veritabanında: tüm tablo değil, iki haftalık dilim geliyor.
 */

import { and, asc, desc, eq, gte, inArray, lte, ne, sql } from 'drizzle-orm';

import { konuIstatistikleri, ozetle, type CalismaGirdisi, type GorevGirdisi, type KonuGirdisi } from '../hesap';
import { veritabani } from '../db';
import type { DenemeGirdisi } from '../net';
import { esikleriGetir } from '../ayarlar';
import { KAYIT } from '../sabitler';
import {
  calisma,
  denemeler,
  gorevler,
  kocNotlari,
  kullanicilar,
  ogrenciKonu,
  ogrenciler,
} from '../sema';
import { bugun as bugunuAl, gunEkle, haftaBasi, trTarih, type GunAnahtari } from '../tarih';
import { ogrenciOzetiHesapla, type OgrenciOzetSatiri } from './ekran';

/* ------------------------------------------------------------------ Öğrenciler */

export async function aktifOgrenciler() {
  const db = veritabani();
  return db
    .select()
    .from(ogrenciler)
    .where(eq(ogrenciler.durum, 'aktif'))
    .orderBy(asc(ogrenciler.adSoyad));
}

export async function tumOgrenciler() {
  const db = veritabani();
  return db.select().from(ogrenciler).orderBy(asc(ogrenciler.adSoyad));
}

/* ------------------------------------------------------------ Panel özeti */

function grupla<T extends { ogrenciId: string }>(satirlar: T[]): Map<string, T[]> {
  const harita = new Map<string, T[]>();
  for (const satir of satirlar) {
    const liste = harita.get(satir.ogrenciId);
    if (liste) liste.push(satir);
    else harita.set(satir.ogrenciId, [satir]);
  }
  return harita;
}

export type KocPaneli = {
  gun: GunAnahtari;
  gunTr: string;
  haftaBaslangic: GunAnahtari;
  haftaAraligTr: string;
  gunluk: {
    toplamOgrenci: number;
    tamamlayan: number;
    kismen: number;
    tamamlamayan: number;
    gorevsiz: number;
    toplamSoru: number;
    toplamSure: number;
  };
  satirlar: OgrenciOzetSatiri[];
  dikkat: OgrenciOzetSatiri[];
  onayBekleyen: number;
  takipler: Awaited<ReturnType<typeof vadesiGelenTakipler>>;
};

export async function kocPaneliVerisi(haftaAnahtari?: GunAnahtari): Promise<KocPaneli> {
  const bugun = bugunuAl();
  const haftaBaslangic = haftaBasi(haftaAnahtari || bugun);

  // Üç haftalık pencere: süre düşüşü karşılaştırması bir önceki haftayı,
  // ders bazlı kural (dersBazliUyarilar) son üç haftayı istiyor. Pencere dar
  // kalırsa o kural sessizce hiç tetiklenmez.
  const veriBaslangic = gunEkle(haftaBaslangic, -14);
  const veriBitis = gunEkle(haftaBaslangic, 6);

  const [ogrenciListesi, esikler] = await Promise.all([aktifOgrenciler(), esikleriGetir()]);
  const idler = ogrenciListesi.map((o) => o.id);

  if (idler.length === 0) {
    return {
      gun: bugun,
      gunTr: trTarih(bugun),
      haftaBaslangic,
      haftaAraligTr: `${trTarih(haftaBaslangic)} – ${trTarih(veriBitis)}`,
      gunluk: {
        toplamOgrenci: 0,
        tamamlayan: 0,
        kismen: 0,
        tamamlamayan: 0,
        gorevsiz: 0,
        toplamSoru: 0,
        toplamSure: 0,
      },
      satirlar: [],
      dikkat: [],
      onayBekleyen: await onayBekleyenSayisi(),
      takipler: [],
    };
  }

  const db = veritabani();
  const [gorevSatirlari, calismaSatirlari, konuSatirlari, denemeSatirlari, onayBekleyen, takipler] =
    await Promise.all([
      db
        .select({
          ogrenciId: gorevler.ogrenciId,
          id: gorevler.id,
          tarih: gorevler.tarih,
          ders: gorevler.ders,
          konu: gorevler.konu,
          gorevTuru: gorevler.gorevTuru,
          durum: gorevler.durum,
          hedefSoru: gorevler.hedefSoru,
          hedefSure: gorevler.hedefSure,
        })
        .from(gorevler)
        .where(
          and(
            inArray(gorevler.ogrenciId, idler),
            gte(gorevler.tarih, veriBaslangic),
            lte(gorevler.tarih, veriBitis),
          ),
        ),
      db
        .select({
          ogrenciId: calisma.ogrenciId,
          tarih: calisma.tarih,
          ders: calisma.ders,
          soru: calisma.soru,
          dogru: calisma.dogru,
          yanlis: calisma.yanlis,
          bos: calisma.bos,
          sure: calisma.sure,
        })
        .from(calisma)
        .where(
          and(
            inArray(calisma.ogrenciId, idler),
            gte(calisma.tarih, veriBaslangic),
            lte(calisma.tarih, veriBitis),
          ),
        ),
      db
        .select({
          ogrenciId: ogrenciKonu.ogrenciId,
          konuId: ogrenciKonu.konuId,
          durum: ogrenciKonu.durum,
          tamamlanmaTarihi: ogrenciKonu.tamamlanmaTarihi,
        })
        .from(ogrenciKonu)
        .where(inArray(ogrenciKonu.ogrenciId, idler)),
      db
        .select({
          ogrenciId: denemeler.ogrenciId,
          tarih: denemeler.tarih,
          tur: denemeler.tur,
          toplamNet: denemeler.toplamNet,
          denemeAdi: denemeler.denemeAdi,
        })
        .from(denemeler)
        .where(inArray(denemeler.ogrenciId, idler))
        .orderBy(desc(denemeler.tarih))
        .limit(idler.length * 12),
      onayBekleyenSayisi(),
      vadesiGelenTakipler(10),
    ]);

  const gorevHaritasi = grupla(gorevSatirlari);
  const calismaHaritasi = grupla(calismaSatirlari);
  const konuHaritasi = grupla(konuSatirlari);
  const denemeHaritasi = grupla(denemeSatirlari);

  let tamamlayan = 0;
  let kismen = 0;
  let tamamlamayan = 0;
  let gorevsiz = 0;
  let toplamSoru = 0;
  let toplamSure = 0;

  const satirlar = ogrenciListesi.map((ogrenci) => {
    const ozet = ogrenciOzetiHesapla({
      ogrenci,
      gorevler: (gorevHaritasi.get(ogrenci.id) ?? []) as GorevGirdisi[],
      calismalar: (calismaHaritasi.get(ogrenci.id) ?? []) as CalismaGirdisi[],
      konular: (konuHaritasi.get(ogrenci.id) ?? []) as KonuGirdisi[],
      denemeler: (denemeHaritasi.get(ogrenci.id) ?? []) as DenemeGirdisi[],
      gun: bugun,
      haftaBaslangic,
      bugun,
      esikler,
    });

    if (ozet.gunlukGorev === 0) gorevsiz += 1;
    else if (ozet.gunlukTamamlanan === ozet.gunlukGorev) tamamlayan += 1;
    else if (ozet.gunlukTamamlanan > 0) kismen += 1;
    else tamamlamayan += 1;

    return ozet;
  });

  // Günlük soru/süre toplamı — bugünün çalışma satırlarından.
  for (const c of calismaSatirlari) {
    if (c.tarih !== bugun) continue;
    toplamSoru += c.soru;
    toplamSure += c.sure;
  }

  return {
    gun: bugun,
    gunTr: trTarih(bugun),
    haftaBaslangic,
    haftaAraligTr: `${trTarih(haftaBaslangic)} – ${trTarih(veriBitis)}`,
    gunluk: {
      toplamOgrenci: ogrenciListesi.length,
      tamamlayan,
      kismen,
      tamamlamayan,
      gorevsiz,
      toplamSoru,
      toplamSure,
    },
    satirlar: [...satirlar].sort((a, b) => a.uyum - b.uyum),
    dikkat: satirlar
      .filter((s) => s.uyarilar.length > 0)
      .sort((a, b) => (a.kritik === b.kritik ? a.uyum - b.uyum : a.kritik ? -1 : 1)),
    onayBekleyen,
    takipler,
  };
}

/* ------------------------------------------------------------------ Onaylar */

export async function onayBekleyenSayisi(): Promise<number> {
  const db = veritabani();
  const [satir] = await db
    .select({ adet: sql<number>`count(*)::int` })
    .from(kullanicilar)
    .where(eq(kullanicilar.durum, 'beklemede'));
  return satir?.adet ?? 0;
}

/**
 * Onay bekleyen kayıtlar. Listeyi getirmeden önce süresi geçmiş kayıtları siler.
 *
 * Zamanlanmış görev kurmak yerine tembel temizlik: koç bu ekranı her açtığında
 * çalışır. Kurulum gerektirmez, ücretsiz katman kısıtına takılmaz.
 */
export async function onayBekleyenler() {
  const db = veritabani();

  const sinir = new Date(Date.now() - KAYIT.ONAY_BEKLEME_GUN * 24 * 60 * 60 * 1000);
  const silinen = await db
    .delete(kullanicilar)
    .where(and(eq(kullanicilar.durum, 'beklemede'), lte(kullanicilar.olusturmaZamani, sinir)))
    .returning({ id: kullanicilar.id });

  const liste = await db
    .select({
      id: kullanicilar.id,
      ad: kullanicilar.ad,
      soyad: kullanicilar.soyad,
      email: kullanicilar.email,
      telefon: kullanicilar.telefon,
      olusturmaZamani: kullanicilar.olusturmaZamani,
    })
    .from(kullanicilar)
    .where(eq(kullanicilar.durum, 'beklemede'))
    .orderBy(asc(kullanicilar.olusturmaZamani));

  return { liste, temizlenen: silinen.length };
}

/* ------------------------------------------------------------------- Notlar */

export async function ogrencininNotlari(ogrenciId: string, limit = 50) {
  const db = veritabani();
  return db
    .select()
    .from(kocNotlari)
    .where(eq(kocNotlari.ogrenciId, ogrenciId))
    .orderBy(desc(kocNotlari.tarih))
    .limit(limit);
}

/** Takip tarihi bugün ya da geçmiş olan notlar. */
export async function vadesiGelenTakipler(limit = 50) {
  const db = veritabani();
  const bugun = bugunuAl();

  return db
    .select({
      id: kocNotlari.id,
      ogrenciId: kocNotlari.ogrenciId,
      adSoyad: ogrenciler.adSoyad,
      tarih: kocNotlari.tarih,
      notMetni: kocNotlari.notMetni,
      aksiyon: kocNotlari.aksiyon,
      takipTarihi: kocNotlari.takipTarihi,
    })
    .from(kocNotlari)
    .innerJoin(ogrenciler, eq(ogrenciler.id, kocNotlari.ogrenciId))
    .where(and(lte(kocNotlari.takipTarihi, bugun), ne(ogrenciler.durum, 'pasif')))
    .orderBy(asc(kocNotlari.takipTarihi))
    .limit(limit);
}

/* ------------------------------------------------------------- Haftalık rapor */

export type HaftalikSatir = {
  ogrenciId: string;
  adSoyad: string;
  uyum: number;
  oncekiUyum: number;
  fark: number;
  soru: number;
  sure: number;
  konuYuzde: number;
};

/**
 * Koçun haftalık raporu.
 *
 * `kocPaneliVerisi` zaten iki haftalık dilim çekiyor; burada aynı veri kümesinden
 * hem seçilen hafta hem önceki hafta hesaplanır, ikinci bir tur atılmaz.
 */
export async function kocHaftalikRapor(haftaAnahtari?: GunAnahtari) {
  const bugun = bugunuAl();
  const haftaBaslangic = haftaBasi(haftaAnahtari || bugun);
  const oncekiBaslangic = gunEkle(haftaBaslangic, -7);
  const bitis = gunEkle(haftaBaslangic, 6);

  const ogrenciListesi = await aktifOgrenciler();
  const idler = ogrenciListesi.map((o) => o.id);

  const bos = {
    hafta: {
      baslangic: haftaBaslangic,
      bitis,
      araligTr: `${trTarih(haftaBaslangic)} – ${trTarih(bitis)}`,
      onceki: oncekiBaslangic,
      sonraki: gunEkle(haftaBaslangic, 7),
      buHaftaMi: haftaBaslangic === haftaBasi(bugun),
    },
    satirlar: [] as HaftalikSatir[],
    toplam: { soru: 0, sure: 0, ogrenci: 0 },
  };

  if (idler.length === 0) return bos;

  const db = veritabani();
  const [gorevSatirlari, calismaSatirlari, konuSatirlari] = await Promise.all([
    db
      .select({
        ogrenciId: gorevler.ogrenciId,
        id: gorevler.id,
        tarih: gorevler.tarih,
        ders: gorevler.ders,
        konu: gorevler.konu,
        gorevTuru: gorevler.gorevTuru,
        durum: gorevler.durum,
        hedefSoru: gorevler.hedefSoru,
        hedefSure: gorevler.hedefSure,
      })
      .from(gorevler)
      .where(
        and(
          inArray(gorevler.ogrenciId, idler),
          gte(gorevler.tarih, oncekiBaslangic),
          lte(gorevler.tarih, bitis),
        ),
      ),
    db
      .select({
        ogrenciId: calisma.ogrenciId,
        tarih: calisma.tarih,
        ders: calisma.ders,
        soru: calisma.soru,
        dogru: calisma.dogru,
        yanlis: calisma.yanlis,
        bos: calisma.bos,
        sure: calisma.sure,
      })
      .from(calisma)
      .where(
        and(
          inArray(calisma.ogrenciId, idler),
          gte(calisma.tarih, oncekiBaslangic),
          lte(calisma.tarih, bitis),
        ),
      ),
    db
      .select({
        ogrenciId: ogrenciKonu.ogrenciId,
        konuId: ogrenciKonu.konuId,
        durum: ogrenciKonu.durum,
        tamamlanmaTarihi: ogrenciKonu.tamamlanmaTarihi,
      })
      .from(ogrenciKonu)
      .where(inArray(ogrenciKonu.ogrenciId, idler)),
  ]);

  const gorevHaritasi = grupla(gorevSatirlari);
  const calismaHaritasi = grupla(calismaSatirlari);
  const konuHaritasi = grupla(konuSatirlari);

  const satirlar: HaftalikSatir[] = ogrenciListesi.map((ogrenci) => {
    const g = (gorevHaritasi.get(ogrenci.id) ?? []) as GorevGirdisi[];
    const c = (calismaHaritasi.get(ogrenci.id) ?? []) as CalismaGirdisi[];

    const hafta = ozetle({
      gorevler: g,
      calismalar: c,
      baslangic: haftaBaslangic,
      bitis,
      bugun,
    });
    const onceki = ozetle({
      gorevler: g,
      calismalar: c,
      baslangic: oncekiBaslangic,
      bitis: gunEkle(oncekiBaslangic, 6),
      bugun,
    });

    return {
      ogrenciId: ogrenci.id,
      adSoyad: ogrenci.adSoyad,
      uyum: hafta.uyum,
      oncekiUyum: onceki.uyum,
      fark: Math.round((hafta.uyum - onceki.uyum) * 10) / 10,
      soru: hafta.cozulenSoru,
      sure: hafta.calismaSuresi,
      konuYuzde: konuIstatistikleri(
        (konuHaritasi.get(ogrenci.id) ?? []) as KonuGirdisi[],
        ogrenci.sinavTuru === 'LGS' ? 'LGS' : 'YKS',
      ).genel.yuzde,
    };
  });

  return {
    hafta: bos.hafta,
    satirlar: satirlar.sort((a, b) => b.uyum - a.uyum),
    toplam: {
      soru: satirlar.reduce((a, s) => a + s.soru, 0),
      sure: satirlar.reduce((a, s) => a + s.sure, 0),
      ogrenci: satirlar.length,
    },
  };
}
