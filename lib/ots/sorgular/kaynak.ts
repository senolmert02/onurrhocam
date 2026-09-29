import 'server-only';

import { asc, eq } from 'drizzle-orm';

import { veritabani } from '../db';
import { kaynaklar, type Kaynak } from '../sema';

/** Öğrencinin kaynakları — ders, sonra ekleme sırasına göre. */
export async function kaynaklariGetir(ogrenciId: string): Promise<Kaynak[]> {
  return veritabani()
    .select()
    .from(kaynaklar)
    .where(eq(kaynaklar.ogrenciId, ogrenciId))
    .orderBy(asc(kaynaklar.ders), asc(kaynaklar.olusturmaZamani));
}

export type DersKaynaklari = { ders: string; kaynaklar: Kaynak[] };

/** Ders başlıkları altında gruplar; ders sırası ilk görüldüğü sıradır. */
export function derseGoreGrupla(liste: Kaynak[]): DersKaynaklari[] {
  const gruplar = new Map<string, Kaynak[]>();
  for (const k of liste) {
    const dizi = gruplar.get(k.ders) ?? [];
    dizi.push(k);
    gruplar.set(k.ders, dizi);
  }
  return [...gruplar.entries()].map(([ders, kaynaklar]) => ({ ders, kaynaklar }));
}
