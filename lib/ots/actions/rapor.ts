'use server';

/**
 * Haftalık rapora koçun yazdığı iki serbest metin: o haftanın değerlendirmesi
 * ve gelecek haftanın hedefleri. Öğrenci bunları görür ama yazamaz.
 *
 * Ayrıca uyarı eşiklerinin panelden ayarlanması.
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { AYAR_TANIMLARI, ayarYaz, ayarlariSifirla } from '../ayarlar';
import { actionKoc } from '../dal';
import { veritabani } from '../db';
import { formVerisi, zodHatasi, type FormDurumu } from '../dogrulama';
import { UYGULAMA } from '../sabitler';
import { haftalikDegerlendirme } from '../sema';
import { haftaBasi } from '../tarih';

const degerlendirmeSemasi = z.object({
  ogrenciId: z.uuid('Öğrenci seçilmedi.'),
  hafta: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Hafta geçersiz.'),
  kocDegerlendirmesi: z.string().trim().default(''),
  gelecekHedefler: z.string().trim().default(''),
});

export async function degerlendirmeKaydet(
  _oncekiDurum: FormDurumu,
  form: FormData,
): Promise<FormDurumu> {
  const yetki = await actionKoc();
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };

  const cozum = degerlendirmeSemasi.safeParse(formVerisi(form));
  if (!cozum.success) return zodHatasi(cozum.error);

  const veri = cozum.data;
  const hafta = haftaBasi(veri.hafta);
  const alanlar = {
    kocDegerlendirmesi: veri.kocDegerlendirmesi,
    gelecekHedefler: veri.gelecekHedefler,
    yazan: yetki.veri.eposta,
    guncellemeZamani: new Date(),
  };

  await veritabani()
    .insert(haftalikDegerlendirme)
    .values({ ogrenciId: veri.ogrenciId, haftaBaslangic: hafta, ...alanlar })
    .onConflictDoUpdate({
      target: [haftalikDegerlendirme.ogrenciId, haftalikDegerlendirme.haftaBaslangic],
      set: alanlar,
    });

  revalidatePath(`${UYGULAMA.kok}/rapor`);
  revalidatePath(`${UYGULAMA.kok}/ogrenciler/${veri.ogrenciId}`);
  return { ok: true, mesaj: 'Değerlendirme kaydedildi.' };
}

/* ------------------------------------------------------------------- Ayarlar */

export async function ayarlariKaydet(
  _oncekiDurum: FormDurumu,
  form: FormData,
): Promise<FormDurumu> {
  const yetki = await actionKoc();
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };

  const hatalar: Record<string, string[]> = {};
  const yazilacak: { anahtar: string; deger: number }[] = [];

  for (const tanim of AYAR_TANIMLARI) {
    const ham = form.get(tanim.anahtar);
    if (ham === null || String(ham).trim() === '') continue;

    const deger = Number(ham);
    if (!Number.isFinite(deger) || !Number.isInteger(deger)) {
      hatalar[tanim.anahtar] = ['Tam sayı girin.'];
      continue;
    }
    if (deger < tanim.enAz || deger > tanim.enCok) {
      hatalar[tanim.anahtar] = [`${tanim.enAz} ile ${tanim.enCok} arasında olmalı.`];
      continue;
    }
    yazilacak.push({ anahtar: tanim.anahtar, deger });
  }

  if (Object.keys(hatalar).length > 0) {
    return { ok: false, mesaj: 'Bazı alanlar geçersiz.', alanHatalari: hatalar };
  }

  // Bantlar birbirini geçmemeli, yoksa durum etiketleri anlamsızlaşır.
  const bul = (a: string) => yazilacak.find((y) => y.anahtar === a)?.deger;
  const iyi = bul('UYUM_IYI');
  const orta = bul('UYUM_ORTA');
  const dusuk = bul('UYUM_DUSUK');
  if (iyi !== undefined && orta !== undefined && iyi <= orta) {
    return { ok: false, mesaj: 'Çok iyi eşiği, iyi eşiğinden büyük olmalı.' };
  }
  if (orta !== undefined && dusuk !== undefined && orta <= dusuk) {
    return { ok: false, mesaj: 'İyi eşiği, dikkat eşiğinden büyük olmalı.' };
  }

  for (const { anahtar, deger } of yazilacak) await ayarYaz(anahtar, deger);

  revalidatePath(`${UYGULAMA.kok}/ayarlar`);
  revalidatePath(UYGULAMA.kok);
  revalidatePath(`${UYGULAMA.kok}/dikkat`);
  return { ok: true, mesaj: 'Ayarlar kaydedildi.' };
}

export async function ayarlariVarsayilanaDondur(): Promise<FormDurumu> {
  const yetki = await actionKoc();
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };

  await ayarlariSifirla();
  revalidatePath(`${UYGULAMA.kok}/ayarlar`);
  revalidatePath(UYGULAMA.kok);
  return { ok: true, mesaj: 'Varsayılan eşiklere dönüldü.' };
}

/* ------------------------------------------------------- Programın NOT kutusu */

/**
 * Basılı haftalık programın NOT kutusu.
 * Hafta başına tek kayıt; değerlendirmeyle aynı satırda tutuluyor.
 */
export async function programNotuKaydet(
  ogrenciId: string,
  haftaAnahtari: string,
  metin: string,
): Promise<FormDurumu> {
  const yetki = await actionKoc();
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };

  if (!/^[0-9a-f-]{36}$/i.test(ogrenciId)) {
    return { ok: false, mesaj: 'Öğrenci seçilmedi.' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(haftaAnahtari)) {
    return { ok: false, mesaj: 'Hafta geçersiz.' };
  }

  const hafta = haftaBasi(haftaAnahtari);
  const alanlar = {
    programNotu: metin.slice(0, 2000),
    yazan: yetki.veri.eposta,
    guncellemeZamani: new Date(),
  };

  await veritabani()
    .insert(haftalikDegerlendirme)
    .values({ ogrenciId, haftaBaslangic: hafta, ...alanlar })
    .onConflictDoUpdate({
      target: [haftalikDegerlendirme.ogrenciId, haftalikDegerlendirme.haftaBaslangic],
      set: alanlar,
    });

  revalidatePath(`${UYGULAMA.kok}/programlar`);
  return { ok: true, mesaj: 'Not kaydedildi.' };
}
