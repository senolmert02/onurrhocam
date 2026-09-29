/**
 * İlk koç hesabını açar.  Çalıştırmak için:  npm run ots:koc
 *
 * `.env.local` içindeki ILK_KOC_EMAIL ve ILK_KOC_SIFRE değerlerini kullanır.
 * Tekrar çalıştırmak zararsızdır: hesap varsa koç rolüne alınır ve aktifleştirilir,
 * şifresi de env'deki değere göre yenilenir.
 *
 * Apps Script sürümündeki `createCoach` bunun yerini tutuyordu ama şifresi kodun
 * içinde sabitti ve fonksiyon istemciden çağrılabiliyordu — herkes kendini koç
 * yapabiliyordu. Bu betik yalnızca terminalden çalışır, web'den erişilemez.
 *
 * `server-only` taşıyan modülleri (db.ts, sifre.ts) bilerek kullanmıyor:
 * o modüller Next dışında içe aktarıldığında hata fırlatır.
 */

import { neon } from '@neondatabase/serverless';
import { hash } from 'bcryptjs';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';

import { envYukle } from '../lib/ots/env-yukle';
import { GUVENLIK } from '../lib/ots/sabitler';
import { kullanicilar } from '../lib/ots/sema';

envYukle('.env.local', '.env');

function zorunlu(ad: string): string {
  const deger = process.env[ad];
  if (!deger) {
    console.error(`\n✗ ${ad} tanımlı değil. .env.local dosyasına ekleyin.\n`);
    process.exit(1);
  }
  return deger;
}

const eposta = zorunlu('ILK_KOC_EMAIL').trim().toLowerCase();
const sifre = zorunlu('ILK_KOC_SIFRE');
const db = drizzle(neon(zorunlu('DATABASE_URL')), { schema: { kullanicilar } });

const sifreHash = await hash(sifre, GUVENLIK.BCRYPT_MALIYET);

const [mevcut] = await db
  .select({ id: kullanicilar.id, rol: kullanicilar.rol, durum: kullanicilar.durum })
  .from(kullanicilar)
  .where(eq(kullanicilar.email, eposta))
  .limit(1);

if (mevcut) {
  await db
    .update(kullanicilar)
    .set({ rol: 'koc', durum: 'aktif', sifreHash, basarisizDeneme: 0, kilitBitis: null })
    .where(eq(kullanicilar.id, mevcut.id));
  console.log(`\n✓ ${eposta} güncellendi: rol koç, durum aktif, şifre yenilendi.`);
} else {
  await db.insert(kullanicilar).values({
    ad: 'Onur',
    soyad: 'Akbağ',
    email: eposta,
    sifreHash,
    rol: 'koc',
    durum: 'aktif',
  });
  console.log(`\n✓ ${eposta} koç olarak oluşturuldu.`);
}

console.log('  Şifre .env.local içindeki ILK_KOC_SIFRE değeridir.');
console.log('  Giriş: /takip/giris\n');
