import 'server-only';

/**
 * Temel okuma sorguları.
 *
 * Bu katmanın tek işi veritabanından **yalnızca gereken sütunları** çekip
 * `hesap.ts` içindeki saf fonksiyonlara vermek. Hesaplama burada yapılmaz.
 *
 * Apps Script sürümünde tüm tabloyu okuyup JavaScript'te filtrelemek
 * zorundaydık; `dataIndex_` tam da bunun acısını azaltmak için vardı.
 * Burada `where` ve indeks işi veritabanına bırakılıyor: 36.000 satırlık bir
 * görev tablosundan tek öğrencinin bir haftası 40 satır olarak geliyor.
 */

import { and, asc, desc, eq, gte, isNotNull, lte, sql } from 'drizzle-orm';

import { veritabani } from '../db';
import type { CalismaGirdisi, GorevGirdisi, KonuGirdisi } from '../hesap';
import type { DenemeGirdisi } from '../net';
import {
  calisma,
  denemeler,
  gorevler,
  haftalikDegerlendirme,
  ogrenciKonu,
  yanlisAnaliz,
} from '../sema';
import type { GunAnahtari } from '../tarih';

/* -------------------------------------------------------------------- Görevler */

/** Hesaplama için gereken görev alanları, tarih aralığına göre. */
export async function gorevGirdileri(
  ogrenciId: string,
  baslangic: GunAnahtari,
  bitis: GunAnahtari,
): Promise<GorevGirdisi[]> {
  const db = veritabani();
  return db
    .select({
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
        eq(gorevler.ogrenciId, ogrenciId),
        gte(gorevler.tarih, baslangic),
        lte(gorevler.tarih, bitis),
      ),
    );
}

export type GorevSatiri = {
  id: string;
  tarih: GunAnahtari;
  baslangicSaati: string | null;
  bitisSaati: string | null;
  ders: string;
  konu: string;
  altKonu: string;
  gorevTuru: string;
  hedefSoru: number;
  hedefSure: number;
  oncelik: string;
  aciklama: string;
  durum: string;
  gerceklesen: {
    soru: number;
    dogru: number;
    yanlis: number;
    bos: number;
    sure: number;
    notMetni: string;
  } | null;
};

/**
 * Ekranda gösterilecek görevler, varsa gerçekleşen çalışma kayıtlarıyla.
 * Tek sorguda sol birleştirme — görev başına ayrı sorgu atılmaz.
 */
export async function gorevListesi(
  ogrenciId: string,
  baslangic: GunAnahtari,
  bitis: GunAnahtari,
): Promise<GorevSatiri[]> {
  const db = veritabani();
  const satirlar = await db
    .select({
      id: gorevler.id,
      tarih: gorevler.tarih,
      baslangicSaati: gorevler.baslangicSaati,
      bitisSaati: gorevler.bitisSaati,
      ders: gorevler.ders,
      konu: gorevler.konu,
      altKonu: gorevler.altKonu,
      gorevTuru: gorevler.gorevTuru,
      hedefSoru: gorevler.hedefSoru,
      hedefSure: gorevler.hedefSure,
      oncelik: gorevler.oncelik,
      aciklama: gorevler.aciklama,
      durum: gorevler.durum,
      cSoru: calisma.soru,
      cDogru: calisma.dogru,
      cYanlis: calisma.yanlis,
      cBos: calisma.bos,
      cSure: calisma.sure,
      cNot: calisma.notMetni,
      cVar: calisma.id,
    })
    .from(gorevler)
    .leftJoin(calisma, eq(calisma.gorevId, gorevler.id))
    .where(
      and(
        eq(gorevler.ogrenciId, ogrenciId),
        gte(gorevler.tarih, baslangic),
        lte(gorevler.tarih, bitis),
      ),
    )
    .orderBy(asc(gorevler.tarih), asc(gorevler.baslangicSaati));

  return satirlar.map((s) => ({
    id: s.id,
    tarih: s.tarih,
    baslangicSaati: s.baslangicSaati,
    bitisSaati: s.bitisSaati,
    ders: s.ders,
    konu: s.konu,
    altKonu: s.altKonu,
    gorevTuru: s.gorevTuru,
    hedefSoru: s.hedefSoru,
    hedefSure: s.hedefSure,
    oncelik: s.oncelik,
    aciklama: s.aciklama,
    durum: s.durum,
    gerceklesen: s.cVar
      ? {
          soru: s.cSoru ?? 0,
          dogru: s.cDogru ?? 0,
          yanlis: s.cYanlis ?? 0,
          bos: s.cBos ?? 0,
          sure: s.cSure ?? 0,
          notMetni: s.cNot ?? '',
        }
      : null,
  }));
}

/* -------------------------------------------------------------------- Çalışma */

export async function calismaGirdileri(
  ogrenciId: string,
  baslangic: GunAnahtari,
  bitis: GunAnahtari,
): Promise<CalismaGirdisi[]> {
  const db = veritabani();
  return db
    .select({
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
        eq(calisma.ogrenciId, ogrenciId),
        gte(calisma.tarih, baslangic),
        lte(calisma.tarih, bitis),
      ),
    );
}

