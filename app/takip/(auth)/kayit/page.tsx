import { KayitFormu } from '@/components/ots/KayitFormu';

export const metadata = { title: 'Kayıt — OnurrHocam ÖTS' };

export default function KayitSayfasi() {
  return (
    <>
      <h1 className="font-display text-[22px] font-bold leading-tight tracking-[-0.02em] text-ots-ink">
        Kayıt ol
      </h1>
      <p className="mb-5 mt-1 text-[14px] leading-snug text-ots-soft">
        Kaydını oluştur, koçun onayladıktan sonra giriş yapabilirsin.
      </p>
      <KayitFormu />
    </>
  );
}
