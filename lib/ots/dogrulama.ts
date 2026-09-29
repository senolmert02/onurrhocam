/**
 * Girdi doğrulama şemaları (zod).
 *
 * Her Server Action girdisini buradan geçirir. Next'in kendi güvenlik rehberi
 * de aynısını söylüyor: bir Server Action aslında herkese açık bir POST ucudur,
 * arayüzden geçmeden de çağrılabilir. Formun sadece giriş yapmış bir sayfada
 * çizilmesi güvenlik sınırı değildir.
 *
 * Şema yalnızca girdinin **biçimini** doğrular. "Bu kayıt bu kullanıcıya ait mi"
 * sorusu şemanın işi değil, `dal.ts` içindeki yetki fonksiyonlarının işidir.
 */

import { z } from 'zod';

import { GUVENLIK, KONU_DURUMLARI } from './sabitler';

/* ----------------------------------------------------------------- Form durumu */

export type FormDurumu = {
  ok: boolean;
  mesaj: string;
  /** Alan adı → o alana ait hata mesajları. */
  alanHatalari?: Record<string, string[]>;
};

export const BOS_DURUM: FormDurumu = { ok: false, mesaj: '' };

/** zod hatasını forma basılabilir hâle çevirir. */
export function zodHatasi(hata: z.ZodError): FormDurumu {
  const duz = z.flattenError(hata);
  return {
    ok: false,
    mesaj: duz.formErrors[0] ?? 'Lütfen form alanlarını kontrol edin.',
    alanHatalari: duz.fieldErrors as Record<string, string[]>,
  };
}

/* -------------------------------------------------------------- Ortak parçalar */

/** E-posta her zaman kırpılıp küçük harfe indirgenerek saklanır. */
export const eposta = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Geçerli bir e-posta adresi girin.'));

export const yeniSifre = z
  .string()
  .min(
    GUVENLIK.SIFRE_MIN_UZUNLUK,
    `Şifre en az ${GUVENLIK.SIFRE_MIN_UZUNLUK} karakter olmalı.`,
  )
  .regex(/[A-Za-zÇĞİıÖŞÜçğöşü]/, 'Şifre en az bir harf içermeli.')
  .regex(/[0-9]/, 'Şifre en az bir rakam içermeli.');

const zorunluMetin = (ad: string, enAz = 2) =>
  z.string().trim().min(enAz, `${ad} zorunludur.`);

const istegeBagliMetin = z.string().trim().default('');

/** Onay kutusu: işaretliyse 'on' gelir, boşsa alan hiç gelmez. */
const onayKutusu = z.preprocess((v) => v === 'on' || v === 'true' || v === '1', z.boolean());

/** Mezun öğrencinin geçen yılki sıralaması; boş bırakılabilir. */
const siralama = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? null : v),
  z.coerce
    .number({ message: 'Sıralama sayı olmalı.' })
    .int('Sıralama tam sayı olmalı.')
    .min(1, 'Sıralama 1\'den küçük olamaz.')
    .max(5_000_000, 'Sıralama çok büyük.')
    .nullable(),
);

/* ---------------------------------------------------------------------- Kayıt */

export const kayitSemasi = z
  .object({
    ad: zorunluMetin('Ad'),
    soyad: zorunluMetin('Soyad'),
    eposta,
    telefon: istegeBagliMetin,
    mezun: onayKutusu,
    gecenYilSiralama: siralama,
    sifre: yeniSifre,
    sifreTekrar: z.string(),
  })
  .refine((v) => v.sifre === v.sifreTekrar, {
    message: 'Şifreler birbiriyle uyuşmuyor.',
    path: ['sifreTekrar'],
  });

export type KayitGirdisi = z.infer<typeof kayitSemasi>;

/* ---------------------------------------------------------------------- Giriş */

/**
 * Girişte şifre gücü aranmaz: eski bir hesabın şifresi bugünkü kuralları
 * sağlamıyor olabilir, bu bir giriş hatası değildir.
 */
export const girisSemasi = z.object({
  eposta: z.string().trim().toLowerCase().min(1, 'E-posta zorunludur.'),
  sifre: z.string().min(1, 'Şifre zorunludur.'),
});

/* ------------------------------------------------------------ Şifre değiştirme */

