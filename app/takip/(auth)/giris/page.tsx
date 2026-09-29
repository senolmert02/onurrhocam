import { GirisFormu } from '@/components/ots/GirisFormu';

export const metadata = { title: 'Giriş — OnurrHocam ÖTS' };

export default function GirisSayfasi() {
  return (
    <>
      <h1 className="font-display text-[22px] font-bold leading-tight tracking-[-0.02em] text-ots-ink">
        Giriş yap
      </h1>
      <p className="mb-5 mt-1 text-[14px] leading-snug text-ots-soft">
        Programını, konularını ve denemelerini görmek için giriş yap.
      </p>
      <GirisFormu />
    </>
  );
}
