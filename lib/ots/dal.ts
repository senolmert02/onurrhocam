/**
 * Veri Erişim Katmanı (DAL) — oturum doğrulama ve yetkilendirme.
 *
 * Apps Script sürümündeki `withAuth_` / `withCoach_` / `withStudent_` /
 * `withStudentAccess_` sarmalayıcılarının karşılığı. Kural aynı kalıyor:
 *
 *   **Öğrencinin gönderdiği `ogrenciId` asla güvenilmez.** İstek bir kimlik
 *   gönderse de göndermese de, öğrenci kendi kaydına sunucuda sabitlenir.
 *
 * Her sayfa ve her Server Action buradan geçer. Formun yalnızca giriş yapmış
 * bir sayfada çizilmesi güvenlik sınırı değildir: Server Action herkese açık
 * bir POST ucudur ve arayüzden geçmeden çağrılabilir.
 *
 * Yetkili rol ve hesap durumu **her istekte veritabanından** okunur. Apps Script
 * sürümünde bu bilgi oturum önbelleğinden geliyordu; pasife alınan bir öğrenci
 * altı saate kadar girmeye devam edebiliyordu. Postgres'te bu okuma birincil
 * anahtar üzerinden tek satır olduğu için ucuz, o açık kapanıyor.
 *
 * React'in `cache()` sarmalayıcısı aynı istek içindeki tekrar çağrıları
 * birleştirir: bir sayfa beş kez `oturumKullanicisi()` çağırsa da veritabanına
 * bir kez gidilir.
 */

import 'server-only';

import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import { veritabani } from './db';
import { oturumYuku } from './oturum';
import { UYGULAMA, kocMu, type Rol } from './sabitler';
import { kullanicilar, ogrenciler, type Ogrenci } from './sema';

/** Arayüze ve iş katmanına verilen kullanıcı. Şifre alanları asla buraya girmez. */
export type GuvenliKullanici = {
  id: string;
  ad: string;
  soyad: string;
  adSoyad: string;
  eposta: string;
  rol: Rol;
  rolAdi: string;
  koc: boolean;
  telefon: string;
  sonGiris: Date | null;
};

const GIRIS_ADRESI = `${UYGULAMA.kok}/giris`;

/**
 * Oturumdaki kullanıcı; yoksa, hesabı silinmişse ya da aktif değilse `null`.
 * Yönlendirme yapmaz — Server Action'lar bunu kullanıp kendi hatasını döner.
 */
export const oturumKullanicisi = cache(async (): Promise<GuvenliKullanici | null> => {
  const yuk = await oturumYuku();
  if (!yuk) return null;

  const db = veritabani();
  const [satir] = await db
    .select({
      id: kullanicilar.id,
      ad: kullanicilar.ad,
      soyad: kullanicilar.soyad,
      eposta: kullanicilar.email,
      rol: kullanicilar.rol,
      durum: kullanicilar.durum,
      telefon: kullanicilar.telefon,
      sonGiris: kullanicilar.sonGiris,
    })
    .from(kullanicilar)
    .where(eq(kullanicilar.id, yuk.kullaniciId))
    .limit(1);

  // Hesap silinmiş, pasife alınmış ya da onayı geri çekilmişse oturum düşer.
  if (!satir || satir.durum !== 'aktif') return null;

  const rol = satir.rol as Rol;
  return {
    id: satir.id,
    ad: satir.ad,
    soyad: satir.soyad,
    adSoyad: `${satir.ad} ${satir.soyad}`.trim(),
    eposta: satir.eposta,
    rol,
    rolAdi: rol === 'koc' ? 'Koç' : 'Öğrenci',
    koc: kocMu(rol),
    telefon: satir.telefon,
    sonGiris: satir.sonGiris,
  };
});

/** Kullanıcıya bağlı öğrenci kaydı. Koçun öğrenci kaydı olmaz. */
export const kullanicininOgrencisi = cache(
  async (kullaniciId: string): Promise<Ogrenci | null> => {
    const db = veritabani();
    const [satir] = await db
      .select()
      .from(ogrenciler)
      .where(eq(ogrenciler.kullaniciId, kullaniciId))
      .limit(1);
    return satir ?? null;
  },
);

/** Postgres `uuid` sütununa gitmeden önce biçim kontrolü — bozuk kimlik sorguyu çökertmesin. */
const UUID_BICIMI = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const ogrenciKaydi = cache(async (ogrenciId: string): Promise<Ogrenci | null> => {
  // Adres çubuğundaki `?ogrenci=abc` ya da `/ogrenciler/xyz` 500 değil, "bulunamadı" olsun.
  if (!UUID_BICIMI.test(ogrenciId)) return null;
  const db = veritabani();
  const [satir] = await db
    .select()
    .from(ogrenciler)
    .where(eq(ogrenciler.id, ogrenciId))
    .limit(1);
  return satir ?? null;
});

