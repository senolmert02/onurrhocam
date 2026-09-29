'use server';

/**
 * Deneme kaydı: ekleme, güncelleme, silme ve koçun deneme sonrası planı.
 *
 * Erişim kuralı `actionOgrenciErisimi` ile: koç her öğrenciye, öğrenci yalnızca
 * kendine. Öğrencinin gönderdiği `ogrenciId` yok sayılır, kimlik oturumdan gelir.
 *
 * `yapilmasiGerekenler` (koçun planı) yalnızca koç çağrısında yazılır;
 * `degerlendirme` (öğrencinin kendi yorumu) ikisinde de yazılabilir.
 */

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { actionKoc, actionOgrenciErisimi } from '../dal';
import { veritabani } from '../db';
import { denemeSemasi, formVerisi, zodHatasi, type FormDurumu } from '../dogrulama';
import { netHesapla, toplamNet } from '../net';
import { DENEME_TURLERI, UYGULAMA, YANLIS_NEDENLERI, type DenemeTuru } from '../sabitler';
import { denemeDetay, denemeler, yanlisAnaliz } from '../sema';

function tazele(ogrenciId: string) {
  revalidatePath(`${UYGULAMA.kok}/denemeler`);
  revalidatePath(`${UYGULAMA.kok}/ogrenciler/${ogrenciId}`);
  revalidatePath(UYGULAMA.kok);
}

/**
 * Bölüm sonuçlarını formdan okur.
 *
 * Alan adları `d_0`, `y_0`, `b_0` biçiminde, indeks deneme türünün bölüm
 * sırasına denk gelir. Hiç sonuç girilmemiş bölümler atlanır.
 */
function bolumleriOku(form: FormData, tur: DenemeTuru) {
  const bolumler = DENEME_TURLERI[tur].bolumler;
  const bolen = DENEME_TURLERI[tur].yanlisBolen;

  const sonuc: { bolum: string; dogru: number; yanlis: number; bos: number; net: number }[] =
    [];

  bolumler.forEach((bolum, i) => {
    const sayi = (onek: string) => {
      const ham = form.get(`${onek}_${i}`);
      const deger = Math.floor(Number(ham ?? 0));
      // Negatif ve sayı olmayan girdiler sıfıra çekilir; veritabanı kısıtı da
      // aynı kuralı uyguluyor, bu ikinci katman.
      return Number.isFinite(deger) && deger > 0 ? deger : 0;
    };

    const dogru = sayi('d');
    const yanlis = sayi('y');
    const bos = sayi('b');
    if (dogru === 0 && yanlis === 0 && bos === 0) return;

    sonuc.push({ bolum, dogru, yanlis, bos, net: netHesapla(dogru, yanlis, bolen) });
  });

  return sonuc;
}

/** Yanlış nedenleri isteğe bağlı olarak denemeyle birlikte gelebilir. */
function nedenleriOku(form: FormData) {
  const kayitlar: { neden: string; adet: number }[] = [];
  YANLIS_NEDENLERI.forEach((neden, i) => {
    const adet = Math.floor(Number(form.get(`n_${i}`) ?? 0));
    if (Number.isFinite(adet) && adet > 0) kayitlar.push({ neden, adet });
  });
  return kayitlar;
}

/* -------------------------------------------------------------- Deneme ekleme */

export async function denemeEkle(
  _oncekiDurum: FormDurumu,
  form: FormData,
): Promise<FormDurumu> {
  const istenenOgrenci = String(form.get('ogrenciId') ?? '');
  const yetki = await actionOgrenciErisimi(istenenOgrenci || undefined);
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };

  const cozum = denemeSemasi.safeParse(formVerisi(form));
  if (!cozum.success) return zodHatasi(cozum.error);

  const veri = cozum.data;
  const { ogrenci, kullanici } = yetki.veri;
  const bolumler = bolumleriOku(form, veri.tur);

  if (bolumler.length === 0) {
    return { ok: false, mesaj: 'En az bir bölüm için sonuç girin.' };
  }

  const db = veritabani();
  const [deneme] = await db
    .insert(denemeler)
    .values({
      ogrenciId: ogrenci.id,
      tarih: veri.tarih,
      denemeAdi: veri.denemeAdi || `${veri.tur} Denemesi`,
      tur: veri.tur,
      sure: veri.sure,
      toplamNet: toplamNet(bolumler, veri.tur),
      degerlendirme: veri.degerlendirme,
      // Koçun planını yalnızca koç yazabilir.
      yapilmasiGerekenler: kullanici.koc ? veri.yapilmasiGerekenler : '',
    })
    .returning({ id: denemeler.id, toplamNet: denemeler.toplamNet });

  await db
    .insert(denemeDetay)
    .values(bolumler.map((b) => ({ denemeId: deneme.id, ...b })));

  const nedenler = nedenleriOku(form);
  if (nedenler.length > 0) {
    await db.insert(yanlisAnaliz).values(
      nedenler.map((n) => ({
        ogrenciId: ogrenci.id,
        denemeId: deneme.id,
        tarih: veri.tarih,
        neden: n.neden,
        adet: n.adet,
      })),
    );
  }

  tazele(ogrenci.id);
  return { ok: true, mesaj: `Deneme kaydedildi. Toplam net: ${deneme.toplamNet}` };
}

