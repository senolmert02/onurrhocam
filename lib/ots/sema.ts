/**
 * Veritabanı şeması (Postgres / Drizzle).
 *
 * Apps Script sürümünde şema `Config.gs` içindeki başlık listeleriydi ve her şey
 * metindi. Burada tipler gerçek: `date` gerçekten tarih, sayılar gerçekten sayı.
 *
 * Şemanın kendi başına kapattığı hatalar:
 *
 * - `onDelete: 'cascade'` — öğrenci ya da deneme silinince bağlı satırlar kendiliğinden
 *   gider. Eski sürümde `deleteWhere_` ile elle temizleniyordu, unutulan yer kalıyordu.
 * - `check` kısıtları — negatif doğru/yanlış girilemez. Eski sürümde istemciden
 *   `{soru: 10, dogru: -5}` göndermek doğrulamayı atlatıp raporları bozabiliyordu.
 * - `unique(ogrenci_id, konu_id)` — aynı konu için mükerrer durum satırı imkânsız.
 * - `unique(gorev_id)` — bir göreve tek çalışma kaydı; "tekrar kaydedilirse güncellenir"
 *   kuralı artık koda değil veritabanına bağlı.
 * - `unique(deneme_id, bolum)` — aynı bölüm bir denemede iki kez girilemez.
 *
 * Oturumlar için tablo yok: oturum imzalı çerezde taşınıyor.
 */

import { sql } from 'drizzle-orm';
import {
  check,
  date,
  boolean,
  index,
  integer,
  pgTable,
  real,
  text,
  time,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

/* ------------------------------------------------------------------ Kullanıcılar */

export const kullanicilar = pgTable(
  'kullanicilar',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ad: text('ad').notNull(),
    soyad: text('soyad').notNull(),
    /** Her zaman küçük harfe indirgenmiş olarak yazılır (bkz. dogrulama.ts). */
    email: text('email').notNull().unique(),
    sifreHash: text('sifre_hash').notNull(),
    rol: text('rol').notNull().default('ogrenci'),
    /** Kayıt `beklemede` açılır; koç onaylayınca `aktif` olur. */
    durum: text('durum').notNull().default('beklemede'),
    telefon: text('telefon').notNull().default(''),
    olusturmaZamani: timestamp('olusturma_zamani', { withTimezone: true })
      .notNull()
      .defaultNow(),
    sonGiris: timestamp('son_giris', { withTimezone: true }),
    basarisizDeneme: integer('basarisiz_deneme').notNull().default(0),
    kilitBitis: timestamp('kilit_bitis', { withTimezone: true }),
    /** Kayıt formunda alınır; onayda öğrenci kaydına kopyalanır. */
    mezun: boolean('mezun').notNull().default(false),
    gecenYilSiralama: integer('gecen_yil_siralama'),
  },
  (t) => [
    check('kullanicilar_rol', sql`${t.rol} in ('koc', 'ogrenci')`),
    check('kullanicilar_durum', sql`${t.durum} in ('beklemede', 'aktif', 'pasif')`),
    check('kullanicilar_deneme', sql`${t.basarisizDeneme} >= 0`),
    // Onay bekleyenlerin temizliği bu sütunlara göre tarandığı için indeksli.
    index('kullanicilar_durum_idx').on(t.durum, t.olusturmaZamani),
  ],
);

/* --------------------------------------------------------------------- Öğrenciler */

export const ogrenciler = pgTable(
  'ogrenciler',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /**
     * Giriş hesabı. Koç, hesabı olmayan öğrenci de ekleyebildiği için boş olabilir.
     * Bir kullanıcının en fazla bir öğrenci kaydı olur.
     */
    kullaniciId: uuid('kullanici_id')
      .unique()
      .references(() => kullanicilar.id, { onDelete: 'cascade' }),
    adSoyad: text('ad_soyad').notNull(),
    email: text('email').notNull().default(''),
    telefon: text('telefon').notNull().default(''),
    sinif: text('sinif').notNull().default(''),
    sinavTuru: text('sinav_turu').notNull().default('YKS'),
    alan: text('alan').notNull().default('Belirtilmedi'),
    hedef: text('hedef').notNull().default(''),
    hedefUniversite: text('hedef_universite').notNull().default(''),
    hedefBolum: text('hedef_bolum').notNull().default(''),
    veliAdi: text('veli_adi').notNull().default(''),
    veliTelefon: text('veli_telefon').notNull().default(''),
    adres: text('adres').notNull().default(''),
    /** Mezun öğrenci ve geçen yılki sınav sıralaması (bilgi amaçlı, boş olabilir). */
    mezun: boolean('mezun').notNull().default(false),
    gecenYilSiralama: integer('gecen_yil_siralama'),
    baslangicTarihi: date('baslangic_tarihi', { mode: 'string' }).notNull(),
    gunlukSoruHedefi: integer('gunluk_soru_hedefi').notNull().default(0),
    gunlukSureHedefi: integer('gunluk_sure_hedefi').notNull().default(0),
    durum: text('durum').notNull().default('aktif'),
    olusturmaZamani: timestamp('olusturma_zamani', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check('ogrenciler_sinav_turu', sql`${t.sinavTuru} in ('YKS', 'LGS')`),
    check('ogrenciler_durum', sql`${t.durum} in ('aktif', 'pasif')`),
    check('ogrenciler_hedefler', sql`${t.gunlukSoruHedefi} >= 0 and ${t.gunlukSureHedefi} >= 0`),
    check('ogrenciler_siralama', sql`${t.gecenYilSiralama} is null or ${t.gecenYilSiralama} > 0`),
  ],
);

