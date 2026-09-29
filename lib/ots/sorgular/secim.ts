import 'server-only';

/**
 * Rol farkını tek yerde çözen yardımcı.
 *
 * Aynı ekranlar (konu takibi, denemeler, rapor) iki rolde de kullanılıyor:
 * öğrenci kendi kaydını görür, koç bir seçiciden öğrenci seçer. Sayfaların
 * bu ayrımı tek tek yazmaması için burada toplandı.
 *
 * Öğrenci için `istenenId` **yok sayılır** — kimlik oturumdan gelir. Adres
 * çubuğuna başka bir öğrencinin kimliğini yazmak bir şey değiştirmez.
 */

import { girisGerekli, kullanicininOgrencisi, ogrenciKaydi, type GuvenliKullanici } from '../dal';
import type { Ogrenci } from '../sema';
import { aktifOgrenciler } from './koc';

export type EkranSecimi = {
  kullanici: GuvenliKullanici;
  ogrenci: Ogrenci | null;
  /** Koç için seçici listesi; öğrenci için boş. */
  liste: { id: string; adSoyad: string; sinif: string }[];
};

export async function ekranOgrencisi(istenenId?: string): Promise<EkranSecimi> {
  const kullanici = await girisGerekli();

  if (!kullanici.koc) {
    return {
      kullanici,
      ogrenci: await kullanicininOgrencisi(kullanici.id),
      liste: [],
    };
  }

  const tumu = await aktifOgrenciler();
  const liste = tumu.map((o) => ({ id: o.id, adSoyad: o.adSoyad, sinif: o.sinif }));

  // Seçim yoksa ve tek öğrenci varsa onu aç — her seferinde seçtirmenin anlamı yok.
  const secili = istenenId
    ? await ogrenciKaydi(istenenId)
    : tumu.length === 1
      ? tumu[0]
      : null;

  return { kullanici, ogrenci: secili, liste };
}
