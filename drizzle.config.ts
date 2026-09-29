/**
 * drizzle-kit yapılandırması — şema değişikliklerini veritabanına uygular.
 *
 * Komutlar (package.json):
 *   npm run db:generate   şema değişikliğinden taşıma (migration) dosyası üret
 *   npm run db:migrate    üretilmiş taşımaları veritabanına uygula
 *   npm run db:studio     tarayıcıda tablo gezgini
 *   npm run db:push       şemayı doğrudan uygula (yalnızca geliştirme)
 */

import { defineConfig } from 'drizzle-kit';

import { envYukle } from './lib/ots/env-yukle';

envYukle('.env.local', '.env');

export default defineConfig({
  schema: './lib/ots/sema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  // Sütun adları şemada açıkça yazıldığı için otomatik ad dönüştürme kapalı.
  verbose: true,
  strict: true,
});
