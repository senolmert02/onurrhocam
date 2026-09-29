/**
 * Panel iskeleti — spec §5.6: 4 sayaç + 2 kart, `bg-ots-raised animate-pulse rounded-2xl`.
 *
 * Sunucu bileşeni; Next bunu `page.tsx` etrafındaki Suspense sınırının
 * yedeği olarak gösterir. Sayaç ızgarası gerçek sayfayla aynı kırılımı taşır
 * (2×2 → md'de 4 sütun) ki içerik gelince yerleşim zıplamasın.
 */
export default function Yukleniyor() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-6 sm:space-y-8">
      <span className="sr-only">Yükleniyor…</span>

      {/* Sayfa başı */}
      <div aria-hidden className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded-md bg-ots-raised motion-reduce:animate-none sm:h-8" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded-md bg-ots-raised motion-reduce:animate-none" />
      </div>

      {/* 4 sayaç */}
      <div aria-hidden className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[92px] animate-pulse rounded-2xl bg-ots-raised motion-reduce:animate-none sm:h-[104px]"
          />
        ))}
      </div>

      {/* 2 kart */}
      <div aria-hidden className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <div className="h-56 animate-pulse rounded-2xl bg-ots-raised motion-reduce:animate-none" />
        <div className="h-56 animate-pulse rounded-2xl bg-ots-raised motion-reduce:animate-none" />
      </div>
    </div>
  );
}
