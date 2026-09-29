/**
 * Veritabanı bağlantısı (Neon Postgres, HTTP sürücüsü).
 *
 * Neon'un HTTP sürücüsü sunucusuz ortamlar için tasarlandı: bağlantı havuzu
 * tutmaz, her sorgu tek bir HTTP isteğidir. Vercel'de her istek ayrı bir örnekte
 * çalışabildiği için klasik TCP havuzundan daha uygun.
 *
 * `server-only` içe aktarımı, bu dosyanın yanlışlıkla bir istemci bileşenine
 * sızmasını derleme hatasına çevirir — bağlantı adresi tarayıcıya gitmez.
 */

import 'server-only';

import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';

import * as sema from './sema';

let onbellek: NeonHttpDatabase<typeof sema> | null = null;

/**
 * Bağlantıyı ilk kullanımda kurar ve saklar.
 *
 * Bilerek tembel: `DATABASE_URL` tanımlı olmasa bile bu dosyayı içe aktarmak
 * derlemeyi patlatmaz, hata ilk sorguda ve açık bir mesajla çıkar.
 */
export function veritabani(): NeonHttpDatabase<typeof sema> {
  if (onbellek) return onbellek;

  const adres = process.env.DATABASE_URL;
  if (!adres) {
    throw new Error(
      'DATABASE_URL tanımlı değil. Neon bağlantı adresini .env.local dosyasına ekleyin ' +
        '(Vercel için proje ayarlarındaki Environment Variables bölümüne).',
    );
  }

  onbellek = drizzle(neon(adres), { schema: sema });
  return onbellek;
}
