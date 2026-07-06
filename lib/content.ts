/**
 * ✏️  TÜM SİTE İÇERİĞİ BURADA — Onur buradan kendi bilgilerini güncelleyebilir.
 * Her alanı serbestçe değiştir; sitenin geri kalanı otomatik güncellenir.
 */

export const site = {
  name: "Onur Akbağ",
  handle: "onurrhocam",
  role: "YKS & LGS Eğitim Koçu",
  motto: "Disiplin + İstikrar = Başarı",
  tagline:
    "Sadece program hazırlayan değil, öğrencisini her gün takip eden bir koçluk sistemi.",
  location: "Konya · Online & Yüz Yüze",
  email: "iletisim@onurrhocam.com", // ✏️ gerçek e-posta
  phone: "+90 555 000 00 00", // ✏️ gerçek telefon
  whatsapp: "+905550000000", // ✏️ sadece rakam, ülke koduyla
  socials: {
    instagram: "https://instagram.com/onurrhocam",
  },
};

// Hero'daki rozetler
export const heroBadges = ["Online", "Yüz Yüze", "Türkiye'nin Her Yerinden Öğrenci"];

// Akan güven bandı
export const trustWords = [
  "YKS Koçluğu",
  "LGS Koçluğu",
  "Günlük Takip",
  "Haftalık Analiz",
  "Kişiye Özel Program",
  "Deneme Analizi",
  "Veli Bilgilendirmesi",
  "Motivasyon Desteği",
];

// Hakkımda
export const about = {
  title: "Ben Kimim?",
  intro: "Merhaba, ben Onur Akbağ.",
  paragraphs: [
    "5 yılı aşkın süredir eğitim koçluğu yapıyorum. Bugüne kadar yüzlerce öğrencinin hedeflerine ulaşmasına yardımcı oldum.",
    "Benim için başarı; sadece ders çalıştırmak değil, öğrencinin tüm sürecini yönetebilmektir.",
  ],
  highlights: [
    "YKS derece öğrencileri",
    "LGS Türkiye 1.'si",
    "Online ve yüz yüze birebir takip",
    "Haftalık analiz",
    "Günlük ödev kontrolü",
    "Motivasyon desteği",
  ],
};

// Neden Benimle Çalışmalısın? — 4 kart
export const whyMe = [
  {
    icon: "calendar",
    title: "Günlük Takip",
    text: "Her gün iletişim. Öğrencim hiçbir gün başıboş kalmaz.",
  },
  {
    icon: "chart",
    title: "Haftalık Analiz",
    text: "Net takibi ve deneme analizleriyle gelişim her hafta ölçülür.",
  },
  {
    icon: "target",
    title: "Kişiye Özel Program",
    text: "Hazır program yok. Her program öğrencinin seviyesine göre kurulur.",
  },
  {
    icon: "chat",
    title: "7/24 İletişim",
    text: "Takıldığında yalnız değilsin. Her an ulaşabilirsin.",
  },
];

// Koçluk Süreci — 5 adım
export const processSteps = [
  { title: "Tanışma Görüşmesi", text: "Ücretsiz ön görüşmede hedefini ve mevcut durumunu konuşuruz." },
  { title: "Seviye Analizi", text: "Netlerini, çalışma alışkanlıklarını ve eksiklerini analiz ederim." },
  { title: "Kişiye Özel Program", text: "Sana özel, gerçekçi ve sürdürülebilir bir program hazırlarım." },
  { title: "Günlük Takip", text: "Her gün ödev kontrolü ve iletişimle programın işlediğinden emin olurum." },
  { title: "Haftalık Değerlendirme", text: "Haftalık görüşmeyle neleri geliştirdiğimizi ölçer, planı güncelleriz." },
];

// Koçluk Paketleri
export const packages = [
  {
    name: "Starter",
    subtitle: "Yeni başlayanlar için.",
    features: ["Haftalık Program", "Haftalık Görüşme", "WhatsApp Desteği"],
    featured: false,
  },
  {
    name: "Plus",
    subtitle: "Dengeli takip isteyenler için.",
    features: ["Günlük Takip", "Haftalık Görüşme", "Deneme Analizi", "Motivasyon"],
    featured: false,
  },
  {
    name: "Premium",
    subtitle: "En kapsamlı paket.",
    features: [
      "Günlük Takip",
      "Sınırsız İletişim",
      "Kişiye Özel Program",
      "Günlük Kontrol",
      "Veli Bilgilendirmesi",
      "Öncelikli Destek",
    ],
    featured: true, // ⭐ En Çok Tercih Edilen
  },
];

// Başarılarımız — sayaçlar
export const stats = [
  { value: "500+", label: "Koçluk Öğrencisi" },
  { value: "1000+", label: "Hazırlanan Program" },
  { value: "100+", label: "Hedefine Ulaşan Öğrenci" },
  { value: "5+", label: "Yıllık Deneyim" },
];

// Öğrenci & veli yorumları
// ✏️ Buraya gerçek Instagram yorumları / WhatsApp ekran görüntülerindeki metinleri yazabilirsin.
export const testimonials = [
  {
    quote:
      "Onur hocamla çalışmaya başladıktan sonra netlerim düzenli olarak artmaya başladı. Her gün kontrol etmesi beni hep diri tuttu.",
    name: "Elif K.",
    detail: "YKS Öğrencisi",
  },
  {
    quote:
      "Oğlumuzun hem çalışma düzeni hem özgüveni değişti. Veli olarak süreçten her hafta haberdar olduk. İyi ki tanışmışız.",
    name: "Fatma T.",
    detail: "Veli",
  },
  {
    quote:
      "Deneme analizlerinden sonra nerede yanlış yaptığımı ilk kez net gördüm. Programım bana göreydi, ezber değildi.",
    name: "Mehmet A.",
    detail: "LGS Öğrencisi",
  },
];

