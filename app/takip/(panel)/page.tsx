import { KocPaneli } from '@/components/ots/koc/Panel';
import { OgrenciAnaSayfa } from '@/components/ots/ogrenci/AnaSayfa';
import { Bos } from '@/components/ots/Parcalar';
import { girisGerekli, kullanicininOgrencisi } from '@/lib/ots/dal';

/** Panelin kökü: rolü kim olursa olsun aynı adres, içerik role göre değişir. */
export default async function PanelSayfasi() {
  const kullanici = await girisGerekli();

  if (kullanici.koc) return <KocPaneli />;

  const ogrenci = await kullanicininOgrencisi(kullanici.id);
  if (!ogrenci) {
    return (
      <Bos
        baslik="Öğrenci kaydın bulunamadı"
        aciklama="Hesabın onaylanmış ama öğrenci kaydı oluşmamış. Koçunla görüşmen gerekiyor."
      />
    );
  }

  return <OgrenciAnaSayfa ogrenci={ogrenci} />;
}
