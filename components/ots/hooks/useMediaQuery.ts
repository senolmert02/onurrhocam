'use client';

import { useCallback, useSyncExternalStore } from 'react';

/** Sunucuda ve hydration sırasında değer henüz bilinmiyor. */
function sunucuOku(): boolean | undefined {
  return undefined;
}

/**
 * CSS medya sorgusunu React durumuna bağlar — spec §4.10.
 *
 * `useSyncExternalStore` ile: sunucu anlık görüntüsü `undefined` döner, böylece
 * sunucu ile istemci hydration'da aynı çıktıyı üretir; hydration biter bitmez
 * gerçek `matchMedia` sonucu gelir. Çağıran `undefined` iken dal seçmemelidir
 * (`Modal` bu durumda `null` döner).
 *
 * Yalnızca CSS ile çözülemeyen dallanmalar için (modal ↔ sheet, toast konumu);
 * düzen kırılımları `md:`/`lg:` sınıflarıyla kalır.
 */
export function useMediaQuery(sorgu: string): boolean | undefined {
  const abone = useCallback(
    (bildir: () => void) => {
      const liste = window.matchMedia(sorgu);
      liste.addEventListener('change', bildir);
      return () => liste.removeEventListener('change', bildir);
    },
    [sorgu],
  );

  const oku = useCallback(() => window.matchMedia(sorgu).matches, [sorgu]);

  return useSyncExternalStore<boolean | undefined>(abone, oku, sunucuOku);
}
