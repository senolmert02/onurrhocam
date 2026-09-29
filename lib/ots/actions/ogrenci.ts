'use server';

/**
 * Koçun öğrenci yönetimi: ekleme, güncelleme, pasife alma, giriş hesabı açma,
 * şifre sıfırlama.
 *
 * Koçun eklediği hesaplar doğrudan `aktif` açılır — onay akışı kendi kaydolan
 * öğrenciler içindir, koç zaten onay makamı.
 */

import { randomInt } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { actionKoc } from '../dal';
import { veritabani } from '../db';
import {
  formVerisi,
  ogrenciGuncelleSemasi,
  ogrenciSemasi,
  zodHatasi,
  type FormDurumu,
} from '../dogrulama';
import { UYGULAMA } from '../sabitler';
import { kullanicilar, ogrenciler } from '../sema';
import { sifreOzeti } from '../sifre';
import { bugun } from '../tarih';

/** Koça gösterilecek geçici şifre: okunabilir ama tahmin edilebilir değil. */
function geciciSifre(): string {
  const harfler = 'abcdefghijkmnpqrstuvwxyz'; // l ve o yok, 1 ve 0 ile karışmasın
  let govde = '';
  for (let i = 0; i < 5; i++) govde += harfler[randomInt(harfler.length)];
  return `Ots${govde}${randomInt(1000, 9999)}`;
}

function tazele(ogrenciId?: string) {
  revalidatePath(`${UYGULAMA.kok}/ogrenciler`);
  revalidatePath(UYGULAMA.kok);
  if (ogrenciId) revalidatePath(`${UYGULAMA.kok}/ogrenciler/${ogrenciId}`);
}

/* ------------------------------------------------------------- Öğrenci ekleme */

export async function ogrenciEkle(
  _oncekiDurum: FormDurumu,
  form: FormData,
): Promise<FormDurumu> {
  const yetki = await actionKoc();
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };

  const cozum = ogrenciSemasi.safeParse(formVerisi(form));
  if (!cozum.success) return zodHatasi(cozum.error);

  const veri = cozum.data;
  const db = veritabani();

  let kullaniciId: string | null = null;
  let sifre = '';

  if (veri.eposta) {
    const [mevcut] = await db
      .select({ id: kullanicilar.id })
      .from(kullanicilar)
      .where(eq(kullanicilar.email, veri.eposta))
      .limit(1);

    if (mevcut) {
      return {
        ok: false,
        mesaj: 'Bu e-posta ile bir hesap zaten var.',
        alanHatalari: { eposta: ['Bu e-posta ile bir hesap zaten var.'] },
      };
    }

    const parcalar = veri.adSoyad.split(/\s+/);
    // Koç şifre yazdıysa o kullanılır; boş bıraktıysa sistem üretir.
    sifre = veri.sifre || geciciSifre();

    const [yeni] = await db
      .insert(kullanicilar)
      .values({
        ad: parcalar[0],
        soyad: parcalar.slice(1).join(' ') || '-',
        email: veri.eposta,
        telefon: veri.telefon,
        sifreHash: await sifreOzeti(sifre),
        rol: 'ogrenci',
        durum: 'aktif',
      })
      .returning({ id: kullanicilar.id });

    kullaniciId = yeni.id;
  }

  const [ogrenci] = await db
    .insert(ogrenciler)
    .values({
      kullaniciId,
      adSoyad: veri.adSoyad,
      email: veri.eposta,
      telefon: veri.telefon,
      sinif: veri.sinif,
      sinavTuru: veri.sinavTuru,
      alan: veri.alan || 'Belirtilmedi',
      hedef: veri.hedef,
      hedefUniversite: veri.hedefUniversite,
      hedefBolum: veri.hedefBolum,
      veliAdi: veri.veliAdi,
      veliTelefon: veri.veliTelefon,
      adres: veri.adres,
      mezun: veri.mezun,
      gecenYilSiralama: veri.mezun ? veri.gecenYilSiralama : null,
      baslangicTarihi: veri.baslangicTarihi || bugun(),
      gunlukSoruHedefi: veri.gunlukSoruHedefi,
      gunlukSureHedefi: veri.gunlukSureHedefi,
    })
    .returning({ id: ogrenciler.id });

  tazele(ogrenci.id);

  return {
    ok: true,
    mesaj: sifre
      ? veri.sifre
        ? `${veri.adSoyad} eklendi. Giriş: ${veri.eposta}`
        : `${veri.adSoyad} eklendi. Giriş: ${veri.eposta} · üretilen şifre: ${sifre}`
      : `${veri.adSoyad} eklendi. Giriş hesabı açılmadı.`,
  };
}