/* ---------------------------------------------------------- Deneme güncelleme */

export async function denemeGuncelle(
  _oncekiDurum: FormDurumu,
  form: FormData,
): Promise<FormDurumu> {
  const istenenOgrenci = String(form.get('ogrenciId') ?? '');
  const yetki = await actionOgrenciErisimi(istenenOgrenci || undefined);
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };

  const cozum = denemeSemasi.safeParse(formVerisi(form));
  if (!cozum.success) return zodHatasi(cozum.error);

  const veri = cozum.data;
  if (!veri.denemeId) return { ok: false, mesaj: 'Deneme seçilmedi.' };

  const { ogrenci, kullanici } = yetki.veri;
  const db = veritabani();

  // Sahiplik: deneme bu öğrenciye ait olmalı.
  const [mevcut] = await db
    .select({ id: denemeler.id })
    .from(denemeler)
    .where(and(eq(denemeler.id, veri.denemeId), eq(denemeler.ogrenciId, ogrenci.id)))
    .limit(1);

  if (!mevcut) return { ok: false, mesaj: 'Deneme bulunamadı.' };

  const bolumler = bolumleriOku(form, veri.tur);
  if (bolumler.length === 0) {
    return { ok: false, mesaj: 'En az bir bölüm için sonuç girin.' };
  }

  // Bölümler baştan yazılır; eski satırların silinmesi ve yenilerin yazılması
  // tek atomik işlemde olmalı, aksi hâlde deneme bölümsüz kalabilir.
  await db.batch([
    db
      .update(denemeler)
      .set({
        tarih: veri.tarih,
        denemeAdi: veri.denemeAdi || `${veri.tur} Denemesi`,
        tur: veri.tur,
        sure: veri.sure,
        toplamNet: toplamNet(bolumler, veri.tur),
        degerlendirme: veri.degerlendirme,
        ...(kullanici.koc ? { yapilmasiGerekenler: veri.yapilmasiGerekenler } : {}),
      })
      .where(eq(denemeler.id, mevcut.id)),
    db.delete(denemeDetay).where(eq(denemeDetay.denemeId, mevcut.id)),
    db.insert(denemeDetay).values(bolumler.map((b) => ({ denemeId: mevcut.id, ...b }))),
  ]);

  tazele(ogrenci.id);
  return { ok: true, mesaj: 'Deneme güncellendi.' };
}

/* -------------------------------------------------------------- Deneme silme */

/** Silme yalnızca koçta; öğrenci yanlış girdiği kaydı düzenler. */
export async function denemeSil(denemeId: string): Promise<FormDurumu> {
  const yetki = await actionKoc();
  if (!yetki.yetkili) {
    return { ok: false, mesaj: 'Deneme kaydı silinemez, düzenleyebilirsin.' };
  }

  const db = veritabani();
  const silinen = await db
    .delete(denemeler)
    .where(eq(denemeler.id, denemeId))
    .returning({ ogrenciId: denemeler.ogrenciId });

  if (silinen.length === 0) return { ok: false, mesaj: 'Deneme bulunamadı.' };

  // Bölümler ve yanlış analizi `on delete cascade` ile kendiliğinden gitti.
  tazele(silinen[0].ogrenciId);
  return { ok: true, mesaj: 'Deneme silindi.' };
}

/* ------------------------------------------------------------- Koçun planı */

export async function denemePlaniKaydet(
  denemeId: string,
  plan: string,
): Promise<FormDurumu> {
  const yetki = await actionKoc();
  if (!yetki.yetkili) return { ok: false, mesaj: yetki.mesaj };

  const db = veritabani();
  const guncellenen = await db
    .update(denemeler)
    .set({ yapilmasiGerekenler: plan.trim() })
    .where(eq(denemeler.id, denemeId))
    .returning({ ogrenciId: denemeler.ogrenciId });

  if (guncellenen.length === 0) return { ok: false, mesaj: 'Deneme bulunamadı.' };

  tazele(guncellenen[0].ogrenciId);
  return { ok: true, mesaj: 'Plan kaydedildi.' };
}
