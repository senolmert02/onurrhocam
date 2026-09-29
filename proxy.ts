/**
 * Proxy — Next.js 16'da eski adıyla Middleware.
 *
 * Buradaki kontrol **iyimserdir**: yalnızca oturum çerezinin var olup olmadığına
 * bakar, imzasını doğrulamaz, veritabanına gitmez. Amacı yetkilendirme değil,
 * gereksiz sayfa çizimini önlemek — çerezi olmayan birini giriş ekranına erken
 * yönlendirmek.
 *
 * Gerçek yetki kontrolü `lib/ots/dal.ts` içinde, her sayfa ve her Server Action
 * içinde yapılır. Next'in kendi dokümanı da bunu söylüyor: proxy tam bir oturum
 * yönetimi ya da yetkilendirme çözümü olarak kullanılmamalı. Bu ayrım önemli,
 * çünkü proxy katmanının atlatılabildiği güvenlik açıkları geçmişte görüldü
 * (bu projede kullandığımız Next sürümü o yamayı içeriyor).
 */

import { NextResponse, type NextRequest } from 'next/server';

const KOK = '/takip';
const CEREZ_ADI = 'ots_oturum';

/** Oturum gerektirmeyen sayfalar. */
const ACIK_SAYFALAR = [`${KOK}/giris`, `${KOK}/kayit`];

function acikSayfaMi(yol: string): boolean {
  return ACIK_SAYFALAR.some((s) => yol === s || yol.startsWith(`${s}/`));
}

export function proxy(istek: NextRequest) {
  const yol = istek.nextUrl.pathname;
  const cerezVar = Boolean(istek.cookies.get(CEREZ_ADI)?.value);

  if (!cerezVar && !acikSayfaMi(yol)) {
    const adres = new URL(`${KOK}/giris`, istek.url);
    // Giriş sonrası kullanıcıyı gitmek istediği sayfaya döndürebilmek için.
    if (yol !== KOK) adres.searchParams.set('devam', yol);
    return NextResponse.redirect(adres);
  }

  if (cerezVar && acikSayfaMi(yol)) {
    return NextResponse.redirect(new URL(KOK, istek.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/takip', '/takip/:path*'],
};
