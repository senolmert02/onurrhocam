/**
 * Şifre özeti ve doğrulama.
 *
 * Apps Script sürümü şifreleri tuz + tekrarlı SHA-256 ile saklıyordu ve tur
 * sayısı hız uğruna 4000'den 1000'e düşürülmüştü. SHA-256 hızlı olmak üzere
 * tasarlanmış bir özet fonksiyonudur; şifre için tam da istemediğimiz özellik.
 * Burada bcrypt kullanılıyor: yavaş olmak üzere tasarlanmış, tuzu kendi üretip
 * özetin içine gömüyor, maliyeti donanım hızlandıkça artırılabiliyor.
 */

import 'server-only';

import { compare, hash } from 'bcryptjs';

import { GUVENLIK } from './sabitler';

export async function sifreOzeti(sifre: string): Promise<string> {
  return hash(sifre, GUVENLIK.BCRYPT_MALIYET);
}

export async function sifreDogru(sifre: string, ozet: string): Promise<boolean> {
  try {
    return await compare(sifre, ozet);
  } catch {
    // Bozuk ya da boş özet: doğrulama başarısız sayılır, istisna dışarı sızmaz.
    return false;
  }
}

/**
 * Var olmayan kullanıcı için yapılan sahte doğrulama.
 *
 * Kullanıcı bulunamadığında hemen dönersek, giriş denemesi var olan bir hesap
 * için belirgin biçimde daha uzun sürer ve saldırgan hangi e-postaların kayıtlı
 * olduğunu süreden anlayabilir. Bu yüzden o durumda da bir bcrypt karşılaştırması
 * çalıştırılır; sonucu kullanılmaz, yalnızca süre benzer kalsın diye.
 */
const SAHTE_OZET = '$2b$12$C6UzMDM.H6dfI/f/IKcEe.e7jUKkpBhSgXzJk1Y5cN0VYo9kQZ3nK';

export async function sahteDogrulama(sifre: string): Promise<void> {
  await sifreDogru(sifre, SAHTE_OZET);
}