/* ------------------------------------------------------------ Program (görevler) */

export const gorevler = pgTable(
  'gorevler',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ogrenciId: uuid('ogrenci_id')
      .notNull()
      .references(() => ogrenciler.id, { onDelete: 'cascade' }),
    tarih: date('tarih', { mode: 'string' }).notNull(),
    baslangicSaati: time('baslangic_saati'),
    bitisSaati: time('bitis_saati'),
    /** Ders adı konu kataloğundan gelir (bkz. derslerGetir). */
    ders: text('ders').notNull(),
    konu: text('konu').notNull().default(''),
    altKonu: text('alt_konu').notNull().default(''),
    gorevTuru: text('gorev_turu').notNull().default('Soru çözümü'),
    hedefSoru: integer('hedef_soru').notNull().default(0),
    hedefSure: integer('hedef_sure').notNull().default(0),
    oncelik: text('oncelik').notNull().default('Normal'),
    aciklama: text('aciklama').notNull().default(''),
    durum: text('durum').notNull().default('bekliyor'),
    tamamlanmaZamani: timestamp('tamamlanma_zamani', { withTimezone: true }),
    /** Görevi oluşturan koçun e-postası. */
    olusturan: text('olusturan').notNull().default(''),
    olusturmaZamani: timestamp('olusturma_zamani', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check('gorevler_durum', sql`${t.durum} in ('bekliyor', 'tamamlandi', 'yapilmadi')`),
    check('gorevler_hedefler', sql`${t.hedefSoru} >= 0 and ${t.hedefSure} >= 0`),
    // Bütün okumalar "şu öğrencinin şu tarih aralığı" biçiminde.
    index('gorevler_ogrenci_tarih_idx').on(t.ogrenciId, t.tarih),
  ],
);

/* ------------------------------------------------------- Gerçekleşen çalışma */

export const calisma = pgTable(
  'calisma',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Programdaki görev. Serbest çalışmada boş kalır. */
    gorevId: uuid('gorev_id')
      .unique()
      .references(() => gorevler.id, { onDelete: 'cascade' }),
    ogrenciId: uuid('ogrenci_id')
      .notNull()
      .references(() => ogrenciler.id, { onDelete: 'cascade' }),
    tarih: date('tarih', { mode: 'string' }).notNull(),
    ders: text('ders').notNull(),
    konu: text('konu').notNull().default(''),
    soru: integer('soru').notNull().default(0),
    dogru: integer('dogru').notNull().default(0),
    yanlis: integer('yanlis').notNull().default(0),
    bos: integer('bos').notNull().default(0),
    /** Dakika. */
    sure: integer('sure').notNull().default(0),
    notMetni: text('not_metni').notNull().default(''),
    kayitZamani: timestamp('kayit_zamani', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check(
      'calisma_negatif_olamaz',
      sql`${t.soru} >= 0 and ${t.dogru} >= 0 and ${t.yanlis} >= 0 and ${t.bos} >= 0 and ${t.sure} >= 0`,
    ),
    check('calisma_dagilim', sql`${t.dogru} + ${t.yanlis} + ${t.bos} <= ${t.soru}`),
    index('calisma_ogrenci_tarih_idx').on(t.ogrenciId, t.tarih),
  ],
);

/* ------------------------------------------------------------------ Konu takibi */

