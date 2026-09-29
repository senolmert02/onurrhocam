import type { Ogrenci } from '@/lib/ots/sema';
import { sureBicimle, trTarih } from '@/lib/ots/tarih';

import { Rozet } from '../Parcalar';

/**
 * Öğrencinin bilgileri — salt okunur, "Görüntüle" penceresinin içeriği.
 *
 * Kullanıcı isteği: Görüntüle yalnızca bilgileri göstersin, programa/rapora
 * götürmesin. Boş alanlar "—" ile gösterilir ki hangi bilginin eksik olduğu
 * görülsün. Telefon ve e-posta dokununca arama / e-posta açar (mobilde işe yarar).
 */
export function OgrenciBilgileri({ ogrenci }: { ogrenci: Ogrenci }) {
  const aktif = ogrenci.durum === 'aktif';
  const hesapVar = Boolean(ogrenci.kullaniciId);

  const gruplar: { baslik: string; satirlar: [string, React.ReactNode][] }[] = [
    {
      baslik: 'İletişim',
      satirlar: [
        ['E-posta', ogrenci.email ? <Baglanti href={`mailto:${ogrenci.email}`}>{ogrenci.email}</Baglanti> : null],
        ['Telefon', ogrenci.telefon ? <Baglanti href={`tel:${ogrenci.telefon.replace(/\s/g, '')}`}>{ogrenci.telefon}</Baglanti> : null],
        ['Adres', ogrenci.adres || null],
      ],
    },
    {
      baslik: 'Sınav',
      satirlar: [
        ['Sınav', ogrenci.sinavTuru],
        ['Sınıf', ogrenci.sinif || null],
        ['Alan', ogrenci.alan && ogrenci.alan !== 'Belirtilmedi' ? ogrenci.alan : null],
        ['Durum', ogrenci.mezun ? 'Mezun' : 'Öğrenci'],
        ...(ogrenci.mezun
          ? ([['Geçen yıl sıralaması', ogrenci.gecenYilSiralama?.toLocaleString('tr-TR') ?? null]] as [string, React.ReactNode][])
          : []),
      ],
    },
    {
      baslik: 'Hedef',
      satirlar: [
        ['Üniversite', ogrenci.hedefUniversite || null],
        ['Bölüm', ogrenci.hedefBolum || null],
        ['Açıklama', ogrenci.hedef || null],
      ],
    },
    {
      baslik: 'Veli',
      satirlar: [
        ['Veli adı', ogrenci.veliAdi || null],
        ['Veli telefonu', ogrenci.veliTelefon ? <Baglanti href={`tel:${ogrenci.veliTelefon.replace(/\s/g, '')}`}>{ogrenci.veliTelefon}</Baglanti> : null],
      ],
    },
    {
      baslik: 'Takip',
      satirlar: [
        ['Başlangıç', trTarih(ogrenci.baslangicTarihi)],
        ['Günlük soru hedefi', ogrenci.gunlukSoruHedefi > 0 ? `${ogrenci.gunlukSoruHedefi} soru` : null],
        ['Günlük süre hedefi', ogrenci.gunlukSureHedefi > 0 ? sureBicimle(ogrenci.gunlukSureHedefi) : null],
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-1.5">
        <Rozet ton={aktif ? 'yesil' : 'notr'}>{aktif ? 'Aktif' : 'Pasif'}</Rozet>
        <Rozet ton={hesapVar ? 'yesil' : 'notr'}>{hesapVar ? 'Giriş hesabı var' : 'Giriş hesabı yok'}</Rozet>
        {ogrenci.mezun && <Rozet ton="sari">Mezun</Rozet>}
      </div>

      {gruplar.map(({ baslik, satirlar }) => (
        <section key={baslik}>
          <h3 className="mb-1.5 text-[12px] font-semibold text-ots-faint">{baslik}</h3>
          <dl className="divide-y divide-ots-line rounded-xl border border-ots-line bg-ots-raised/40">
            {satirlar.map(([etiket, deger]) => (
              <div key={etiket} className="flex items-baseline justify-between gap-4 px-3.5 py-2.5">
                <dt className="shrink-0 text-[13px] text-ots-soft">{etiket}</dt>
                <dd className={`min-w-0 break-words text-right text-[14px] ${deger ? 'text-ots-ink' : 'text-ots-faint'}`}>
                  {deger ?? '—'}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

function Baglanti({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="text-ots-gold-ink underline-offset-2 hover:underline">
      {children}
    </a>
  );
}
