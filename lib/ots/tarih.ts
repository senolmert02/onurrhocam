/**
 * Tarih ve süre işlemleri. Apps Script sürümündeki `Utils.gs` tarih bölümünün karşılığı.
 *
 * İki tür değer dolaşır ve karıştırılmamalıdır:
 *
 * - **Gün anahtarı** (`GunAnahtari`): `yyyy-MM-dd` biçiminde düz metin. Takvim günü
 *   demektir, saat dilimi taşımaz. Program tarihi, çalışma tarihi, hafta başı gibi
 *   alanlar budur. Postgres tarafında `date` sütunu.
 * - **Zaman damgası** (`Date`): gerçek an. Oluşturma zamanı, son giriş gibi alanlar.
 *   Postgres tarafında `timestamptz`.
 *
 * Neden önemli: sunucu UTC'de çalışıyor. `new Date().getDate()` gece yarısıyla 03:00
 * arasında bir gün geriyi gösterir, çünkü İstanbul UTC+3. Bu yüzden "bugün" her zaman
 * `bugun()` üzerinden, İstanbul saat dilimine göre hesaplanır.
 *
 * Apps Script sürümünde istemci kendi "bugün"ünü sunucuyla hizalamak zorundaydı
 * (`App.syncServerDate`). Burada sayfalar sunucuda çizildiği için o ayara gerek yok;
 * gün her zaman sunucudan geliyor.
 */

export const SAAT_DILIMI = 'Europe/Istanbul';

/** `yyyy-MM-dd` biçiminde takvim günü. */
export type GunAnahtari = string;

const GUN_ADLARI = [
  'Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi',
] as const;

const ANAHTAR_BICIMI = /^\d{4}-\d{2}-\d{2}$/;

function iki(sayi: number): string {
  return String(sayi).padStart(2, '0');
}

/* --------------------------------------------------------- Bugün ve şu an */

