'use server';

/**
 * Kimlik işlemleri: kayıt, giriş, çıkış.
 *
 * Kayıt akışı: herkes kaydolabilir, hesap `beklemede` açılır, koç onaylayana
 * kadar giriş yapılamaz. Onaylanmayan kayıtlar bir hafta sonra silinir
 * (temizlik koç onay ekranını açtığında çalışır).
 */

import { eq, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { veritabani } from '../db';
import { actionKullanicisi } from '../dal';
import {
  formVerisi,
  girisSemasi,
  kayitSemasi,
  sifreDegistirSemasi,
  zodHatasi,
  type FormDurumu,
} from '../dogrulama';
import { oturumBaslat, oturumKapat } from '../oturum';
import { GUVENLIK, KAYIT, UYGULAMA } from '../sabitler';
import { kullanicilar } from '../sema';
import { sahteDogrulama, sifreDogru, sifreOzeti } from '../sifre';

/** Hatalı girişte kullanıcının var olup olmadığı sızdırılmaz: tek mesaj. */
const GIRIS_HATASI = 'E-posta veya şifre hatalı.';

/**
 * Onay bekleyen kayıt sayısının üst sınırı.
 *
 * Kayıt herkese açık olduğu için kötü niyetli biri sınırsız kayıt üretip
 * veritabanını şişirebilir. Bu, o ihtimale karşı bir emniyet valfi — gerçek
 * bir hız sınırlaması değil. Düzgün hız sınırlaması IP takibi gerektiriyor;
 * ihtiyaç olursa Faz 6'da eklenecek. Sınır bilerek yüksek tutuldu ki meşru
 * kayıtları engellemek için kullanılamasın.
 */
const ONAY_BEKLEYEN_SINIRI = 200;

/* ---------------------------------------------------------------------- Kayıt */

export async function kayitOl(
  _oncekiDurum: FormDurumu,
  form: FormData,
): Promise<FormDurumu> {
  if (!KAYIT.ACIK) {
    return { ok: false, mesaj: 'Kayıt şu anda kapalı. Koçunuzla iletişime geçin.' };
  }

  const cozum = kayitSemasi.safeParse(formVerisi(form));
  if (!cozum.success) return zodHatasi(cozum.error);

  const { ad, soyad, eposta, telefon, sifre, mezun, gecenYilSiralama } = cozum.data;
  const db = veritabani();

  const [mevcut] = await db
    .select({ id: kullanicilar.id })
    .from(kullanicilar)
    .where(eq(kullanicilar.email, eposta))
    .limit(1);

  if (mevcut) {
    return {
      ok: false,
      mesaj: 'Bu e-posta adresiyle bir hesap zaten var.',
      alanHatalari: { eposta: ['Bu e-posta adresiyle bir hesap zaten var.'] },
    };
  }

  const [{ adet }] = await db
    .select({ adet: sql<number>`count(*)::int` })
    .from(kullanicilar)
    .where(eq(kullanicilar.durum, 'beklemede'));

  if (adet >= ONAY_BEKLEYEN_SINIRI) {
    return {
      ok: false,
      mesaj: 'Kayıtlar geçici olarak alınamıyor. Lütfen daha sonra tekrar deneyin.',
    };
  }

  await db.insert(kullanicilar).values({
    ad,
    soyad,
    email: eposta,
    telefon,
    mezun,
    gecenYilSiralama: mezun ? gecenYilSiralama : null,
    sifreHash: await sifreOzeti(sifre),
    rol: 'ogrenci',
    durum: 'beklemede',
  });

  return {
    ok: true,
    mesaj:
      'Kaydınız alındı. Koçunuz hesabınızı onayladıktan sonra giriş yapabilirsiniz. ' +
      `Onaylanmayan kayıtlar ${KAYIT.ONAY_BEKLEME_GUN} gün sonra silinir.`,
  };
}

/* ---------------------------------------------------------------------- Giriş */

export async function girisYap(
  _oncekiDurum: FormDurumu,
  form: FormData,
): Promise<FormDurumu> {
  const cozum = girisSemasi.safeParse(formVerisi(form));
  if (!cozum.success) return zodHatasi(cozum.error);

  const { eposta, sifre } = cozum.data;
  const db = veritabani();

  const [kullanici] = await db
    .select({
      id: kullanicilar.id,
      rol: kullanicilar.rol,
      durum: kullanicilar.durum,
      sifreHash: kullanicilar.sifreHash,
      basarisizDeneme: kullanicilar.basarisizDeneme,
      kilitBitis: kullanicilar.kilitBitis,
    })
    .from(kullanicilar)
    .where(eq(kullanicilar.email, eposta))
    .limit(1);

  // Kullanıcı yoksa da bir bcrypt karşılaştırması çalıştırılır; aksi hâlde
  // yanıt süresi hangi e-postaların kayıtlı olduğunu ele verir.
  if (!kullanici) {
    await sahteDogrulama(sifre);
    return { ok: false, mesaj: GIRIS_HATASI };
  }

  if (kullanici.kilitBitis && kullanici.kilitBitis.getTime() > Date.now()) {
    const kalanDakika = Math.ceil((kullanici.kilitBitis.getTime() - Date.now()) / 60000);
    return {
      ok: false,
      mesaj: `Çok fazla hatalı deneme. ${kalanDakika} dakika sonra tekrar deneyin.`,
    };
  }

  if (!(await sifreDogru(sifre, kullanici.sifreHash))) {
    const deneme = kullanici.basarisizDeneme + 1;
    const kilitlensin = deneme >= GUVENLIK.MAKS_HATALI_DENEME;

    await db
      .update(kullanicilar)
      .set({
        basarisizDeneme: kilitlensin ? 0 : deneme,
        kilitBitis: kilitlensin
          ? new Date(Date.now() + GUVENLIK.KILIT_DAKIKA * 60_000)
          : kullanici.kilitBitis,
      })
      .where(eq(kullanicilar.id, kullanici.id));

    return { ok: false, mesaj: GIRIS_HATASI };
  }

  // Şifre doğru; hesap durumu ancak bu aşamada açıklanır.
  if (kullanici.durum === 'beklemede') {
    return {
      ok: false,
      mesaj: 'Hesabınız koç onayı bekliyor. Onaylandığında giriş yapabilirsiniz.',
    };
  }
  if (kullanici.durum !== 'aktif') {
    return { ok: false, mesaj: 'Hesabınız aktif değil. Koçunuzla görüşün.' };
  }

  await db
    .update(kullanicilar)
    .set({ sonGiris: new Date(), basarisizDeneme: 0, kilitBitis: null })
    .where(eq(kullanicilar.id, kullanici.id));

  await oturumBaslat({
    kullaniciId: kullanici.id,
    rol: kullanici.rol === 'koc' ? 'koc' : 'ogrenci',
  });

  // redirect() bir istisna fırlatarak çalışır; try/catch içine alınmamalı.
  redirect(UYGULAMA.kok);
}

/* ---------------------------------------------------------------------- Çıkış */

export async function cikisYap(): Promise<void> {
  await oturumKapat();
  redirect(`${UYGULAMA.kok}/giris`);
}

/* --------------------------------------------------------- Şifre değiştirme */

/**
 * Kullanıcının kendi şifresini değiştirmesi.
 *
 * Mevcut şifre her zaman sorulur: açık bir oturumu ele geçiren birinin
 * şifreyi değiştirip hesabı tamamen devralmasını zorlaştırır.
 */
export async function sifreDegistir(
  _oncekiDurum: FormDurumu,
  form: FormData,
): Promise<FormDurumu> {
  const yetki = await actionKullanicisi();
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };

  const cozum = sifreDegistirSemasi.safeParse(formVerisi(form));
  if (!cozum.success) return zodHatasi(cozum.error);

  const db = veritabani();
  const [kayit] = await db
    .select({ id: kullanicilar.id, sifreHash: kullanicilar.sifreHash })
    .from(kullanicilar)
    .where(eq(kullanicilar.id, yetki.veri.id))
    .limit(1);

  if (!kayit) return { ok: false, mesaj: 'Hesap bulunamadı.' };

  if (!(await sifreDogru(cozum.data.mevcutSifre, kayit.sifreHash))) {
    return {
      ok: false,
      mesaj: 'Mevcut şifre hatalı.',
      alanHatalari: { mevcutSifre: ['Mevcut şifre hatalı.'] },
    };
  }

  await db
    .update(kullanicilar)
    .set({ sifreHash: await sifreOzeti(cozum.data.yeniSifre) })
    .where(eq(kullanicilar.id, kayit.id));

  return { ok: true, mesaj: 'Şifren güncellendi.' };
}