/** Çalışma geçmişi ekranı için, not ve kaynak görev bilgisiyle. */
export async function calismaGecmisi(
  ogrenciId: string,
  baslangic: GunAnahtari,
  bitis: GunAnahtari,
) {
  const db = veritabani();
  return db
    .select({
      id: calisma.id,
      tarih: calisma.tarih,
      ders: calisma.ders,
      konu: calisma.konu,
      soru: calisma.soru,
      dogru: calisma.dogru,
      yanlis: calisma.yanlis,
      bos: calisma.bos,
      sure: calisma.sure,
      notMetni: calisma.notMetni,
      gorevId: calisma.gorevId,
    })
    .from(calisma)
    .where(
      and(
        eq(calisma.ogrenciId, ogrenciId),
        gte(calisma.tarih, baslangic),
        lte(calisma.tarih, bitis),
      ),
    )
    .orderBy(desc(calisma.tarih));
}

/* ---------------------------------------------------------------------- Konu */

export async function konuGirdileri(ogrenciId: string): Promise<KonuGirdisi[]> {
  const db = veritabani();
  return db
    .select({
      konuId: ogrenciKonu.konuId,
      durum: ogrenciKonu.durum,
      tamamlanmaTarihi: ogrenciKonu.tamamlanmaTarihi,
    })
    .from(ogrenciKonu)
    .where(eq(ogrenciKonu.ogrenciId, ogrenciId));
}

/** Konu ekranı için tüm alanlar. */
export async function konuKayitlari(ogrenciId: string) {
  const db = veritabani();
  return db.select().from(ogrenciKonu).where(eq(ogrenciKonu.ogrenciId, ogrenciId));
}

/* ------------------------------------------------------------------ Denemeler */

export async function denemeGirdileri(
  ogrenciId: string,
  limit = 60,
): Promise<DenemeGirdisi[]> {
  const db = veritabani();
  const satirlar = await db
    .select({
      tarih: denemeler.tarih,
      tur: denemeler.tur,
      toplamNet: denemeler.toplamNet,
      denemeAdi: denemeler.denemeAdi,
    })
    .from(denemeler)
    .where(eq(denemeler.ogrenciId, ogrenciId))
    .orderBy(desc(denemeler.tarih))
    .limit(limit);

  return satirlar;
}

/** Belirli tarih aralığındaki denemeler (haftalık rapor için). */
export async function aralikDenemeleri(
  ogrenciId: string,
  baslangic: GunAnahtari,
  bitis: GunAnahtari,
) {
  const db = veritabani();
  return db
    .select({
      id: denemeler.id,
      tarih: denemeler.tarih,
      denemeAdi: denemeler.denemeAdi,
      tur: denemeler.tur,
      toplamNet: denemeler.toplamNet,
    })
    .from(denemeler)
    .where(
      and(
        eq(denemeler.ogrenciId, ogrenciId),
        gte(denemeler.tarih, baslangic),
        lte(denemeler.tarih, bitis),
      ),
    )
    .orderBy(desc(denemeler.tarih));
}

/* ----------------------------------------------------------- Konu tamamlama */

/** Belirli aralıkta tamamlanan konu adedi (haftalık rapor). */
export async function aralikKonuTamamlama(
  ogrenciId: string,
  baslangic: GunAnahtari,
  bitis: GunAnahtari,
): Promise<number> {
  const db = veritabani();
  const [satir] = await db
    .select({ adet: sql<number>`count(*)::int` })
    .from(ogrenciKonu)
    .where(
      and(
        eq(ogrenciKonu.ogrenciId, ogrenciId),
        isNotNull(ogrenciKonu.tamamlanmaTarihi),
        gte(ogrenciKonu.tamamlanmaTarihi, baslangic),
        lte(ogrenciKonu.tamamlanmaTarihi, bitis),
      ),
    );
  return satir?.adet ?? 0;
}

/* ------------------------------------------------------------ Yanlış analizi */

/**
 * Belirli aralıktaki yanlış nedenleri, nedene göre toplanmış.
 *
 * Bu veri deneme formunda toplanıyordu ama hiçbir ekranda okunmuyordu;
 * haftalık raporun "en sık yanlış nedeni" bölümü buradan besleniyor.
 */
export async function yanlisNedenleri(
  ogrenciId: string,
  baslangic: GunAnahtari,
  bitis: GunAnahtari,
): Promise<{ neden: string; adet: number }[]> {
  const db = veritabani();
  return db
    .select({
      neden: yanlisAnaliz.neden,
      adet: sql<number>`sum(${yanlisAnaliz.adet})::int`,
    })
    .from(yanlisAnaliz)
    .where(
      and(
        eq(yanlisAnaliz.ogrenciId, ogrenciId),
        gte(yanlisAnaliz.tarih, baslangic),
        lte(yanlisAnaliz.tarih, bitis),
      ),
    )
    .groupBy(yanlisAnaliz.neden)
    .orderBy(desc(sql`sum(${yanlisAnaliz.adet})`));
}

/* ------------------------------------------------- Haftalık koç değerlendirmesi */

export async function degerlendirmeGetir(ogrenciId: string, haftaBaslangic: GunAnahtari) {
  const db = veritabani();
  const [satir] = await db
    .select()
    .from(haftalikDegerlendirme)
    .where(
      and(
        eq(haftalikDegerlendirme.ogrenciId, ogrenciId),
        eq(haftalikDegerlendirme.haftaBaslangic, haftaBaslangic),
      ),
    )
    .limit(1);
  return satir ?? null;
}
