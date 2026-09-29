/**
 * Konu kataloğu — YKS (TYT + AYT) ve LGS.
 *
 * Apps Script sürümünde bu liste `KonuKatalog` sayfasına yazılıyordu ve her konu
 * ekranında öğrencinin durumlarıyla birleştiriliyordu. Artık kodda duruyor:
 * veritabanında yalnızca öğrencinin dokunduğu konuların durumu tutulur
 * (`ogrenci_konu.konu_id` → buradaki `id`).
 *
 * DİKKAT — kimlikler kalıcıdır:
 * `id` alanı `sinavTuru + ders + konu` metninden türetilir. Var olan bir konunun
 * **metnini değiştirmek kimliğini değiştirir** ve o konuya bağlı öğrenci ilerlemesi
 * kopar. Yeni konu eklemek serbesttir, sıralama değiştirmek de zararsızdır;
 * metin düzeltmesi gerekiyorsa `ogrenci_konu` için taşıma (migration) yazılmalıdır.
 */

export type SinavTuru = 'YKS' | 'LGS';

export type KonuKaydi = {
  /** Kalıcı kimlik: ogrenci_konu.konu_id bu değere bakar. */
  id: string;
  sinavTuru: SinavTuru;
  /** Ders adı aynı zamanda program görevlerinde seçilen ders adıdır. */
  ders: string;
  konu: string;
  /** Katalog içindeki görüntüleme sırası. */
  sira: number;
};

type KatalogGrubu = {
  sinavTuru: SinavTuru;
  ders: string;
  konular: readonly string[];
};