/* --------------------------------------------------------- Öğrenci güncelleme */

export async function ogrenciGuncelle(
  _oncekiDurum: FormDurumu,
  form: FormData,
): Promise<FormDurumu> {
  const yetki = await actionKoc();
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };

  const cozum = ogrenciGuncelleSemasi.safeParse(formVerisi(form));
  if (!cozum.success) return zodHatasi(cozum.error);

  const veri = cozum.data;
  const db = veritabani();

  const [mevcut] = await db
    .select({
      id: ogrenciler.id,
      kullaniciId: ogrenciler.kullaniciId,
      email: ogrenciler.email,
    })
    .from(ogrenciler)
    .where(eq(ogrenciler.id, veri.ogrenciId))
    .limit(1);

  if (!mevcut) return { ok: false, mesaj: 'Öğrenci bulunamadı.' };

  /* --------------------------------------------------------- Giriş hesabı
     Koç bu formdan hem e-postayı hem şifreyi yönetebiliyor:
     - hesap yoksa ve e-posta verildiyse → hesap açılır
     - hesap varsa ve şifre yazıldıysa → şifre değiştirilir
     - hesap varsa ve e-posta değiştiyse → giriş e-postası da güncellenir

     Bu sayede öğrenci şifresini unuttuğunda koç yenisini verebiliyor;
     ayrı bir "şifremi unuttum" akışına gerek kalmıyor. */

  let hesapMesaji = '';

  if (!mevcut.kullaniciId && veri.eposta) {
    const [cakisan] = await db
      .select({ id: kullanicilar.id })
      .from(kullanicilar)
      .where(eq(kullanicilar.email, veri.eposta))
      .limit(1);

    if (cakisan) {
      return {
        ok: false,
        mesaj: 'Bu e-posta ile başka bir hesap var.',
        alanHatalari: { eposta: ['Bu e-posta ile başka bir hesap var.'] },
      };
    }

    const parcalar = veri.adSoyad.split(/\s+/);
    const yeni = veri.sifre || geciciSifre();

    const [olusan] = await db
      .insert(kullanicilar)
      .values({
        ad: parcalar[0],
        soyad: parcalar.slice(1).join(' ') || '-',
        email: veri.eposta,
        telefon: veri.telefon,
        sifreHash: await sifreOzeti(yeni),
        rol: 'ogrenci',
        durum: veri.durum,
      })
      .returning({ id: kullanicilar.id });

    mevcut.kullaniciId = olusan.id;
    hesapMesaji = veri.sifre
      ? ` Giriş hesabı açıldı: ${veri.eposta}`
      : ` Giriş hesabı açıldı: ${veri.eposta} · üretilen şifre: ${yeni}`;
  } else if (mevcut.kullaniciId) {
    const hesapYama: Record<string, unknown> = { durum: veri.durum };

    if (veri.sifre) {
      hesapYama.sifreHash = await sifreOzeti(veri.sifre);
      hesapYama.basarisizDeneme = 0;
      hesapYama.kilitBitis = null;
      hesapMesaji = ' Şifre değiştirildi.';
    }

    if (veri.eposta && veri.eposta !== mevcut.email) {
      const [cakisan] = await db
        .select({ id: kullanicilar.id })
        .from(kullanicilar)
        .where(eq(kullanicilar.email, veri.eposta))
        .limit(1);

      if (cakisan && cakisan.id !== mevcut.kullaniciId) {
        return {
          ok: false,
          mesaj: 'Bu e-posta ile başka bir hesap var.',
          alanHatalari: { eposta: ['Bu e-posta ile başka bir hesap var.'] },
        };
      }
      hesapYama.email = veri.eposta;
      hesapMesaji += ' Giriş e-postası güncellendi.';
    }

    await db
      .update(kullanicilar)
      .set(hesapYama)
      .where(eq(kullanicilar.id, mevcut.kullaniciId));
  }

  await db
    .update(ogrenciler)
    .set({
      adSoyad: veri.adSoyad,
      email: veri.eposta || mevcut.email,
      kullaniciId: mevcut.kullaniciId,
      telefon: veri.telefon,
      sinif: veri.sinif,
      sinavTuru: veri.sinavTuru,
      alan: veri.alan || 'Belirtilmedi',
      hedef: veri.hedef,
      hedefUniversite: veri.hedefUniversite,
      hedefBolum: veri.hedefBolum,
      veliAdi: veri.veliAdi,
      veliTelefon: veri.veliTelefon,
      adres: veri.adres,
      mezun: veri.mezun,
      gecenYilSiralama: veri.mezun ? veri.gecenYilSiralama : null,
      baslangicTarihi: veri.baslangicTarihi || bugun(),
      gunlukSoruHedefi: veri.gunlukSoruHedefi,
      gunlukSureHedefi: veri.gunlukSureHedefi,
      durum: veri.durum,
    })
    .where(eq(ogrenciler.id, veri.ogrenciId));

  tazele(veri.ogrenciId);
  return { ok: true, mesaj: `Öğrenci güncellendi.${hesapMesaji}` };
}