export const ogrenciKonu = pgTable(
  'ogrenci_konu',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ogrenciId: uuid('ogrenci_id')
      .notNull()
      .references(() => ogrenciler.id, { onDelete: 'cascade' }),
    /**
     * Konu kataloğundaki kalıcı kimlik. Katalog kodda tutulduğu için yabancı
     * anahtar değil; karşılığı `konuBul()` ile çözülür.
     */
    konuId: text('konu_id').notNull(),
    durum: text('durum').notNull().default('Başlanmadı'),
    ilkCalismaTarihi: date('ilk_calisma_tarihi', { mode: 'string' }),
    tamamlanmaTarihi: date('tamamlanma_tarihi', { mode: 'string' }),
    tekrarTarihi: date('tekrar_tarihi', { mode: 'string' }),
    soruSayisi: integer('soru_sayisi').notNull().default(0),
    basariYuzdesi: integer('basari_yuzdesi').notNull().default(0),
    notMetni: text('not_metni').notNull().default(''),
    guncellemeZamani: timestamp('guncelleme_zamani', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique('ogrenci_konu_tek').on(t.ogrenciId, t.konuId),
    check(
      'ogrenci_konu_durum',
      sql`${t.durum} in ('Başlanmadı', 'Çalışılıyor', 'Tamamlandı', 'Tekrar gerekli', 'Eksik', 'Deneme ile kontrol edildi')`,
    ),
    check('ogrenci_konu_soru', sql`${t.soruSayisi} >= 0`),
    check('ogrenci_konu_yuzde', sql`${t.basariYuzdesi} between 0 and 100`),
    index('ogrenci_konu_ogrenci_idx').on(t.ogrenciId),
  ],
);

/* -------------------------------------------------------------------- Denemeler */

export const denemeler = pgTable(
  'denemeler',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ogrenciId: uuid('ogrenci_id')
      .notNull()
      .references(() => ogrenciler.id, { onDelete: 'cascade' }),
    tarih: date('tarih', { mode: 'string' }).notNull(),
    denemeAdi: text('deneme_adi').notNull(),
    tur: text('tur').notNull(),
    /** Dakika. */
    sure: integer('sure').notNull().default(0),
    toplamNet: real('toplam_net').notNull().default(0),
    /** Öğrencinin kendi değerlendirmesi. */
    degerlendirme: text('degerlendirme').notNull().default(''),
    /** Koçun deneme sonrası planı; öğrenci yazamaz. */
    yapilmasiGerekenler: text('yapilmasi_gerekenler').notNull().default(''),
    kayitZamani: timestamp('kayit_zamani', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('denemeler_tur', sql`${t.tur} in ('TYT', 'AYT', 'LGS')`),
    check('denemeler_sure', sql`${t.sure} >= 0`),
    index('denemeler_ogrenci_tarih_idx').on(t.ogrenciId, t.tarih),
  ],
);

export const denemeDetay = pgTable(
  'deneme_detay',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    denemeId: uuid('deneme_id')
      .notNull()
      .references(() => denemeler.id, { onDelete: 'cascade' }),
    /** Sınav oturumunun bölümü (bkz. DENEME_TURLERI.bolumler) — çalışma dersi değil. */
    bolum: text('bolum').notNull(),
    dogru: integer('dogru').notNull().default(0),
    yanlis: integer('yanlis').notNull().default(0),
    bos: integer('bos').notNull().default(0),
    net: real('net').notNull().default(0),
  },
  (t) => [
    unique('deneme_detay_tek').on(t.denemeId, t.bolum),
    check(
      'deneme_detay_negatif_olamaz',
      sql`${t.dogru} >= 0 and ${t.yanlis} >= 0 and ${t.bos} >= 0`,
    ),
    index('deneme_detay_deneme_idx').on(t.denemeId),
  ],
);

/* ---------------------------------------------------------------- Yanlış analizi */

export const yanlisAnaliz = pgTable(
  'yanlis_analiz',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ogrenciId: uuid('ogrenci_id')
      .notNull()
      .references(() => ogrenciler.id, { onDelete: 'cascade' }),
    denemeId: uuid('deneme_id').references(() => denemeler.id, { onDelete: 'cascade' }),
    tarih: date('tarih', { mode: 'string' }).notNull(),
    ders: text('ders').notNull().default(''),
    konu: text('konu').notNull().default(''),
    neden: text('neden').notNull(),
    adet: integer('adet').notNull().default(1),
  },
  (t) => [
    check('yanlis_analiz_adet', sql`${t.adet} > 0`),
    index('yanlis_analiz_ogrenci_tarih_idx').on(t.ogrenciId, t.tarih),
  ],
);

/* ------------------------------------------------------------------ Koç notları */

