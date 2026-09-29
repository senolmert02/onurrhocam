import { OnaySatiri } from '@/components/ots/koc/OnaySatiri';
import { Bos, SayfaBasi } from '@/components/ots/Parcalar';
import { kocGerekli } from '@/lib/ots/dal';
import { KAYIT } from '@/lib/ots/sabitler';
import { onayBekleyenler } from '@/lib/ots/sorgular/koc';

export const metadata = { title: 'Onay bekleyenler — OnurrHocam ÖTS' };

/** Kaydın silinmesine kalan gün — sunucuda, istek anına göre hesaplanır. */
function kalanGun(kayitZamani: Date): number {
  return (
    KAYIT.ONAY_BEKLEME_GUN - Math.floor((Date.now() - kayitZamani.getTime()) / 86_400_000)
  );
}

export default async function OnaylarSayfasi() {
  await kocGerekli();

  // Listeyi getirirken süresi geçmiş kayıtlar da temizlenir (tembel temizlik).
  const { liste, temizlenen } = await onayBekleyenler();

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <div className="ots-belir" style={{ '--i': 0 } as React.CSSProperties}>
        <SayfaBasi
          baslik="Onay bekleyenler"
          aciklama={`Onaylanan öğrenciler giriş yapabilir. Onaylanmayan kayıtlar ${KAYIT.ONAY_BEKLEME_GUN} gün sonra kalıcı olarak silinir.`}
        />
      </div>

      {temizlenen > 0 && (
        <p
          role="status"
          className="ots-belir rounded-2xl border border-ots-gold-deep/40 bg-ots-gold-tint px-4 py-3 text-[14px] text-ots-ink"
          style={{ '--i': 1 } as React.CSSProperties}
        >
          Süresi geçmiş <span className="ots-sayi font-semibold">{temizlenen}</span> kayıt
          temizlendi.
        </p>
      )}

      {/* Satırlar zaten birer kart; ikinci bir kart sarmalayıcı gerekmez */}
      <div className="ots-belir" style={{ '--i': 2 } as React.CSSProperties}>
        {liste.length === 0 ? (
          <Bos
            baslik="Bekleyen kayıt yok"
            aciklama="Yeni bir öğrenci kaydolduğunda burada görünecek."
          />
        ) : (
          <ul className="flex flex-col gap-3 sm:gap-4">
            {liste.map((aday) => (
              <OnaySatiri
                key={aday.id}
                aday={aday}
                kalanGun={kalanGun(aday.olusturmaZamani)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
