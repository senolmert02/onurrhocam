/**
 * ÖTS yapılandırması, roller ve alan sözlükleri.
 * Apps Script sürümündeki `Config.gs` karşılığı.
 *
 * Buradaki hiçbir değer veritabanından okunmaz; ayar değişikliği kod değişikliğidir.
 */

export const UYGULAMA = {
  ad: 'OnurrHocam Öğrenci Takip Sistemi',
  kisaAd: 'OnurrHocam ÖTS',
  slogan: 'Disiplin + İstikrar = Başarı',
  /** Panelin adres kökü. Değiştirmek için app/takip klasörünü de yeniden adlandır. */
  kok: '/takip',
} as const;

/* -------------------------------------------------------------------- Roller */

export const ROLLER = {
  KOC: 'koc',
  OGRENCI: 'ogrenci',
} as const;

export type Rol = (typeof ROLLER)[keyof typeof ROLLER];

export const ROL_ETIKETLERI: Record<Rol, string> = {
  koc: 'Koç',
  ogrenci: 'Öğrenci',
};

export function kocMu(rol: string | null | undefined): boolean {
  return rol === ROLLER.KOC;
}

/* ------------------------------------------------------------ Hesap durumları */

export const HESAP_DURUMLARI = ['beklemede', 'aktif', 'pasif'] as const;
export type HesapDurumu = (typeof HESAP_DURUMLARI)[number];

/* ------------------------------------------------------- Oturum ve güvenlik */

export const GUVENLIK = {
  /** Oturum çerezinin ömrü (saat). */
  OTURUM_SAAT: 8,
  /** Çerez adı. */
  CEREZ_ADI: 'ots_oturum',

  SIFRE_MIN_UZUNLUK: 8,
  /** bcrypt maliyeti. 12 ≈ 250ms, kaba kuvvete karşı yeterli, girişte hissedilmez. */
  BCRYPT_MALIYET: 12,

  /** Kaç hatalı denemeden sonra kilit. */
  MAKS_HATALI_DENEME: 5,
  /** Kilit süresi (dakika). */
  KILIT_DAKIKA: 15,
} as const;

/* --------------------------------------------------------------------- Kayıt */

export const KAYIT = {
  /** Kayıt herkese açık; giriş için koç onayı gerekir. */
  ACIK: true,
  /**
   * Onaylanmayan kayıtların kalıcı silineceği gün sayısı.
   * Temizlik, koç onay ekranını her açtığında çalışır (zamanlanmış görev yok).
   */
  ONAY_BEKLEME_GUN: 7,
} as const;

/* ------------------------------------------------------------ Uyarı eşikleri */

export const ESIKLER = {
  /** Program uyumu bantları (yüzde). */
  UYUM_DUSUK: 60,
  UYUM_ORTA: 75,
  UYUM_IYI: 90,

  /** Kaç gündür görev tamamlamıyor. Bugün sayılmaz — günü kapanmamış gün sayılmaz. */
  HAREKETSIZ_GUN: 2,

  /** Soru hedefinin altına düşme oranı (hedefin bu katından azı uyarı üretir). */
  SORU_HEDEF_ORANI: 0.6,

  /** Haftalık çalışma süresi düşüş yüzdesi. */
  SURE_DUSUS: 18,

  /** Net düşüşü kaç denemede aranır. Karşılaştırma aynı deneme türü içinde yapılır. */
  NET_DUSUS_DENEME: 3,

  /** Kaç gündür yeni konu tamamlanmadı. */
  KONU_DURGUN_GUN: 14,
} as const;

/* ----------------------------------------------------------- Alan sözlükleri */

export const SINAV_TURLERI = ['YKS', 'LGS'] as const;

export const ALANLAR = [
  'Sayısal', 'Eşit Ağırlık', 'Sözel', 'Dil', 'Belirtilmedi',
] as const;

export const GOREV_TURLERI = [
  'Konu çalışma', 'Konu tekrarı', 'Soru çözümü', 'Deneme', 'Deneme analizi',
  'Yanlış analizi', 'Video ders', 'Ödev', 'Kitap okuma', 'Diğer',
] as const;

export const GOREV_DURUMLARI = ['bekliyor', 'tamamlandi', 'yapilmadi'] as const;
export type GorevDurumu = (typeof GOREV_DURUMLARI)[number];

