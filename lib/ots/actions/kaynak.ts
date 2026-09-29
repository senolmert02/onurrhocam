'use server';

/**
 * Kaynaklar: öğrencinin elindeki kitap/soru bankası/video listesi.
 *
 * Öğrenci yalnızca kendi kaynağını ekler ve siler; koç her öğrenci için
 * ekleyip silebilir. Yetki kararı `actionOgrenciErisimi` ile verilir —
 * öğrenci formda başka bir ogrenciId gönderse de kimlik oturumdan gelir.
 */

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { actionOgrenciErisimi } from '../dal';
import { veritabani } from '../db';
import { formVerisi, kaynakSemasi, zodHatasi, type FormDurumu } from '../dogrulama';
import { UYGULAMA } from '../sabitler';
import { kaynaklar } from '../sema';

function tazele(ogrenciId: string) {
  revalidatePath(`${UYGULAMA.kok}/kaynaklar`);
  revalidatePath(`${UYGULAMA.kok}/ogrenciler/${ogrenciId}`);
}

export async function kaynakEkle(
  _oncekiDurum: FormDurumu,
  form: FormData,
): Promise<FormDurumu> {
  const cozum = kaynakSemasi.safeParse(formVerisi(form));
  if (!cozum.success) return zodHatasi(cozum.error);

  const veri = cozum.data;
  const yetki = await actionOgrenciErisimi(veri.ogrenciId || undefined);
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };

  const ogrenciId = yetki.veri.ogrenci.id;

  await veritabani().insert(kaynaklar).values({
    ogrenciId,
    ders: veri.ders,
    ad: veri.ad,
    tur: veri.tur,
    notMetni: veri.notMetni,
  });

  tazele(ogrenciId);
  return { ok: true, mesaj: 'Kaynak eklendi.' };
}

export async function kaynakSil(kaynakId: string): Promise<FormDurumu> {
  const db = veritabani();

  const [kaynak] = await db
    .select({ id: kaynaklar.id, ogrenciId: kaynaklar.ogrenciId })
    .from(kaynaklar)
    .where(eq(kaynaklar.id, kaynakId))
    .limit(1);

  if (!kaynak) return { ok: false, mesaj: 'Kaynak bulunamadı.' };

  // Öğrenci için erişim kendi kaydına çözülür; kaynak başkasınınsa eşleşmez.
  const yetki = await actionOgrenciErisimi(kaynak.ogrenciId);
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };
  if (yetki.veri.ogrenci.id !== kaynak.ogrenciId) {
    return { ok: false, mesaj: 'Bu kaynak size ait değil.' };
  }

  await db.delete(kaynaklar).where(eq(kaynaklar.id, kaynakId));

  tazele(kaynak.ogrenciId);
  return { ok: true, mesaj: 'Kaynak silindi.' };
}
