/**
 * `.env.local` okuyucu — Next dışında çalışan araçlar için.
 *
 * Next.js `.env.local` dosyasını kendisi yükler, ama drizzle-kit ve
 * `scripts/` altındaki betikler bu düzeni bilmez. Küçük bir okuyucu yeterli;
 * yalnızca `AD=deger` satırlarını destekler, çok satırlı değer beklemez.
 *
 * Bilerek `server-only` içermez: bu dosya Next dışından da içe aktarılır.
 */

import { readFileSync } from 'node:fs';

export function envYukle(...dosyalar: string[]): void {
  for (const dosya of dosyalar) {
    let icerik: string;
    try {
      icerik = readFileSync(dosya, 'utf8');
    } catch {
      continue; // dosya yoksa sorun değil
    }

    for (const satir of icerik.split('\n')) {
      const temiz = satir.trim();
      if (!temiz || temiz.startsWith('#')) continue;

      const esit = temiz.indexOf('=');
      if (esit === -1) continue;

      const ad = temiz.slice(0, esit).trim();
      let deger = temiz.slice(esit + 1).trim();
      if (
        (deger.startsWith('"') && deger.endsWith('"')) ||
        (deger.startsWith("'") && deger.endsWith("'"))
      ) {
        deger = deger.slice(1, -1);
      }

      // Gerçek ortam değişkeni her zaman dosyayı ezer.
      if (process.env[ad] === undefined) process.env[ad] = deger;
    }
  }
}