export const GOREV_DURUM_ETIKETLERI: Record<GorevDurumu, string> = {
  bekliyor: 'Bekliyor',
  tamamlandi: 'Tamamlandı',
  yapilmadi: 'Yapılmadı',
};

export const ONCELIKLER = ['Yüksek', 'Normal', 'Düşük'] as const;

export const KONU_DURUMLARI = [
  'Başlanmadı', 'Çalışılıyor', 'Tamamlandı', 'Tekrar gerekli', 'Eksik',
  'Deneme ile kontrol edildi',
] as const;
export type KonuDurumu = (typeof KONU_DURUMLARI)[number];

/** İlerleme yüzdelerinde "bitmiş" sayılan konu durumları. */
export function konuTamamMi(durum: string | null | undefined): boolean {
  return durum === 'Tamamlandı' || durum === 'Deneme ile kontrol edildi';
}

export const YANLIS_NEDENLERI = [
  'Bilgi eksikliği', 'Dikkat hatası', 'İşlem hatası', 'Soruyu yanlış okuma',
  'Zaman problemi', 'Konu karışıklığı', 'Çözüm yöntemi bilmeme',
] as const;

/**
 * Deneme türleri ve net katsayıları (YKS 4 yanlış 1 doğru götürür, LGS 3'te 1).
 *
 * `bolumler` sınavın oturum bölümleridir — çalışma dersleriyle aynı şey değildir.
 * TYT'de "Temel Matematik" tek bölümdür, çalışma tarafında ise TYT Matematik ve
 * TYT Geometri ayrı derslerdir. Bu ayrım kasıtlıdır, birleştirilmemeli.
 */
export const DENEME_TURLERI = {
  TYT: {
    sinavTuru: 'YKS',
    yanlisBolen: 4,
    bolumler: ['Türkçe', 'Sosyal Bilimler', 'Temel Matematik', 'Fen Bilimleri'],
  },
  AYT: {
    sinavTuru: 'YKS',
    yanlisBolen: 4,
    bolumler: ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Edebiyat', 'Tarih', 'Coğrafya', 'Felsefe'],
  },
  LGS: {
    sinavTuru: 'LGS',
    yanlisBolen: 3,
    bolumler: ['Türkçe', 'Matematik', 'Fen Bilimleri', 'T.C. İnkılap Tarihi', 'Din Kültürü', 'İngilizce'],
  },
} as const;

export type DenemeTuru = keyof typeof DENEME_TURLERI;

export const DENEME_TUR_ADLARI = Object.keys(DENEME_TURLERI) as DenemeTuru[];

export function denemeTuruMu(deger: string): deger is DenemeTuru {
  return deger in DENEME_TURLERI;
}

export const GUN_ADLARI = [
  'Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi',
] as const;

/* ----------------------------------------------------------- Grafik paleti */

/**
 * Grafik seri renkleri — koyu lacivert zemin için doğrulanmış.
 *
 * Apps Script sürümünün paleti korundu ve bu zemine karşı yeniden doğrulandı:
 * açıklık bandı, kroma tabanı, renk körlüğü ayrımı, normal görüş ayrımı ve
 * zemine karşı kontrast — hepsi geçti.
 *
 * **Sıra önemlidir.** Orijinal sıralamada mavi ile turkuaz komşuydu ve bu çift
 * tritanopide ayırt edilemeyecek kadar yakındı (ΔE 3.3); altın araya alınarak
 * komşuluk kırıldı. Seriler her zaman bu sırayla atanır, döngüye sokulmaz.
 *
 * Renk tek başına hiçbir yerde anlam taşımaz: her seri ayrıca etiketlenir,
 * durum bantları da metin etiketiyle gösterilir.
 *
 * Koyu tema (surface #1c2842) için dataviz doğrulayıcısıyla yeniden koşturuldu:
 * parlaklık bandı, kroma, CVD (ΔE 10.7) ve kontrast (≥3) — tümü geçti. Daha
 * canlı adaylar parlaklık bandını aştığı için değiştirilmedi.
 */
export const GRAFIK_RENKLERI = ['#b4862b', '#2aa285', '#3e8bd8'] as const;
