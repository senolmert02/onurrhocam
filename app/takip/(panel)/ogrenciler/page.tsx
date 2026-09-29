import { OgrenciListesi } from '@/components/ots/koc/OgrenciListesi';
import { kocGerekli } from '@/lib/ots/dal';
import { tumOgrenciler } from '@/lib/ots/sorgular/koc';

export const metadata = { title: 'Öğrenciler — OnurrHocam ÖTS' };

/**
 * Sunucu yalnızca veriyi verir; sayfa başı, arama, FAB ve diyaloglar
 * `OgrenciListesi` içinde (istemci) yaşar.
 */
export default async function OgrencilerSayfasi() {
  await kocGerekli();
  const liste = await tumOgrenciler();

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <OgrenciListesi ogrenciler={liste} />
    </div>
  );
}
