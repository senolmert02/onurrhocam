import 'server-only';

/**
 * Panelden değiştirilebilen ayarlar.
 *
 * Uyarı eşikleri `sabitler.ts` içinde varsayılan olarak duruyor; buradaki
 * katman veritabanındaki geçersiz kılmaları okuyup birleştiriyor. Hesaplama
 * fonksiyonları eşiği artık sabitten değil **parametreden** alıyor — böylece
 * hem ayarlanabilir oluyor hem de saf kalmaya devam ediyor.
 */

import { eq, sql } from 'drizzle-orm';
import { cache } from 'react';

import { veritabani } from './db';
import { ESIKLER } from './sabitler';
import { ayarlar } from './sema';

export type Esikler = typeof ESIKLER;

/** Panelden düzenlenebilen alanlar ve gösterim bilgileri. */
export const AYAR_TANIMLARI = [
  { anahtar: 'UYUM_IYI', etiket: 'Çok iyi eşiği (%)', enAz: 50, enCok: 100 },
  { anahtar: 'UYUM_ORTA', etiket: 'İyi eşiği (%)', enAz: 40, enCok: 99 },
  { anahtar: 'UYUM_DUSUK', etiket: 'Dikkat eşiği (%)', enAz: 10, enCok: 98 },
  { anahtar: 'HAREKETSIZ_GUN', etiket: 'Hareketsiz gün uyarısı (gün)', enAz: 1, enCok: 14 },
  { anahtar: 'SURE_DUSUS', etiket: 'Çalışma süresi düşüşü (%)', enAz: 5, enCok: 90 },
  { anahtar: 'NET_DUSUS_DENEME', etiket: 'Net düşüşü kaç denemede', enAz: 2, enCok: 10 },
  { anahtar: 'KONU_DURGUN_GUN', etiket: 'Konu durgunluğu (gün)', enAz: 3, enCok: 90 },
] as const;

const SAYISAL_OLMAYAN = new Set(['SORU_HEDEF_ORANI']);

/**
 * Geçerli eşikler: varsayılanların üzerine veritabanındaki değerler yazılır.
 * `cache()` sayesinde aynı istek içinde bir kez okunur.
 */
export const esikleriGetir = cache(async (): Promise<Esikler> => {
  const db = veritabani();
  const satirlar = await db.select().from(ayarlar);

  const sonuc: Record<string, number> = { ...ESIKLER };
  for (const satir of satirlar) {
    if (!(satir.anahtar in ESIKLER) || SAYISAL_OLMAYAN.has(satir.anahtar)) continue;
    const deger = Number(satir.deger);
    if (Number.isFinite(deger)) sonuc[satir.anahtar] = deger;
  }
  return sonuc as Esikler;
});

/** Tek ayarı yazar; aynı anahtar varsa günceller. */
export async function ayarYaz(anahtar: string, deger: number): Promise<void> {
  const db = veritabani();
  await db
    .insert(ayarlar)
    .values({ anahtar, deger: String(deger) })
    .onConflictDoUpdate({
      target: ayarlar.anahtar,
      set: { deger: String(deger), guncellemeZamani: new Date() },
    });
}

/** Tüm geçersiz kılmaları siler; varsayılanlara döner. */
export async function ayarlariSifirla(): Promise<void> {
  const db = veritabani();
  await db.delete(ayarlar).where(sql`true`);
}

export async function ayarSil(anahtar: string): Promise<void> {
  const db = veritabani();
  await db.delete(ayarlar).where(eq(ayarlar.anahtar, anahtar));
}
