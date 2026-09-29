'use server';

/**
 * Koçun program yönetimi: görev ekleme, güncelleme, silme ve hafta kopyalama.
 *
 * Görevler yalnızca koç tarafından oluşturulur; öğrenci sadece tamamlar
 * (bkz. actions/gorev.ts).
 */

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { actionKoc } from '../dal';
import { veritabani } from '../db';
import {
  formVerisi,
  gorevGuncelleSemasi,
  gorevSemasi,
  zodHatasi,
  type FormDurumu,
} from '../dogrulama';
import { UYGULAMA } from '../sabitler';
import { calisma, gorevler, ogrenciler } from '../sema';

function tazele(ogrenciId: string) {
  revalidatePath(`${UYGULAMA.kok}/ogrenciler/${ogrenciId}`);
  revalidatePath(`${UYGULAMA.kok}/program`);
  revalidatePath(UYGULAMA.kok);
}

/** Saat alanı boşsa null yazılır; `''` Postgres'in time sütununa girmez. */
function saatDegeri(metin: string): string | null {
  return metin ? `${metin}:00` : null;
}

async function ogrenciVarMi(ogrenciId: string): Promise<boolean> {
  const db = veritabani();
  const [satir] = await db
    .select({ id: ogrenciler.id })
    .from(ogrenciler)
    .where(eq(ogrenciler.id, ogrenciId))
    .limit(1);
  return Boolean(satir);
}

/* ------------------------------------------------------------- Görev ekleme */

export async function gorevEkle(
  _oncekiDurum: FormDurumu,
  form: FormData,
): Promise<FormDurumu> {
  const yetki = await actionKoc();
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };

  const cozum = gorevSemasi.safeParse(formVerisi(form));
  if (!cozum.success) return zodHatasi(cozum.error);

  const veri = cozum.data;
  if (!(await ogrenciVarMi(veri.ogrenciId))) {
    return { ok: false, mesaj: 'Öğrenci bulunamadı.' };
  }

  await veritabani()
    .insert(gorevler)
    .values({
      ogrenciId: veri.ogrenciId,
      tarih: veri.tarih,
      baslangicSaati: saatDegeri(veri.baslangicSaati),
      bitisSaati: saatDegeri(veri.bitisSaati),
      ders: veri.ders,
      konu: veri.konu,
      altKonu: veri.altKonu,
      gorevTuru: veri.gorevTuru || 'Soru çözümü',
      hedefSoru: veri.hedefSoru,
      hedefSure: veri.hedefSure,
      oncelik: veri.oncelik || 'Normal',
      aciklama: veri.aciklama,
      olusturan: yetki.veri.eposta,
    });

  tazele(veri.ogrenciId);
  return { ok: true, mesaj: 'Görev eklendi.' };
}

/* ---------------------------------------------------------- Görev güncelleme */

export async function gorevGuncelle(
  _oncekiDurum: FormDurumu,
  form: FormData,
): Promise<FormDurumu> {
  const yetki = await actionKoc();
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };

  const cozum = gorevGuncelleSemasi.safeParse(formVerisi(form));
  if (!cozum.success) return zodHatasi(cozum.error);

  const veri = cozum.data;
  const db = veritabani();

  const [mevcut] = await db
    .select({ id: gorevler.id, durum: gorevler.durum })
    .from(gorevler)
    .where(eq(gorevler.id, veri.gorevId))
    .limit(1);

  if (!mevcut) return { ok: false, mesaj: 'Görev bulunamadı.' };

  const guncelleme = db
    .update(gorevler)
    .set({
      tarih: veri.tarih,
      baslangicSaati: saatDegeri(veri.baslangicSaati),
      bitisSaati: saatDegeri(veri.bitisSaati),
      ders: veri.ders,
      konu: veri.konu,
      altKonu: veri.altKonu,
      gorevTuru: veri.gorevTuru || 'Soru çözümü',
      hedefSoru: veri.hedefSoru,
      hedefSure: veri.hedefSure,
      oncelik: veri.oncelik || 'Normal',
      aciklama: veri.aciklama,
      durum: veri.durum,
      tamamlanmaZamani: veri.durum === 'tamamlandi' ? new Date() : null,
    })
    .where(eq(gorevler.id, veri.gorevId));

  // Tamamlanmış bir görev "bekliyor" ya da "yapılmadı"ya çekilirse çalışma
  // kaydı da silinir. Apps Script sürümünde bu satır kalıyordu; rapor görevi
  // yapılmamış sayarken soruları saymaya devam ediyordu.
  if (mevcut.durum === 'tamamlandi' && veri.durum !== 'tamamlandi') {
    await db.batch([guncelleme, db.delete(calisma).where(eq(calisma.gorevId, veri.gorevId))]);
  } else {
    await guncelleme;
  }

  tazele(veri.ogrenciId);
  return { ok: true, mesaj: 'Görev güncellendi.' };
}

/* -------------------------------------------------------------- Görev silme */

export async function gorevSil(gorevId: string): Promise<FormDurumu> {
  const yetki = await actionKoc();
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };

  const db = veritabani();
  const silinen = await db
    .delete(gorevler)
    .where(eq(gorevler.id, gorevId))
    .returning({ ogrenciId: gorevler.ogrenciId });

  if (silinen.length === 0) return { ok: false, mesaj: 'Görev bulunamadı.' };

  // Bağlı çalışma kaydı `on delete cascade` ile kendiliğinden gitti.
  tazele(silinen[0].ogrenciId);
  return { ok: true, mesaj: 'Görev silindi.' };
}