// Başarı Hikayeleri — İlk net → Son net → Kazanılan yer
export const successStories = [
  {
    student: "Zeynep",
    exam: "YKS",
    firstScore: "TYT 48 net",
    lastScore: "TYT 102 net",
    result: "Hacettepe Üniversitesi",
  },
  {
    student: "Emir",
    exam: "LGS",
    firstScore: "İlk deneme: 320 puan",
    lastScore: "Son deneme: 468 puan",
    result: "Fen Lisesi",
  },
  {
    student: "Ayşe",
    exam: "YKS",
    firstScore: "AYT 31 net",
    lastScore: "AYT 74 net",
    result: "Hukuk Fakültesi",
  },
];

// Blog yazıları — SEO için her hafta yeni yazı ekle
export const posts = [
  {
    title: "YKS'de Son 100 Gün Nasıl Çalışılır?",
    excerpt:
      "Son 100 gün paniğe değil, stratejiye ihtiyaç duyar. Gün gün nasıl planlaman gerektiğini anlatıyorum.",
    category: "YKS",
    date: "1 Temmuz 2026",
    readTime: "7 dk",
  },
  {
    title: "LGS'de En Çok Yapılan Hatalar",
    excerpt:
      "Her yıl binlerce öğrenci aynı hatalara düşüyor. Bu 7 hatayı bilirsen rakiplerinin önüne geçersin.",
    category: "LGS",
    date: "24 Haziran 2026",
    readTime: "6 dk",
  },
  {
    title: "Deneme Analizi Nasıl Yapılır?",
    excerpt:
      "Deneme çözmek yetmez; doğru analiz etmezsen aynı yanlışları tekrarlarsın. Adım adım analiz yöntemim.",
    category: "Strateji",
    date: "17 Haziran 2026",
    readTime: "8 dk",
  },
  {
    title: "Motivasyon Kaybı Nasıl Önlenir?",
    excerpt:
      "Motivasyon gelip geçicidir, sistem kalıcıdır. Kötü günlerde bile çalışmayı sürdürmenin yolları.",
    category: "Motivasyon",
    date: "10 Haziran 2026",
    readTime: "5 dk",
  },
  {
    title: "TYT Ne Zaman Bitmeli?",
    excerpt:
      "TYT'yi ne zaman bitirip AYT'ye ağırlık vermelisin? Sınıfına ve hedefine göre zaman çizelgesi.",
    category: "YKS",
    date: "3 Haziran 2026",
    readTime: "6 dk",
  },
  {
    title: "Program Nasıl Hazırlanır?",
    excerpt:
      "İyi bir program takvim değil, sistemdir. Kişiye özel program hazırlamanın temel kuralları.",
    category: "Strateji",
    date: "27 Mayıs 2026",
    readTime: "7 dk",
  },
];

// Sık Sorulan Sorular
export const faqs = [
  {
    q: "Online koçluk nasıl oluyor?",
    a: "Görüşmelerimizi görüntülü olarak yapıyoruz; günlük takip, ödev kontrolü ve deneme analizleri WhatsApp üzerinden yürüyor. Türkiye'nin ve dünyanın her yerinden öğrencimle aynı sistemle çalışıyorum — mesafe hiçbir şeyi değiştirmiyor.",
  },
  {
    q: "Program kişiye özel mi?",
    a: "Kesinlikle. Hazır ya da kopyala-yapıştır program kullanmıyorum. Seviye analizinden sonra hedefine, okul temposuna ve çalışma alışkanlıklarına göre sana özel bir program kuruyorum ve her hafta güncelliyorum.",
  },
  {
    q: "Veliler süreçte yer alıyor mu?",
    a: "Evet. Özellikle Premium pakette velilere düzenli bilgilendirme yapıyorum. Öğrencinin gelişimini, deneme sonuçlarını ve programa uyumunu şeffaf şekilde paylaşıyorum.",
  },
  {
    q: "Kaç öğrenci kabul ediyorsunuz?",
    a: "Günlük takip sistemim yoğun birebir ilgi gerektirdiği için dönemlik kontenjanım sınırlı. Bu sayede her öğrencime gerçekten zaman ayırabiliyorum. Güncel kontenjan için ön görüşme talebinde bulunabilirsin.",
  },
  {
    q: "Ücretler ne kadar?",
    a: "Ücretlendirme seçtiğin pakete ve sürece göre değişiyor. Ücretsiz ön görüşmede ihtiyacını birlikte belirleyip sana uygun paketi ve ücretini net şekilde konuşuyoruz.",
  },
];

// Ücretsiz Kaynaklar — ✏️ PDF dosyalarını public/kaynaklar/ içine koyup href'leri güncelle
export const resources = [
  { icon: "doc", title: "PDF Program", desc: "Örnek haftalık çalışma programı", href: "#" },
  { icon: "calendar", title: "Çalışma Takvimi", desc: "Aylık planlama takvimi", href: "#" },
  { icon: "chart", title: "Deneme Takip Formu", desc: "Net gelişimini kaydet", href: "#" },
  { icon: "clock", title: "Pomodoro Takibi", desc: "Odak seansı çizelgesi", href: "#" },
  { icon: "target", title: "Hedef Planlayıcı", desc: "SMART hedef şablonu", href: "#" },
];

export const nav = [
  { label: "Hakkımda", href: "#hakkimda" },
  { label: "Koçluk", href: "#paketler" },
  { label: "Başarılar", href: "#basarilar" },
  { label: "Blog", href: "#blog" },
  { label: "S.S.S", href: "#sss" },
  { label: "İletişim", href: "#iletisim" },
];
