import 'server-only';

/** Deneme ekranı sorguları: başlık + bölüm detayları birlikte. */

import { desc, eq, inArray } from 'drizzle-orm';

import { veritabani } from '../db';
import { denemeDetay, denemeler } from '../sema';

export async function denemeListesi(ogrenciId: string, limit = 50) {
  const db = veritabani();

  const basliklar = await db
    .select()
    .from(denemeler)
    .where(eq(denemeler.ogrenciId, ogrenciId))
    .orderBy(desc(denemeler.tarih))
    .limit(limit);

  if (basliklar.length === 0) return [];

  // Bölümler tek sorguda çekilip gruplanır; deneme başına sorgu atılmaz.
  const detaylar = await db
    .select()
    .from(denemeDetay)
    .where(inArray(denemeDetay.denemeId, basliklar.map((b) => b.id)));

  const gruplu = new Map<string, typeof detaylar>();
  for (const d of detaylar) {
    const liste = gruplu.get(d.denemeId) ?? [];
    liste.push(d);
    gruplu.set(d.denemeId, liste);
  }

  return basliklar.map((baslik) => ({
    ...baslik,
    bolumler: gruplu.get(baslik.id) ?? [],
  }));
}