/** Türkçe karakterleri de doğru çeviren kimlik üretici. */
function slug(metin: string): string {
  const harita: Record<string, string> = {
    ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', I: 'i', İ: 'i', i: 'i',
    ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u', â: 'a', Â: 'a',
  };
  return metin
    .split('')
    .map((ch) => harita[ch] ?? ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const GRUPLAR: readonly KatalogGrubu[] = [
  /* ------------------------------------------------------------------ TYT */
  { sinavTuru: 'YKS', ders: 'TYT Türkçe', konular: [
    'Sözcükte Anlam', 'Cümlede Anlam', 'Paragraf', 'Ses Bilgisi', 'Yazım Kuralları',
    'Noktalama İşaretleri', 'Sözcük Türleri', 'Fiiller', 'Fiilimsi', 'Cümlenin Ögeleri',
    'Cümle Türleri', 'Anlatım Bozukluğu'] },

  { sinavTuru: 'YKS', ders: 'TYT Matematik', konular: [
    'Temel Kavramlar', 'Sayı Basamakları', 'Bölme ve Bölünebilme', 'EBOB - EKOK',
    'Rasyonel Sayılar', 'Basit Eşitsizlikler', 'Mutlak Değer', 'Üslü Sayılar',
    'Köklü Sayılar', 'Çarpanlara Ayırma', 'Oran - Orantı', 'Denklem Çözme',
    'Problemler', 'Kümeler', 'Fonksiyonlar', 'Polinomlar', 'İkinci Dereceden Denklemler',
    'Permütasyon - Kombinasyon - Olasılık', 'Veri ve İstatistik'] },

  { sinavTuru: 'YKS', ders: 'TYT Geometri', konular: [
    'Temel Geometri Kavramları', 'Açılar', 'Üçgenler', 'Dik Üçgen', 'İkizkenar ve Eşkenar Üçgen',
    'Üçgende Alan', 'Benzerlik', 'Çokgenler', 'Dörtgenler', 'Çember ve Daire',
    'Katı Cisimler', 'Analitik Geometri'] },

  { sinavTuru: 'YKS', ders: 'TYT Fizik', konular: [
    'Fizik Bilimine Giriş', 'Madde ve Özellikleri', 'Sıvıların Kaldırma Kuvveti', 'Basınç',
    'Isı, Sıcaklık ve Genleşme', 'Hareket ve Kuvvet', 'Dinamik', 'İş, Güç ve Enerji',
    'Elektrostatik', 'Elektrik Akımı', 'Mıknatıs ve Manyetik Alan', 'Dalgalar', 'Optik'] },

  { sinavTuru: 'YKS', ders: 'TYT Kimya', konular: [
    'Kimya Bilimi', 'Atom ve Periyodik Sistem', 'Kimyasal Türler Arası Etkileşimler',
    'Maddenin Halleri', 'Doğa ve Kimya', 'Kimyanın Temel Kanunları', 'Mol Kavramı',
    'Karışımlar', 'Asitler, Bazlar ve Tuzlar', 'Kimya Her Yerde'] },

  { sinavTuru: 'YKS', ders: 'TYT Biyoloji', konular: [
    'Canlıların Ortak Özellikleri', 'Canlıların Temel Bileşenleri', 'Hücre',
    'Hücrede Madde Geçişleri', 'Canlıların Sınıflandırılması', 'Hücre Bölünmeleri',
    'Kalıtım', 'Ekosistem Ekolojisi'] },

  { sinavTuru: 'YKS', ders: 'TYT Tarih', konular: [
    'Tarih Bilimi', 'İlk Uygarlıklar', 'İlk Türk Devletleri', 'İslam Tarihi',
    'Türk - İslam Devletleri', 'Anadolu Selçuklu Devleti', 'Beylikten Devlete Osmanlı',
    'Dünya Gücü Osmanlı', 'Arayış Yılları', 'En Uzun Yüzyıl', 'XX. Yüzyıl Başları',
    'Milli Mücadele', 'Atatürk İlke ve İnkılapları'] },

  { sinavTuru: 'YKS', ders: 'TYT Coğrafya', konular: [
    'Doğa ve İnsan', 'Harita Bilgisi', 'Dünyanın Şekli ve Hareketleri', 'İklim Bilgisi',
    'Yer Şekilleri', 'Nüfus', 'Göç', 'Yerleşme', 'Türkiye\'nin Yer Şekilleri',
    'Ekonomik Faaliyetler', 'Bölgeler', 'Uluslararası Ulaşım', 'Doğal Afetler'] },

  { sinavTuru: 'YKS', ders: 'TYT Felsefe', konular: [
    'Felsefeye Giriş', 'Bilgi Felsefesi', 'Varlık Felsefesi', 'Ahlak Felsefesi',
    'Sanat Felsefesi', 'Din Felsefesi', 'Siyaset Felsefesi', 'Bilim Felsefesi',
    'Psikoloji', 'Sosyoloji', 'Mantık'] },

  { sinavTuru: 'YKS', ders: 'TYT Din Kültürü', konular: [
    'Bilgi ve İnanç', 'İslam ve İbadet', 'Ahlak ve Değerler', 'Din ve Hayat',
    'Hz. Muhammed', 'Vahiy ve Akıl', 'İslam Düşüncesinde Yorumlar', 'Din ve Laiklik'] },

  /* ------------------------------------------------------------------ AYT */
  { sinavTuru: 'YKS', ders: 'AYT Matematik', konular: [
    'Fonksiyonlar (İleri)', 'Polinomlar', 'İkinci Dereceden Denklemler', 'Karmaşık Sayılar',
    'Eşitsizlikler', 'Parabol', 'Trigonometri', 'Logaritma', 'Diziler', 'Limit ve Süreklilik',
    'Türev', 'İntegral', 'Permütasyon - Kombinasyon - Olasılık'] },

  { sinavTuru: 'YKS', ders: 'AYT Geometri', konular: [
    'Analitik Geometri', 'Çember ve Daire (İleri)', 'Katı Cisimler', 'Dönüşüm Geometrisi',
    'Vektörler'] },

  { sinavTuru: 'YKS', ders: 'AYT Fizik', konular: [
    'Vektörler ve Kuvvet', 'Tork ve Denge', 'Kütle Merkezi', 'Basit Makineler',
    'Hareket ve Newton Yasaları', 'İş, Güç ve Enerji', 'Atışlar', 'İtme ve Momentum',
    'Elektrik Alan ve Potansiyel', 'Kondansatör', 'Manyetizma ve İndüksiyon',
    'Alternatif Akım', 'Çembersel Hareket', 'Basit Harmonik Hareket', 'Dalga Mekaniği',
    'Atom Fiziği', 'Modern Fizik', 'Fizik ve Teknoloji'] },

  { sinavTuru: 'YKS', ders: 'AYT Kimya', konular: [
    'Modern Atom Teorisi', 'Gazlar', 'Sıvı Çözeltiler', 'Kimyasal Tepkimelerde Enerji',
    'Kimyasal Tepkimelerde Hız', 'Kimyasal Tepkimelerde Denge', 'Asit - Baz Dengesi',
    'Çözünürlük Dengesi', 'Elektrokimya', 'Organik Kimyaya Giriş', 'Organik Bileşikler',
    'Enerji Kaynakları'] },

  { sinavTuru: 'YKS', ders: 'AYT Biyoloji', konular: [
    'Sinir Sistemi', 'Endokrin Sistem', 'Duyu Organları', 'Destek ve Hareket Sistemi',
    'Sindirim Sistemi', 'Dolaşım Sistemi', 'Solunum Sistemi', 'Boşaltım Sistemi',
    'Üreme ve Gelişme', 'Komünite ve Popülasyon', 'Genden Proteine',
    'Canlılarda Enerji Dönüşümleri', 'Bitki Biyolojisi', 'Canlılar ve Çevre'] },

  { sinavTuru: 'YKS', ders: 'AYT Edebiyat', konular: [
    'Şiir Bilgisi', 'Söz Sanatları', 'İslamiyet Öncesi Türk Edebiyatı', 'Halk Edebiyatı',
    'Divan Edebiyatı', 'Tanzimat Edebiyatı', 'Servet-i Fünun', 'Fecr-i Ati',
    'Milli Edebiyat', 'Cumhuriyet Dönemi Şiir', 'Cumhuriyet Dönemi Roman ve Hikaye',
    'Edebi Akımlar', 'Dünya Edebiyatı'] },

  { sinavTuru: 'YKS', ders: 'AYT Tarih', konular: [
    'İlk Türk Devletleri (İleri)', 'Osmanlı Tarihi (İleri)', 'İnkılap Tarihi (İleri)',
    'Çağdaş Türk ve Dünya Tarihi', 'II. Dünya Savaşı', 'Soğuk Savaş Dönemi',
    'Küreselleşen Dünya'] },

  { sinavTuru: 'YKS', ders: 'AYT Coğrafya', konular: [
    'Ekosistem ve Biyoçeşitlilik', 'Nüfus Politikaları', 'Şehirleşme',
    'Ekonomik Faaliyetler (İleri)', 'Türkiye Ekonomisi', 'Bölgesel Kalkınma',
    'Küresel Ticaret', 'Çevre Sorunları', 'Doğal Kaynaklar'] },

  { sinavTuru: 'YKS', ders: 'AYT Felsefe Grubu', konular: [
    'MÖ 6 - MS 2 Felsefesi', 'MS 2 - 15 Felsefesi', '15 - 17. Yüzyıl Felsefesi',
    '18 - 19. Yüzyıl Felsefesi', '20. Yüzyıl Felsefesi', 'Psikoloji (İleri)',
    'Sosyoloji (İleri)', 'Mantık (İleri)'] },

  /* ------------------------------------------------------------------ LGS */
  { sinavTuru: 'LGS', ders: 'Türkçe', konular: [
    'Sözcükte Anlam', 'Cümlede Anlam', 'Paragraf', 'Söz Sanatları', 'Fiilimsiler',
    'Cümlenin Ögeleri', 'Fiilde Çatı', 'Cümle Türleri', 'Anlatım Bozuklukları',
    'Yazım Kuralları', 'Noktalama İşaretleri', 'Metin Türleri'] },

  { sinavTuru: 'LGS', ders: 'Matematik', konular: [
    'Çarpanlar ve Katlar', 'Üslü İfadeler', 'Kareköklü İfadeler', 'Veri Analizi',
    'Olasılık', 'Cebirsel İfadeler ve Özdeşlikler', 'Doğrusal Denklemler', 'Eşitsizlikler',
    'Üçgenler', 'Eşlik ve Benzerlik', 'Dönüşüm Geometrisi', 'Geometrik Cisimler'] },

  { sinavTuru: 'LGS', ders: 'Fen Bilimleri', konular: [
    'Mevsimler ve İklim', 'DNA ve Genetik Kod', 'Basınç', 'Madde ve Endüstri',
    'Basit Makineler', 'Enerji Dönüşümleri ve Çevre Bilimi',
    'Elektrik Yükleri ve Elektrik Enerjisi'] },

  { sinavTuru: 'LGS', ders: 'T.C. İnkılap Tarihi', konular: [
    'Bir Kahraman Doğuyor', 'Milli Uyanış', 'Milli Bir Destan',
    'Atatürkçülük ve Çağdaşlaşan Türkiye', 'Demokratikleşme Çabaları',
    'Atatürk Dönemi Dış Politika', 'Atatürk\'ün Ölümü'] },

  { sinavTuru: 'LGS', ders: 'Din Kültürü', konular: [
    'Kader ve Kaza', 'Zekat ve Sadaka', 'Din ve Hayat', 'Hz. Muhammed\'in Örnekliği',
    'Kur\'an-ı Kerim ve Özellikleri'] },

  { sinavTuru: 'LGS', ders: 'İngilizce', konular: [
    'Friendship', 'Teen Life', 'In the Kitchen', 'On the Phone', 'The Internet',
    'Adventures', 'Tourism', 'Chores', 'Science', 'Natural Forces'] },
] as const;

/** Düz konu listesi. */
export const KONU_KATALOGU: readonly KonuKaydi[] = (() => {
  const out: KonuKaydi[] = [];
  let sira = 0;
  for (const grup of GRUPLAR) {
    for (const konu of grup.konular) {
      sira += 1;
      out.push({
        id: `${slug(grup.sinavTuru)}-${slug(grup.ders)}-${slug(konu)}`,
        sinavTuru: grup.sinavTuru,
        ders: grup.ders,
        konu,
        sira,
      });
    }
  }

  // Kimlik çakışması sessizce ilerlemesin: iki konu aynı kimliği alırsa
  // biri diğerinin öğrenci ilerlemesini okur.
  const gorulen = new Set<string>();
  for (const k of out) {
    if (gorulen.has(k.id)) {
      throw new Error(`Konu kataloğunda çakışan kimlik: ${k.id} (${k.ders} / ${k.konu})`);
    }
    gorulen.add(k.id);
  }

  return out;
})();

const KIMLIGE_GORE = new Map(KONU_KATALOGU.map((k) => [k.id, k]));

/** Tek konu. Bilinmeyen kimlik için undefined. */
export function konuBul(konuId: string): KonuKaydi | undefined {
  return KIMLIGE_GORE.get(konuId);
}

/** Bir sınav türünün konuları, sıralı. */
export function konulariGetir(sinavTuru: SinavTuru): readonly KonuKaydi[] {
  return KONU_KATALOGU.filter((k) => k.sinavTuru === sinavTuru);
}

/**
 * Sınav türünün ders listesi — katalogdaki sırayla, tekrarsız.
 *
 * Program görevlerinde seçilen ders adı da buradan gelir. Apps Script sürümünde
 * katalog `TYT Matematik`, program listesi düz `Matematik` kullanıyordu; ikisi
 * hiç eşleşmediği için ders bazında program–konu karşılaştırması yapılamıyordu.
 * Tek kaynaktan besleyerek o tutarsızlık kapanıyor.
 */
export function derslerGetir(sinavTuru: SinavTuru): readonly string[] {
  const out: string[] = [];
  for (const k of KONU_KATALOGU) {
    if (k.sinavTuru === sinavTuru && !out.includes(k.ders)) out.push(k.ders);
  }
  return out;
}

/** Sınav türü başına ders → konu adedi. Rapor katmanındaki yüzdeler için. */
export function katalogSayilari(sinavTuru: SinavTuru): {
  toplam: number;
  dersler: Record<string, number>;
} {
  const dersler: Record<string, number> = {};
  let toplam = 0;
  for (const k of KONU_KATALOGU) {
    if (k.sinavTuru !== sinavTuru) continue;
    dersler[k.ders] = (dersler[k.ders] ?? 0) + 1;
    toplam += 1;
  }
  return { toplam, dersler };
}
