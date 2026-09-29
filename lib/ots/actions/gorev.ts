'use server';

/**
 * Öğrencinin görev işlemleri: tamamlama, geri alma, serbest çalışma.
 *
 * Her işlem `actionOgrenci()` ile kimliği oturumdan alır ve görevin **o
 * öğrenciye ait olduğunu** ayrıca doğrular. İstemciden gelen `gorevId`
 * yalnızca bir işarettir; sahipliği veritabanından teyit edilir.
 */

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { actionOgrenci } from '../dal';
import { veritabani } from '../db';
import {
  formVerisi,
  gorevTamamlaSemasi,
  serbestCalismaSemasi,
  zodHatasi,
  type FormDurumu,
} from '../dogrulama';
import { UYGULAMA } from '../sabitler';
import { calisma, gorevler } from '../sema';

function ekranlariTazele() {
  revalidatePath(UYGULAMA.kok);
  revalidatePath(`${UYGULAMA.kok}/program`);
  revalidatePath(`${UYGULAMA.kok}/gecmis`);
  revalidatePath(`${UYGULAMA.kok}/rapor`);
}

/* ------------------------------------------------------------ Görev tamamlama */

export async function gorevTamamla(
  _oncekiDurum: FormDurumu,
  form: FormData,
): Promise<FormDurumu> {
  const yetki = await actionOgrenci();
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };

  const cozum = gorevTamamlaSemasi.safeParse(formVerisi(form));
  if (!cozum.success) return zodHatasi(cozum.error);

  const veri = cozum.data;
  const { ogrenci } = yetki.veri;
  const db = veritabani();

  // Sahiplik kontrolü: görev bu öğrenciye ait değilse hiçbir şey yapılmaz.
  const [gorev] = await db
    .select({ id: gorevler.id, tarih: gorevler.tarih, ders: gorevler.ders, konu: gorevler.konu })
    .from(gorevler)
    .where(and(eq(gorevler.id, veri.gorevId), eq(gorevler.ogrenciId, ogrenci.id)))
    .limit(1);

  if (!gorev) return { ok: false, mesaj: 'Görev bulunamadı.' };

  const calismaKaydi = {
    gorevId: gorev.id,
    ogrenciId: ogrenci.id,
    tarih: gorev.tarih,
    ders: gorev.ders,
    konu: gorev.konu,
    soru: veri.soru,
    dogru: veri.dogru,
    yanlis: veri.yanlis,
    bos: veri.bos,
    sure: veri.sure,
    notMetni: veri.notMetni,
    kayitZamani: new Date(),
  };

  // İki yazma tek atomik işlemde: çalışma kaydı yazılıp görev güncellenmezse
  // ekran tutarsız kalırdı. Neon'un HTTP sürücüsü etkileşimli transaction
  // desteklemiyor ama `batch` sunucu tarafında tek transaction olarak çalışır.
  //
  // Aynı görev tekrar kaydedilirse mevcut satır güncellenir; `calisma.gorev_id`
  // benzersiz olduğu için bu kural veritabanında da garanti altında.
  await db.batch([
    db
      .insert(calisma)
      .values(calismaKaydi)
      .onConflictDoUpdate({ target: calisma.gorevId, set: calismaKaydi }),
    db
      .update(gorevler)
      .set({ durum: 'tamamlandi', tamamlanmaZamani: new Date() })
      .where(eq(gorevler.id, gorev.id)),
  ]);

  ekranlariTazele();
  return { ok: true, mesaj: 'Görev tamamlandı.' };
}

/* --------------------------------------------------------------- Geri alma */

export async function gorevGeriAl(gorevId: string): Promise<FormDurumu> {
  const yetki = await actionOgrenci();
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };

  const db = veritabani();
  const { ogrenci } = yetki.veri;

  const [gorev] = await db
    .select({ id: gorevler.id })
    .from(gorevler)
    .where(and(eq(gorevler.id, gorevId), eq(gorevler.ogrenciId, ogrenci.id)))
    .limit(1);

  if (!gorev) return { ok: false, mesaj: 'Görev bulunamadı.' };

  // Çalışma kaydı da silinir; yarım kalmış veri bırakmıyoruz.
  // Apps Script sürümünde `updateTask_` durumu geri alırken çalışma satırını
  // bırakıyordu; rapor görevi yapılmamış sayarken soruları saymaya devam ediyordu.
  await db.batch([
    db.delete(calisma).where(eq(calisma.gorevId, gorev.id)),
    db
      .update(gorevler)
      .set({ durum: 'bekliyor', tamamlanmaZamani: null })
      .where(eq(gorevler.id, gorev.id)),
  ]);

  ekranlariTazele();
  return { ok: true, mesaj: 'Tamamlama geri alındı.' };
}

/* ----------------------------------------------------------- Serbest çalışma */

export async function serbestCalismaEkle(
  _oncekiDurum: FormDurumu,
  form: FormData,
): Promise<FormDurumu> {
  const yetki = await actionOgrenci();
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };

  const cozum = serbestCalismaSemasi.safeParse(formVerisi(form));
  if (!cozum.success) return zodHatasi(cozum.error);

  const veri = cozum.data;
  const db = veritabani();

  await db.insert(calisma).values({
    gorevId: null,
    ogrenciId: yetki.veri.ogrenci.id,
    tarih: veri.tarih,
    ders: veri.ders,
    konu: veri.konu,
    soru: veri.soru,
    dogru: veri.dogru,
    yanlis: veri.yanlis,
    bos: veri.bos,
    sure: veri.sure,
    notMetni: veri.notMetni,
  });

  ekranlariTazele();
  return { ok: true, mesaj: 'Çalışma kaydedildi.' };
}

/* ------------------------------------------------------- Çalışma kaydı silme */

export async function calismaSil(calismaId: string): Promise<FormDurumu> {
  const yetki = await actionOgrenci();
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };

  const db = veritabani();
  const [kayit] = await db
    .select({ id: calisma.id, gorevId: calisma.gorevId })
    .from(calisma)
    .where(and(eq(calisma.id, calismaId), eq(calisma.ogrenciId, yetki.veri.ogrenci.id)))
    .limit(1);

  if (!kayit) return { ok: false, mesaj: 'Kayıt bulunamadı.' };
  if (kayit.gorevId) {
    return {
      ok: false,
      mesaj: 'Bu kayıt bir göreve bağlı. Görevin tamamlanmasını geri alarak silebilirsin.',
    };
  }

  await db.delete(calisma).where(eq(calisma.id, kayit.id));
  ekranlariTazele();
  return { ok: true, mesaj: 'Çalışma kaydı silindi.' };
}
