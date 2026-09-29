'use server';

/**
 * Kayıt onaylama ve reddetme — yalnızca koç.
 *
 * Onaylama iki yazma gerektirir: kullanıcının durumu `aktif` olur ve ona bağlı
 * bir öğrenci kaydı açılır. İkisi `db.batch` ile tek atomik işlemde yapılır;
 * yarısı yazılıp yarısı yazılmadan kalırsa giriş yapabilen ama öğrenci kaydı
 * olmayan bir hesap ortaya çıkardı.
 */

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { actionKoc } from '../dal';
import { veritabani } from '../db';
import type { FormDurumu } from '../dogrulama';
import { UYGULAMA } from '../sabitler';
import { kullanicilar, ogrenciler } from '../sema';
import { bugun } from '../tarih';

function tazele() {
  revalidatePath(`${UYGULAMA.kok}/onaylar`);
  revalidatePath(`${UYGULAMA.kok}/ogrenciler`);
  revalidatePath(UYGULAMA.kok);
}

export async function kaydiOnayla(kullaniciId: string): Promise<FormDurumu> {
  const yetki = await actionKoc();
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };

  const db = veritabani();

  const [aday] = await db
    .select({
      id: kullanicilar.id,
      ad: kullanicilar.ad,
      soyad: kullanicilar.soyad,
      email: kullanicilar.email,
      telefon: kullanicilar.telefon,
      mezun: kullanicilar.mezun,
      gecenYilSiralama: kullanicilar.gecenYilSiralama,
    })
    .from(kullanicilar)
    .where(and(eq(kullanicilar.id, kullaniciId), eq(kullanicilar.durum, 'beklemede')))
    .limit(1);

  if (!aday) return { ok: false, mesaj: 'Onay bekleyen kayıt bulunamadı.' };

  // Öğrenci kaydı zaten varsa (örneğin koç önce elle eklediyse) tekrar açılmaz.
  const [mevcutOgrenci] = await db
    .select({ id: ogrenciler.id })
    .from(ogrenciler)
    .where(eq(ogrenciler.kullaniciId, aday.id))
    .limit(1);

  const adSoyad = `${aday.ad} ${aday.soyad}`.trim();

  if (mevcutOgrenci) {
    await db
      .update(kullanicilar)
      .set({ durum: 'aktif' })
      .where(eq(kullanicilar.id, aday.id));
  } else {
    await db.batch([
      db.update(kullanicilar).set({ durum: 'aktif' }).where(eq(kullanicilar.id, aday.id)),
      db.insert(ogrenciler).values({
        kullaniciId: aday.id,
        adSoyad,
        email: aday.email,
        telefon: aday.telefon,
        mezun: aday.mezun,
        gecenYilSiralama: aday.gecenYilSiralama,
        baslangicTarihi: bugun(),
      }),
    ]);
  }

  tazele();
  return { ok: true, mesaj: `${adSoyad} onaylandı.` };
}

/**
 * Kaydı reddeder ve siler.
 *
 * Silme kalıcıdır — onaylanmayan biri için veri saklamanın bir gerekçesi yok.
 * Yalnızca `beklemede` durumundaki kayıtlar silinebilir; aktif bir hesabı
 * buradan silmek mümkün değil.
 */
export async function kaydiReddet(kullaniciId: string): Promise<FormDurumu> {
  const yetki = await actionKoc();
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };

  const db = veritabani();
  const silinen = await db
    .delete(kullanicilar)
    .where(and(eq(kullanicilar.id, kullaniciId), eq(kullanicilar.durum, 'beklemede')))
    .returning({ email: kullanicilar.email });

  if (silinen.length === 0) {
    return { ok: false, mesaj: 'Onay bekleyen kayıt bulunamadı.' };
  }

  tazele();
  return { ok: true, mesaj: 'Kayıt reddedildi ve silindi.' };
}
