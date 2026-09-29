/**
 * Oturum: imzalı çerez (JWT).
 *
 * Apps Script sürümünde oturum jetonu `Oturumlar` sayfasında satır olarak
 * tutuluyor, tarayıcıda `localStorage`'da saklanıyordu. İki sorunu vardı:
 * her istekte tablo okuması gerekiyordu (bu yüzden bir önbellek katmanı
 * eklenmişti), ve `localStorage`'daki jeton sayfadaki herhangi bir betik
 * tarafından okunabiliyordu.
 *
 * Burada jeton imzalı bir çerezde taşınıyor:
 * - `httpOnly` — tarayıcıdaki JavaScript okuyamaz
 * - `secure` — yalnızca https üzerinden gider
 * - `sameSite: lax` — başka siteden gelen isteklerle gönderilmez
 * - imzalı — içeriği değiştirilirse doğrulama başarısız olur
 *
 * Jetonun içinde yalnızca kullanıcı kimliği ve rol var; kişisel bilgi yok.
 * Roldeki değer bir **ipucudur**, yetki kararı için kullanılmaz: yetkili rol
 * her istekte veritabanından okunur (bkz. dal.ts).
 */

import 'server-only';

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

import { GUVENLIK, type Rol } from './sabitler';

export type OturumYuku = {
  kullaniciId: string;
  rol: Rol;
};

function imzaAnahtari(): Uint8Array {
  const gizli = process.env.SESSION_SECRET;
  if (!gizli) {
    throw new Error(
      'SESSION_SECRET tanımlı değil. `openssl rand -base64 32` ile üretip ' +
        '.env.local dosyasına ekleyin.',
    );
  }
  return new TextEncoder().encode(gizli);
}

function bitisTarihi(): Date {
  return new Date(Date.now() + GUVENLIK.OTURUM_SAAT * 60 * 60 * 1000);
}

/** Yükü imzalar. */
export async function jetonUret(yuk: OturumYuku): Promise<string> {
  return new SignJWT({ ...yuk })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${GUVENLIK.OTURUM_SAAT}h`)
    .sign(imzaAnahtari());
}

/** Jetonu çözer. Geçersiz, süresi geçmiş ya da imzası tutmayan jeton için null. */
export async function jetonCoz(jeton: string | undefined): Promise<OturumYuku | null> {
  if (!jeton) return null;
  try {
    const { payload } = await jwtVerify(jeton, imzaAnahtari(), { algorithms: ['HS256'] });
    const kullaniciId = typeof payload.kullaniciId === 'string' ? payload.kullaniciId : '';
    const rol = payload.rol === 'koc' || payload.rol === 'ogrenci' ? payload.rol : null;
    if (!kullaniciId || !rol) return null;
    return { kullaniciId, rol };
  } catch {
    return null;
  }
}

/** Giriş başarılı olduğunda çağrılır. */
export async function oturumBaslat(yuk: OturumYuku): Promise<void> {
  const jeton = await jetonUret(yuk);
  const cerezler = await cookies();
  cerezler.set(GUVENLIK.CEREZ_ADI, jeton, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: bitisTarihi(),
    path: '/',
  });
}

/** Çerezdeki oturum yükü. Doğrulama yapar ama veritabanına bakmaz. */
export async function oturumYuku(): Promise<OturumYuku | null> {
  const cerezler = await cookies();
  return jetonCoz(cerezler.get(GUVENLIK.CEREZ_ADI)?.value);
}

export async function oturumKapat(): Promise<void> {
  const cerezler = await cookies();
  cerezler.delete(GUVENLIK.CEREZ_ADI);
}