/* --------------------------------------------------------- Giriş hesabı açma */

export async function hesapAc(ogrenciId: string, epostaMetni: string): Promise<FormDurumu> {
  const yetki = await actionKoc();
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };

  const eposta = epostaMetni.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(eposta)) {
    return { ok: false, mesaj: 'Geçerli bir e-posta girin.' };
  }

  const db = veritabani();

  const [ogrenci] = await db
    .select({
      id: ogrenciler.id,
      adSoyad: ogrenciler.adSoyad,
      telefon: ogrenciler.telefon,
      kullaniciId: ogrenciler.kullaniciId,
    })
    .from(ogrenciler)
    .where(eq(ogrenciler.id, ogrenciId))
    .limit(1);

  if (!ogrenci) return { ok: false, mesaj: 'Öğrenci bulunamadı.' };
  if (ogrenci.kullaniciId) return { ok: false, mesaj: 'Bu öğrencinin zaten hesabı var.' };

  const [cakisan] = await db
    .select({ id: kullanicilar.id })
    .from(kullanicilar)
    .where(eq(kullanicilar.email, eposta))
    .limit(1);

  if (cakisan) return { ok: false, mesaj: 'Bu e-posta zaten kayıtlı.' };

  const parcalar = ogrenci.adSoyad.split(/\s+/);
  const sifre = geciciSifre();

  const [yeni] = await db
    .insert(kullanicilar)
    .values({
      ad: parcalar[0] || 'Öğrenci',
      soyad: parcalar.slice(1).join(' ') || '-',
      email: eposta,
      telefon: ogrenci.telefon,
      sifreHash: await sifreOzeti(sifre),
      rol: 'ogrenci',
      durum: 'aktif',
    })
    .returning({ id: kullanicilar.id });

  await db
    .update(ogrenciler)
    .set({ kullaniciId: yeni.id, email: eposta })
    .where(eq(ogrenciler.id, ogrenci.id));

  tazele(ogrenciId);
  return { ok: true, mesaj: `Hesap açıldı — e-posta: ${eposta}, geçici şifre: ${sifre}` };
}

/* ------------------------------------------------------------ Şifre sıfırlama */