export const kocNotlari = pgTable(
  'koc_notlari',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ogrenciId: uuid('ogrenci_id')
      .notNull()
      .references(() => ogrenciler.id, { onDelete: 'cascade' }),
    tarih: date('tarih', { mode: 'string' }).notNull(),
    notMetni: text('not_metni').notNull(),
    aksiyon: text('aksiyon').notNull().default(''),
    /** Takip tarihi gelen notlar koç panelinde öne çıkar. */
    takipTarihi: date('takip_tarihi', { mode: 'string' }),
    yazan: text('yazan').notNull().default(''),
  },
  (t) => [
    index('koc_notlari_ogrenci_tarih_idx').on(t.ogrenciId, t.tarih),
    index('koc_notlari_takip_idx').on(t.takipTarihi),
  ],
);


/* ------------------------------------------------- Haftalık koç değerlendirmesi */

/**
 * Koçun haftalık rapora yazdığı serbest metin: o haftanın değerlendirmesi ve
 * gelecek haftanın hedefleri. Hafta başına tek kayıt.
 */
export const haftalikDegerlendirme = pgTable(
  'haftalik_degerlendirme',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ogrenciId: uuid('ogrenci_id')
      .notNull()
      .references(() => ogrenciler.id, { onDelete: 'cascade' }),
    /** Haftanın pazartesi günü. */
    haftaBaslangic: date('hafta_baslangic', { mode: 'string' }).notNull(),
    kocDegerlendirmesi: text('koc_degerlendirmesi').notNull().default(''),
    gelecekHedefler: text('gelecek_hedefler').notNull().default(''),
    /** Basılı programın NOT kutusu. */
    programNotu: text('program_notu').notNull().default(''),
    yazan: text('yazan').notNull().default(''),
    guncellemeZamani: timestamp('guncelleme_zamani', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique('haftalik_degerlendirme_tek').on(t.ogrenciId, t.haftaBaslangic),
    index('haftalik_degerlendirme_idx').on(t.ogrenciId, t.haftaBaslangic),
  ],
);

/* ------------------------------------------------------------------- Ayarlar */

/**
 * Panelden değiştirilebilen ayarlar (uyarı eşikleri gibi).
 * Anahtar–değer: her ayar için sütun açmak yerine tek tablo yeter, sayısı az
 * ve şema değişmeden yeni ayar eklenebiliyor.
 */
export const ayarlar = pgTable('ayarlar', {
  anahtar: text('anahtar').primaryKey(),
  deger: text('deger').notNull(),
  guncellemeZamani: timestamp('guncelleme_zamani', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ----------------------------------------------------------------------- Tipler */

export type Kullanici = typeof kullanicilar.$inferSelect;
export type YeniKullanici = typeof kullanicilar.$inferInsert;
export type Ogrenci = typeof ogrenciler.$inferSelect;
export type YeniOgrenci = typeof ogrenciler.$inferInsert;
export type Gorev = typeof gorevler.$inferSelect;
export type YeniGorev = typeof gorevler.$inferInsert;
export type Calisma = typeof calisma.$inferSelect;
export type YeniCalisma = typeof calisma.$inferInsert;
export type OgrenciKonu = typeof ogrenciKonu.$inferSelect;
export type Deneme = typeof denemeler.$inferSelect;
export type DenemeDetay = typeof denemeDetay.$inferSelect;
export type YanlisAnaliz = typeof yanlisAnaliz.$inferSelect;
export type KocNotu = typeof kocNotlari.$inferSelect;
export type HaftalikDegerlendirme = typeof haftalikDegerlendirme.$inferSelect;

/* ------------------------------------------------------------------- Kaynaklar */

/**
 * Öğrencinin elindeki kaynaklar: kitap, soru bankası, video seti, deneme seti.
 * Öğrenci kendi girer, koç görür; koç da ekleyip silebilir. Ders adı konu
 * kataloğundaki ders adlarıyla aynı — böylece programda görev yazarken hangi
 * kaynaktan verilebileceği bir bakışta belli olur.
 */
export const kaynaklar = pgTable(
  'kaynaklar',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ogrenciId: uuid('ogrenci_id')
      .notNull()
      .references(() => ogrenciler.id, { onDelete: 'cascade' }),
    ders: text('ders').notNull(),
    ad: text('ad').notNull(),
    /** Soru bankası / Konu anlatımı / Deneme / Video / Diğer */
    tur: text('tur').notNull().default(''),
    notMetni: text('not_metni').notNull().default(''),
    olusturmaZamani: timestamp('olusturma_zamani', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('kaynaklar_ogrenci_idx').on(t.ogrenciId, t.ders)],
);

export type Kaynak = typeof kaynaklar.$inferSelect;