const gunParcalayici = new Intl.DateTimeFormat('en-US', {
  timeZone: SAAT_DILIMI,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Bir anı İstanbul saatine göre gün anahtarına çevirir. */
export function gunAnahtari(an: Date = new Date()): GunAnahtari {
  const parcalar = gunParcalayici.formatToParts(an);
  const al = (tur: string) => parcalar.find((p) => p.type === tur)?.value ?? '';
  return `${al('year')}-${al('month')}-${al('day')}`;
}

/** Bugünün gün anahtarı, İstanbul saatine göre. */
export function bugun(): GunAnahtari {
  return gunAnahtari();
}

export function gunAnahtariMi(deger: unknown): deger is GunAnahtari {
  return typeof deger === 'string' && ANAHTAR_BICIMI.test(deger);
}

/**
 * Gelen değeri gün anahtarına çevirir; çeviremezse boş metin döner.
 * Kabul ettikleri: gün anahtarı, `Date`, ve elle girilmiş `28.09.2026` / `28/09/2026`.
 */
export function gunaCevir(deger: unknown): GunAnahtari | '' {
  if (!deger) return '';
  if (deger instanceof Date) {
    return Number.isNaN(deger.getTime()) ? '' : gunAnahtari(deger);
  }

  const metin = String(deger).trim();
  if (!metin) return '';
  if (ANAHTAR_BICIMI.test(metin)) return metin;

  const tr = metin.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (tr) return `${tr[3]}-${iki(Number(tr[2]))}-${iki(Number(tr[1]))}`;

  const cozulen = new Date(metin);
  return Number.isNaN(cozulen.getTime()) ? '' : gunAnahtari(cozulen);
}

/* ------------------------------------------------------------ Takvim işlemleri
   Gün anahtarları saat dilimi taşımadığı için aritmetik UTC üzerinde yapılır;
   böylece yaz saati ya da sunucu saati sonucu kaydırmaz. */

function parcala(anahtar: GunAnahtari): { yil: number; ay: number; gun: number } {
  const [yil, ay, gun] = anahtar.split('-').map(Number);
  return { yil, ay, gun };
}

function utcMs(anahtar: GunAnahtari): number {
  const { yil, ay, gun } = parcala(anahtar);
  return Date.UTC(yil, ay - 1, gun);
}

function anahtaraCevir(ms: number): GunAnahtari {
  const t = new Date(ms);
  return `${t.getUTCFullYear()}-${iki(t.getUTCMonth() + 1)}-${iki(t.getUTCDate())}`;
}

export function gunEkle(anahtar: GunAnahtari, gun: number): GunAnahtari {
  return anahtaraCevir(utcMs(anahtar) + gun * 86_400_000);
}

/** `bitis - baslangic`, gün olarak. Negatif olabilir. */
export function gunFarki(baslangic: GunAnahtari, bitis: GunAnahtari): number {
  return Math.round((utcMs(bitis) - utcMs(baslangic)) / 86_400_000);
}

/**
 * Haftanın ilk günü: pazartesi.
 *
 * Adres çubuğundan gelen `?hafta=` değeri buraya doğrudan düşüyor; `abc` gibi
 * bozuk bir değer `NaN-NaN-NaN` üretip Postgres sorgusunu çökertiyordu. Biçime
 * uymayan anahtar bu haftaya çevrilir — bozuk bağlantı hata değil, bugünü açar.
 */
export function haftaBasi(anahtar: GunAnahtari = bugun()): GunAnahtari {
  if (!ANAHTAR_BICIMI.test(anahtar)) anahtar = bugun();
  const haftaninGunu = new Date(utcMs(anahtar)).getUTCDay(); // 0 = pazar
  const pazartesidenBeri = (haftaninGunu + 6) % 7;
  return gunEkle(anahtar, -pazartesidenBeri);
}

export function haftaSonu(anahtar: GunAnahtari = bugun()): GunAnahtari {
  return gunEkle(haftaBasi(anahtar), 6);
}

/** Bir haftanın yedi günü, pazartesiden pazara. */
export function haftaGunleri(anahtar: GunAnahtari = bugun()): GunAnahtari[] {
  const bas = haftaBasi(anahtar);
  return Array.from({ length: 7 }, (_, i) => gunEkle(bas, i));
}

export function gunAdi(anahtar: GunAnahtari): string {
  return GUN_ADLARI[new Date(utcMs(anahtar)).getUTCDay()];
}

/** Aralık kontrolü. Gün anahtarları metin olarak da doğru sıralanır. */
export function aralikta(
  anahtar: GunAnahtari,
  baslangic: GunAnahtari,
  bitis: GunAnahtari,
): boolean {
  return anahtar >= baslangic && anahtar <= bitis;
}

/* ------------------------------------------------------------------ Biçimleme */

/** `28.09.2026` */
export function trTarih(anahtar: GunAnahtari | '' | null | undefined): string {
  if (!anahtar || !ANAHTAR_BICIMI.test(anahtar)) return '';
  const { yil, ay, gun } = parcala(anahtar);
  return `${iki(gun)}.${iki(ay)}.${yil}`;
}

/** `28.09` — grafik eksenleri için kısa biçim. */
export function trTarihKisa(anahtar: GunAnahtari | '' | null | undefined): string {
  return trTarih(anahtar).slice(0, 5);
}

const anBicimleyici = new Intl.DateTimeFormat('tr-TR', {
  timeZone: SAAT_DILIMI,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** `28.09.2026 09:45` — İstanbul saatinde. */
export function trTarihSaat(an: Date | null | undefined): string {
  if (!an || Number.isNaN(an.getTime())) return '';
  return anBicimleyici.format(an).replace(',', '');
}

/** `HH:MM` biçimine indirger; çeviremezse boş metin. */
export function saatAnahtari(deger: unknown): string {
  if (deger === null || deger === undefined || deger === '') return '';

  if (deger instanceof Date) {
    if (Number.isNaN(deger.getTime())) return '';
    return `${iki(deger.getUTCHours())}:${iki(deger.getUTCMinutes())}`;
  }

  const eslesme = String(deger).trim().match(/^(\d{1,2})[:.](\d{2})/);
  if (!eslesme) return '';
  const saat = Number(eslesme[1]);
  const dakika = Number(eslesme[2]);
  if (saat > 23 || dakika > 59) return '';
  return `${iki(saat)}:${eslesme[2]}`;
}

/** `195` → `3 sa 15 dk` */
export function sureBicimle(dakika: number | null | undefined): string {
  const toplam = Math.max(0, Math.round(Number(dakika) || 0));
  const saat = Math.floor(toplam / 60);
  const kalan = toplam % 60;
  if (!saat) return `${kalan} dk`;
  if (!kalan) return `${saat} sa`;
  return `${saat} sa ${kalan} dk`;
}
