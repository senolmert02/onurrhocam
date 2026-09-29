'use server';

/**
 * Koç notları — yalnızca koç görür ve yazar.
 *
 * Takip tarihi verilen notlar, o tarih geldiğinde koç panelinde öne çıkar.
 */

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { actionKoc } from '../dal';
import { veritabani } from '../db';
import { formVerisi, kocNotuSemasi, zodHatasi, type FormDurumu } from '../dogrulama';
import { UYGULAMA } from '../sabitler';
import { kocNotlari, ogrenciler } from '../sema';
import { bugun } from '../tarih';

function tazele(ogrenciId: string) {
  revalidatePath(`${UYGULAMA.kok}/ogrenciler/${ogrenciId}`);
  revalidatePath(UYGULAMA.kok);
}

export async function notKaydet(
  _oncekiDurum: FormDurumu,
  form: FormData,
): Promise<FormDurumu> {
  const yetki = await actionKoc();
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };

  const cozum = kocNotuSemasi.safeParse(formVerisi(form));
  if (!cozum.success) return zodHatasi(cozum.error);

  const veri = cozum.data;
  const db = veritabani();

  const [ogrenci] = await db
    .select({ id: ogrenciler.id })
    .from(ogrenciler)
    .where(eq(ogrenciler.id, veri.ogrenciId))
    .limit(1);

  if (!ogrenci) return { ok: false, mesaj: 'Öğrenci bulunamadı.' };

  const alanlar = {
    tarih: veri.tarih || bugun(),
    notMetni: veri.notMetni,
    aksiyon: veri.aksiyon,
    takipTarihi: veri.takipTarihi || null,
  };

  if (veri.notId) {
    const guncellenen = await db
      .update(kocNotlari)
      .set(alanlar)
      .where(eq(kocNotlari.id, veri.notId))
      .returning({ id: kocNotlari.id });

    if (guncellenen.length === 0) return { ok: false, mesaj: 'Not bulunamadı.' };
    tazele(veri.ogrenciId);
    return { ok: true, mesaj: 'Not güncellendi.' };
  }

  await db.insert(kocNotlari).values({
    ogrenciId: veri.ogrenciId,
    ...alanlar,
    yazan: yetki.veri.eposta,
  });

  tazele(veri.ogrenciId);
  return { ok: true, mesaj: 'Not eklendi.' };
}

export async function notSil(notId: string): Promise<FormDurumu> {
  const yetki = await actionKoc();
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };

  const db = veritabani();
  const silinen = await db
    .delete(kocNotlari)
    .where(eq(kocNotlari.id, notId))
    .returning({ ogrenciId: kocNotlari.ogrenciId });

  if (silinen.length === 0) return { ok: false, mesaj: 'Not bulunamadı.' };

  tazele(silinen[0].ogrenciId);
  return { ok: true, mesaj: 'Not silindi.' };
}

/** Takip tarihini kapatır — not kalır, listeden düşer. */
export async function takibiKapat(notId: string): Promise<FormDurumu> {
  const yetki = await actionKoc();
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };

  const db = veritabani();
  const guncellenen = await db
    .update(kocNotlari)
    .set({ takipTarihi: null })
    .where(eq(kocNotlari.id, notId))
    .returning({ ogrenciId: kocNotlari.ogrenciId });

  if (guncellenen.length === 0) return { ok: false, mesaj: 'Not bulunamadı.' };

  tazele(guncellenen[0].ogrenciId);
  return { ok: true, mesaj: 'Takip kapatıldı.' };
}