export const sifreDegistirSemasi = z
  .object({
    mevcutSifre: z.string().min(1, 'Mevcut şifrenizi girin.'),
    yeniSifre,
    yeniSifreTekrar: z.string(),
  })
  .refine((v) => v.yeniSifre === v.yeniSifreTekrar, {
    message: 'Yeni şifreler birbiriyle uyuşmuyor.',
    path: ['yeniSifreTekrar'],
  });

/* ------------------------------------------------------------ Sayısal alanlar */

/**
 * Form alanları hep metin gelir; sayıya çevirip sınırlarını doğrularız.
 * Negatif değerler burada da, veritabanı kısıtlarında da engellenir —
 * iki katman, çünkü Server Action arayüzden geçmeden de çağrılabilir.
 */
const sayi = (ad: string, enFazla = 100_000) =>
  z.coerce
    .number({ message: `${ad} sayı olmalı.` })
    .int(`${ad} tam sayı olmalı.`)
    .min(0, `${ad} negatif olamaz.`)
    .max(enFazla, `${ad} çok büyük.`);

/* ------------------------------------------------------------- Görev tamamlama */

/**
 * Soru sayısı boş bırakılırsa doğru+yanlış+boş toplamından türetilir —
 * öğrenci "12 doğru 3 yanlış" girip toplamı tekrar yazmak zorunda kalmasın.
 * Sonra dağılımın toplamı aşmadığı doğrulanır.
 */
const dagilimiDuzelt = <T extends { soru: number; dogru: number; yanlis: number; bos: number }>(
  v: T,
): T => ({ ...v, soru: v.soru || v.dogru + v.yanlis + v.bos });

const dagilimGecerli = (v: { soru: number; dogru: number; yanlis: number; bos: number }) =>
  v.dogru + v.yanlis + v.bos <= v.soru;

const DAGILIM_HATASI = {
  message: 'Doğru + yanlış + boş, çözülen soru sayısını aşamaz.',
  path: ['soru' as const],
};

export const gorevTamamlaSemasi = z
  .object({
    gorevId: z.uuid('Görev seçilmedi.'),
    soru: sayi('Soru sayısı', 5_000),
    dogru: sayi('Doğru', 5_000),
    yanlis: sayi('Yanlış', 5_000),
    bos: sayi('Boş', 5_000),
    sure: sayi('Süre', 1_440),
    notMetni: istegeBagliMetin,
  })
  .transform(dagilimiDuzelt)
  .refine(dagilimGecerli, DAGILIM_HATASI);

export const serbestCalismaSemasi = z
  .object({
    tarih: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçerli bir tarih seçin.'),
    ders: z.string().trim().min(1, 'Ders seçilmedi.'),
    konu: istegeBagliMetin,
    soru: sayi('Soru sayısı', 5_000),
    dogru: sayi('Doğru', 5_000),
    yanlis: sayi('Yanlış', 5_000),
    bos: sayi('Boş', 5_000),
    sure: sayi('Süre', 1_440),
    notMetni: istegeBagliMetin,
  })
  .transform(dagilimiDuzelt)
  .refine(dagilimGecerli, DAGILIM_HATASI);

/* --------------------------------------------------------------- Öğrenci kaydı */

const gunAnahtariSemasi = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçerli bir tarih seçin.');

/**
 * Koçun belirlediği şifre. Boş bırakılırsa sistem üretir.
 * Dolu ise normal şifre kurallarına uymak zorunda.
 */
const istegeBagliSifre = z.union([z.literal(''), yeniSifre]).default('');

export const ogrenciSemasi = z.object({
  adSoyad: z.string().trim().min(2, 'Ad soyad zorunludur.'),
  eposta: z.union([z.literal(''), eposta]).default(''),
  telefon: istegeBagliMetin,
  sinif: istegeBagliMetin,
  sinavTuru: z.enum(['YKS', 'LGS'], { message: 'Sınav türü seçin.' }),
  alan: istegeBagliMetin,
  hedef: istegeBagliMetin,
  hedefUniversite: istegeBagliMetin,
  hedefBolum: istegeBagliMetin,
  veliAdi: istegeBagliMetin,
  veliTelefon: istegeBagliMetin,
  adres: istegeBagliMetin,
  mezun: onayKutusu,
  gecenYilSiralama: siralama,
  baslangicTarihi: z.union([z.literal(''), gunAnahtariSemasi]).default(''),
  gunlukSoruHedefi: sayi('Günlük soru hedefi', 2_000),
  gunlukSureHedefi: sayi('Günlük süre hedefi', 1_440),
  sifre: istegeBagliSifre,
});