export async function sifreSifirla(ogrenciId: string): Promise<FormDurumu> {
  const yetki = await actionKoc();
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };

  const db = veritabani();
  const [ogrenci] = await db
    .select({ kullaniciId: ogrenciler.kullaniciId, adSoyad: ogrenciler.adSoyad })
    .from(ogrenciler)
    .where(eq(ogrenciler.id, ogrenciId))
    .limit(1);

  if (!ogrenci) return { ok: false, mesaj: 'Öğrenci bulunamadı.' };
  if (!ogrenci.kullaniciId) return { ok: false, mesaj: 'Bu öğrencinin giriş hesabı yok.' };

  const sifre = geciciSifre();
  await db
    .update(kullanicilar)
    .set({
      sifreHash: await sifreOzeti(sifre),
      basarisizDeneme: 0,
      kilitBitis: null,
    })
    .where(eq(kullanicilar.id, ogrenci.kullaniciId));

  tazele(ogrenciId);
  return { ok: true, mesaj: `${ogrenci.adSoyad} için yeni şifre: ${sifre}` };
}

/* ----------------------------------------------------------------- Kilit açma */

export async function kilidiAc(ogrenciId: string): Promise<FormDurumu> {
  const yetki = await actionKoc();
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };

  const db = veritabani();
  const [ogrenci] = await db
    .select({ kullaniciId: ogrenciler.kullaniciId })
    .from(ogrenciler)
    .where(eq(ogrenciler.id, ogrenciId))
    .limit(1);

  if (!ogrenci?.kullaniciId) return { ok: false, mesaj: 'Giriş hesabı bulunamadı.' };

  await db
    .update(kullanicilar)
    .set({ basarisizDeneme: 0, kilitBitis: null })
    .where(eq(kullanicilar.id, ogrenci.kullaniciId));

  tazele(ogrenciId);
  return { ok: true, mesaj: 'Hesabın kilidi açıldı.' };
}

/* ------------------------------------------------------------- Kalıcı silme */

/**
 * Öğrenciyi ve ona ait **tüm** veriyi kalıcı olarak siler.
 *
 * Görevler, çalışma kayıtları, konu durumları, denemeler, deneme detayları,
 * yanlış analizleri ve koç notları `on delete cascade` ile kendiliğinden gider.
 * Giriş hesabı varsa o da silinir.
 *
 * Geri alınamaz. Arayüz bu yüzden ad soyadın harfi harfine yazılmasını istiyor;
 * yanlış satıra basıp bir öğrencinin bir yıllık verisini silmek çok kolay olurdu.
 */
export async function ogrenciSil(ogrenciId: string, onayMetni: string): Promise<FormDurumu> {
  const yetki = await actionKoc();
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };

  const db = veritabani();
  const [ogrenci] = await db
    .select({
      id: ogrenciler.id,
      adSoyad: ogrenciler.adSoyad,
      kullaniciId: ogrenciler.kullaniciId,
    })
    .from(ogrenciler)
    .where(eq(ogrenciler.id, ogrenciId))
    .limit(1);

  if (!ogrenci) return { ok: false, mesaj: 'Öğrenci bulunamadı.' };

  if (onayMetni.trim() !== ogrenci.adSoyad.trim()) {
    return {
      ok: false,
      mesaj: `Silmek için öğrencinin adını tam olarak yazmalısın: ${ogrenci.adSoyad}`,
    };
  }

  // Kullanıcı satırı silinince ogrenciler satırı da cascade ile gider;
  // hesabı olmayan öğrenci için doğrudan öğrenci satırı silinir.
  if (ogrenci.kullaniciId) {
    await db.delete(kullanicilar).where(eq(kullanicilar.id, ogrenci.kullaniciId));
  } else {
    await db.delete(ogrenciler).where(eq(ogrenciler.id, ogrenci.id));
  }

  tazele();
  return { ok: true, mesaj: `${ogrenci.adSoyad} ve tüm verileri kalıcı olarak silindi.` };
}
