'use server';

/**
 * Konu durumu güncelleme — yalnızca koç.
 *
 * Öğrenci tarafı salt görüntüdür: konu bitti mi kararını koç verir, öğrenci
 * kendi ilerlemesini şişiremez.
 *
 * Konu kataloğu kodda tutulduğu için `konuId` yabancı anahtar değil; gelen
 * kimliğin katalogda gerçekten var olduğu burada doğrulanır.
 */

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { actionKoc } from '../dal';
import { veritabani } from '../db';
import { formVerisi, konuDurumSemasi, zodHatasi, type FormDurumu } from '../dogrulama';
import { konuBul } from '../konu-katalogu';
import { konuTamamMi, UYGULAMA } from '../sabitler';
import { ogrenciKonu } from '../sema';
import { bugun } from '../tarih';

export async function konuDurumuGuncelle(
  _oncekiDurum: FormDurumu,
  form: FormData,
): Promise<FormDurumu> {
  const yetki = await actionKoc();
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };

  const cozum = konuDurumSemasi.safeParse(formVerisi(form));
  if (!cozum.success) return zodHatasi(cozum.error);

  const veri = cozum.data;
  const katalogKaydi = konuBul(veri.konuId);
  if (!katalogKaydi) return { ok: false, mesaj: 'Konu bulunamadı.' };

  const db = veritabani();
  const gun = bugun();
  const tamam = konuTamamMi(veri.durum);
  const baslandi = veri.durum !== 'Başlanmadı';

  const [mevcut] = await db
    .select({
      id: ogrenciKonu.id,
      ilkCalismaTarihi: ogrenciKonu.ilkCalismaTarihi,
      tamamlanmaTarihi: ogrenciKonu.tamamlanmaTarihi,
    })
    .from(ogrenciKonu)
    .where(
      and(eq(ogrenciKonu.ogrenciId, veri.ogrenciId), eq(ogrenciKonu.konuId, veri.konuId)),
    )
    .limit(1);

  const ortak = {
    durum: veri.durum,
    soruSayisi: veri.soruSayisi,
    basariYuzdesi: veri.basariYuzdesi,
    tekrarTarihi: veri.tekrarTarihi || null,
    notMetni: veri.notMetni,
    guncellemeZamani: new Date(),
  };

  if (mevcut) {
    await db
      .update(ogrenciKonu)
      .set({
        ...ortak,
        // İlk çalışma tarihi bir kez yazılır, sonra dokunulmaz.
        ilkCalismaTarihi:
          mevcut.ilkCalismaTarihi ?? (baslandi ? gun : null),
        // Tamamlanma tarihi korunur; durum geri alınırsa temizlenir.
        tamamlanmaTarihi: tamam ? (mevcut.tamamlanmaTarihi ?? gun) : null,
      })
      .where(eq(ogrenciKonu.id, mevcut.id));
  } else {
    await db.insert(ogrenciKonu).values({
      ogrenciId: veri.ogrenciId,
      konuId: veri.konuId,
      ...ortak,
      ilkCalismaTarihi: baslandi ? gun : null,
      tamamlanmaTarihi: tamam ? gun : null,
    });
  }

  revalidatePath(`${UYGULAMA.kok}/ogrenciler/${veri.ogrenciId}`);
  revalidatePath(`${UYGULAMA.kok}/konular`);
  revalidatePath(UYGULAMA.kok);

  return { ok: true, mesaj: `${katalogKaydi.konu}: ${veri.durum}` };
}