export const ogrenciGuncelleSemasi = ogrenciSemasi.extend({
  ogrenciId: z.uuid('Öğrenci seçilmedi.'),
  durum: z.enum(['aktif', 'pasif']).default('aktif'),
});

/* --------------------------------------------------------------------- Görev */

const saatSemasi = z.union([
  z.literal(''),
  z.string().trim().regex(/^\d{2}:\d{2}$/, 'Saat SS:DD biçiminde olmalı.'),
]);

export const gorevSemasi = z.object({
  ogrenciId: z.uuid('Öğrenci seçilmedi.'),
  tarih: gunAnahtariSemasi,
  baslangicSaati: saatSemasi.default(''),
  bitisSaati: saatSemasi.default(''),
  ders: z.string().trim().min(1, 'Ders zorunludur.'),
  konu: istegeBagliMetin,
  altKonu: istegeBagliMetin,
  gorevTuru: istegeBagliMetin,
  hedefSoru: sayi('Hedef soru', 5_000),
  hedefSure: sayi('Hedef süre', 1_440),
  oncelik: istegeBagliMetin,
  aciklama: istegeBagliMetin,
});

export const gorevGuncelleSemasi = gorevSemasi.extend({
  gorevId: z.uuid('Görev seçilmedi.'),
  durum: z.enum(['bekliyor', 'tamamlandi', 'yapilmadi']).default('bekliyor'),
});


/* ---------------------------------------------------------------- Konu durumu */

export const konuDurumSemasi = z.object({
  ogrenciId: z.uuid('Öğrenci seçilmedi.'),
  konuId: z.string().trim().min(1, 'Konu seçilmedi.'),
  durum: z.enum(KONU_DURUMLARI, { message: 'Geçersiz konu durumu.' }),
  soruSayisi: sayi('Soru sayısı', 10_000).default(0),
  basariYuzdesi: z.coerce.number().int().min(0).max(100).default(0),
  tekrarTarihi: z.union([z.literal(''), gunAnahtariSemasi]).default(''),
  notMetni: istegeBagliMetin,
});

/* ------------------------------------------------------------------- Deneme */

export const denemeSemasi = z.object({
  ogrenciId: z.uuid('Öğrenci seçilmedi.').optional(),
  denemeId: z.uuid().optional(),
  tarih: gunAnahtariSemasi,
  denemeAdi: istegeBagliMetin,
  tur: z.enum(['TYT', 'AYT', 'LGS'], { message: 'Deneme türü seçin.' }),
  sure: sayi('Süre', 1_440).default(0),
  degerlendirme: istegeBagliMetin,
  yapilmasiGerekenler: istegeBagliMetin,
});

/* -------------------------------------------------------------------- Notlar */

export const kocNotuSemasi = z.object({
  notId: z.uuid().optional(),
  ogrenciId: z.uuid('Öğrenci seçilmedi.'),
  tarih: z.union([z.literal(''), gunAnahtariSemasi]).default(''),
  notMetni: z.string().trim().min(1, 'Not boş olamaz.'),
  aksiyon: istegeBagliMetin,
  takipTarihi: z.union([z.literal(''), gunAnahtariSemasi]).default(''),
});

/* ------------------------------------------------------------------ Kaynaklar */

export const KAYNAK_TURLERI = ['Soru bankası', 'Konu anlatımı', 'Deneme', 'Video', 'Diğer'] as const;

export const kaynakSemasi = z.object({
  /** Koç için zorunlu; öğrenci için yok sayılır (kimlik oturumdan gelir). */
  ogrenciId: z.union([z.literal(''), z.uuid('Öğrenci seçilmedi.')]).default(''),
  ders: z.string().trim().min(1, 'Ders seçilmedi.'),
  ad: z.string().trim().min(1, 'Kaynak adı zorunludur.').max(120, 'Kaynak adı çok uzun.'),
  tur: istegeBagliMetin,
  notMetni: istegeBagliMetin,
});

/* ------------------------------------------------------------------- Yardımcı */

/** FormData'yı düz nesneye çevirir; şemaya vermeden önce kullanılır. */
export function formVerisi(form: FormData): Record<string, string> {
  const sonuc: Record<string, string> = {};
  for (const [anahtar, deger] of form.entries()) {
    if (typeof deger === 'string') sonuc[anahtar] = deger;
  }
  return sonuc;
}