/* ------------------------------------------------------- Sayfalar için kapılar
   Bu fonksiyonlar koşul sağlanmazsa yönlendirir; sunucu bileşenlerinde kullanılır.
   Server Action'larda kullanılmaz — orada hata mesajı dönmek gerekir. */

export async function girisGerekli(): Promise<GuvenliKullanici> {
  const kullanici = await oturumKullanicisi();
  if (!kullanici) redirect(GIRIS_ADRESI);
  return kullanici;
}

export async function kocGerekli(): Promise<GuvenliKullanici> {
  const kullanici = await girisGerekli();
  if (!kullanici.koc) redirect(UYGULAMA.kok);
  return kullanici;
}

export async function ogrenciGerekli(): Promise<{
  kullanici: GuvenliKullanici;
  ogrenci: Ogrenci;
}> {
  const kullanici = await girisGerekli();
  if (kullanici.koc) redirect(UYGULAMA.kok);

  const ogrenci = await kullanicininOgrencisi(kullanici.id);
  // Onaylanmış her öğrencinin kaydı vardır; yoksa veri tutarsızlığı var demektir.
  if (!ogrenci) redirect(`${UYGULAMA.kok}/kayit-eksik`);

  return { kullanici, ogrenci };
}

/**
 * Koç her öğrenciye, öğrenci yalnızca kendine erişir.
 *
 * Öğrenci için `istenenOgrenciId` **yok sayılır**: kimliği oturumdan türetilir.
 * Bu, eski sürümdeki `withStudentAccess_` kuralının aynısı ve istemciden gelen
 * kimliğe güvenmeme ilkesinin uygulandığı yer.
 */
export async function ogrenciErisimi(istenenOgrenciId?: string): Promise<{
  kullanici: GuvenliKullanici;
  ogrenci: Ogrenci;
}> {
  const kullanici = await girisGerekli();

  if (!kullanici.koc) {
    const kendi = await kullanicininOgrencisi(kullanici.id);
    if (!kendi) redirect(`${UYGULAMA.kok}/kayit-eksik`);
    return { kullanici, ogrenci: kendi };
  }

  if (!istenenOgrenciId) redirect(`${UYGULAMA.kok}/ogrenciler`);
  const ogrenci = await ogrenciKaydi(istenenOgrenciId);
  if (!ogrenci) redirect(`${UYGULAMA.kok}/ogrenciler`);

  return { kullanici, ogrenci };
}

/* ------------------------------------------------- Server Action'lar için kapılar
   Yönlendirmez; forma basılabilecek bir sonuç döner. */

export type YetkiSonucu<T> =
  | { yetkili: true; veri: T }
  | { yetkili: false; mesaj: string };

export async function actionKullanicisi(): Promise<YetkiSonucu<GuvenliKullanici>> {
  const kullanici = await oturumKullanicisi();
  if (!kullanici) {
    return { yetkili: false, mesaj: 'Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.' };
  }
  return { yetkili: true, veri: kullanici };
}

export async function actionKoc(): Promise<YetkiSonucu<GuvenliKullanici>> {
  const sonuc = await actionKullanicisi();
  if (!sonuc.yetkili) return sonuc;
  if (!sonuc.veri.koc) return { yetkili: false, mesaj: 'Bu işlem için yetkiniz yok.' };
  return sonuc;
}

export async function actionOgrenci(): Promise<
  YetkiSonucu<{ kullanici: GuvenliKullanici; ogrenci: Ogrenci }>
> {
  const sonuc = await actionKullanicisi();
  if (!sonuc.yetkili) return sonuc;
  if (sonuc.veri.koc) return { yetkili: false, mesaj: 'Bu işlem öğrenciler içindir.' };

  const ogrenci = await kullanicininOgrencisi(sonuc.veri.id);
  if (!ogrenci) return { yetkili: false, mesaj: 'Öğrenci kaydınız bulunamadı. Koçunuzla görüşün.' };

  return { yetkili: true, veri: { kullanici: sonuc.veri, ogrenci } };
}

/** `ogrenciErisimi`nin Server Action karşılığı. */
export async function actionOgrenciErisimi(
  istenenOgrenciId?: string,
): Promise<YetkiSonucu<{ kullanici: GuvenliKullanici; ogrenci: Ogrenci }>> {
  const sonuc = await actionKullanicisi();
  if (!sonuc.yetkili) return sonuc;
  const kullanici = sonuc.veri;

  if (!kullanici.koc) {
    const kendi = await kullanicininOgrencisi(kullanici.id);
    if (!kendi) return { yetkili: false, mesaj: 'Öğrenci kaydınız bulunamadı.' };
    return { yetkili: true, veri: { kullanici, ogrenci: kendi } };
  }

  if (!istenenOgrenciId) return { yetkili: false, mesaj: 'Öğrenci seçilmedi.' };
  const ogrenci = await ogrenciKaydi(istenenOgrenciId);
  if (!ogrenci) return { yetkili: false, mesaj: 'Öğrenci bulunamadı.' };

  return { yetkili: true, veri: { kullanici, ogrenci } };
}
