# ÖTS Taşıma Planı

Apps Script projesi **Onurrhocam ÖTS**'nin bu Next.js projesine taşınması.
Kaynak: `C:\Users\sarse\Desktop\Onurrhocam ÖTS`

## Durum

| Faz | Durum |
|---|---|
| 0 — Neon kurulumu | ✅ Frankfurt'ta proje açıldı, şema uygulandı |
| 1 — Temel (sabitler, şema, hesaplama) | ✅ bitti |
| 2 — Auth ve iskelet | ✅ bitti, uçtan uca test edildi |
| 3 — Öğrenci ekranları | ✅ bitti |
| 4 — Koç ekranları | ✅ bitti |
| 5 — Raporlar ve grafikler | ✅ bitti |
| 7 — Spec boşlukları + koyu tema | ✅ bitti |
| 8 — Görsel dil (premium geçiş) | ✅ bitti |
| 9 — Öğrenci yönetimi (tablo + diyalog + şifre) | ✅ bitti |
| 6 — Kapanış (deploy) | ⏳ Vercel'e çıkış kaldı |

## Faz 7 — spec boşluklarının kapatılması ve tema

Orijinal prompt (29 bölüm) sistemle karşılaştırıldı; Excel/Apps Script bölümleri
kapsam dışı bırakıldı.

| Spec | Eklenen |
|---|---|
| §22 | **Koyu tema**: lacivert zemin, sol kenar menüsü, altın vurgular — Apps Script sürümünün kimliği. |
| §10 | Yanlış analizi artık raporda: neden dağılımı ve en sık neden. Veri toplanıyordu ama hiç okunmuyordu. |
| §25 | **Ders bazlı, çok haftalı uyarı** — örn. TYT Matematik uyumu üç haftadır eşiğin altındaysa ayrıca uyarır. Spec'in "en önemli özellik" dediği kural. |
| §26 | Haftalık rapora koçun yazdığı iki alan: değerlendirme ve gelecek hafta hedefleri. |
| §17 | Soru ve çalışma süresi gelişim grafikleri. |
| §11–12 | Son 30 günlük özet ve günlük ortalama. |
| §5 | Haftalık raporda doğru/yanlış/boş toplamı ve doğru oranı. |
| §1 | Öğrenci kalıcı silme — ad onayıyla, tüm verisi cascade ile. |
| §28 | Ayarlar ekranı: uyarı eşikleri panelden değiştirilebiliyor. |
| §28 | Menü Apps Script sürümündeki gibi; Programlar, Konu Takibi, Öğrenci Raporu ve Koç Notları üst seviyede, içlerinde öğrenci seçici. |

Eşikler artık saf fonksiyonlara **parametre** olarak geçiyor; `sabitler.ts`
yalnızca varsayılanı tutuyor, `ayarlar` tablosu geçersiz kılıyor.

Yeni tablolar: `haftalik_degerlendirme`, `ayarlar` (toplam 11 tablo).

### Faz 7'de yakalanan hata

Koç paneli iki haftalık veri çekiyordu ama ders bazlı kural üç hafta istiyor —
üçüncü hafta veride olmadığı için kural **hiç tetiklenmiyordu**. Test sırasında
yakalandı, pencere üç haftaya çıkarıldı.

### Hâlâ yapılmayanlar

- Koçun katalog dışı yeni konu tanımlaması ve konu takibinde alt konu
  (katalog kodda sabit; eklemek için `konu-katalogu.ts` düzenlenir).
- Deneme düzenleme arayüzü (sunucu tarafı `denemeGuncelle` hazır).
- Öğrencinin kendi konu durumunu değiştirmesi — bilinçli olarak koçta bırakıldı,
  Apps Script sürümü de böyleydi.
- Haftalık koç raporunda "en çok soru çözen / en fazla çalışma" ayrı vurgu.
- Bildirim, veri dışa aktarma, arşivleme. (Şifremi unuttum artık gerekmiyor —
  koç Düzenle ekranından şifre veriyor.)
- Çoklu koç ve KVKK/veri saklama politikası — kapsam dışı bırakıldı.

Faz 1'de yazılanlar:
`lib/ots/konu-katalogu.ts` (271 konu), `lib/ots/sabitler.ts`, `lib/ots/tarih.ts`,
`lib/ots/net.ts`, `lib/ots/hesap.ts`, `lib/ots/sema.ts`, `lib/ots/db.ts`,
`lib/ots/env-yukle.ts`, `drizzle.config.ts`, `.env.example`.

Faz 2'de yazılanlar:
`lib/ots/sifre.ts` (bcrypt), `lib/ots/oturum.ts` (JWT + çerez), `lib/ots/dal.ts` (yetki),
`lib/ots/dogrulama.ts` (zod), `lib/ots/actions/kimlik.ts`, `proxy.ts`,
`app/takip/**` (kabuk, giriş, kayıt, panel), `components/ots/**`,
`scripts/ilk-koc.mts` (`npm run ots:koc`).

Uçtan uca doğrulananlar: çerezsiz erişim engeli, yanlış şifre, doğru şifre + çerez,
kurcalanmış çerezin reddi, 5 denemede kilit, onay bekleyen hesabın girememesi,
mükerrer e-posta, zayıf şifre reddi, `noindex`, rol ayrımı (koç öğrenci ekranına giremiyor).

Faz 3-5'te yazılanlar:
`lib/ots/sorgular/` (temel, ekran, koc, deneme), `lib/ots/actions/` (gorev, onay,
ogrenci, program, konu, deneme, not), `components/ots/` (Parcalar, PanelMenu,
GorevKarti, Grafik, SifreFormu, DenemeFormu, SerbestCalismaFormu, ogrenci/AnaSayfa,
koc/*), 19 rota.

Ekranlar — **öğrenci:** ana sayfa, haftalık program, konu takibi, denemeler,
çalışma geçmişi, haftalık rapor, profil.
**Koç:** panel, öğrenciler, öğrenci detayı (program yönetimi + hesap işlemleri +
hafta kopyalama), öğrenci konu düzenleme, koç notları, dikkat listesi,
haftalık rapor, onay bekleyenler, profil.

## Grafik paleti

Açık zemin için yeniden seçildi ve doğrulayıcıdan geçirildi (eski palet koyu
zemine göreydi): `#1a7f4b` yeşil, `#2f7fd0` mavi, `#b07a0a` altın — **bu sırayla**.

Sıra önemli: yeşil ile altın protanopide ΔE 6.4 ile sınırda, mavi araya girdiği
için komşu çiftler güvenli. Renk hiçbir yerde tek başına kimlik taşımıyor —
iki ve üzeri seride hem açıklama kutusu hem çizgi ucunda doğrudan etiket var.

TYT/AYT/LGS netleri **ayrı grafiklerde** çiziliyor; farklı ölçekteki ölçüler
aynı eksene konmuyor.

## Neon HTTP sürücüsü: transaction yerine batch

`db.transaction()` bu sürücüde desteklenmiyor — çağrılırsa
"No transactions support in neon-http driver" hatası veriyor. Yerine `db.batch([...])`
kullanılıyor; Neon sunucu tarafında bunu tek transaction olarak çalıştırıyor.

Fark: `batch` **etkileşimli değil** — sorgu listesi önceden belli olmalı, içinde
okuyup koşula göre yazamazsın. Uygulamada bu bir sorun çıkarmadı; gereken yerlerde
okuma önce yapılıp yazmalar tek batch'te gönderiliyor. Gerçekten etkileşimli
transaction gerekirse WebSocket sürücüsüne (`drizzle-orm/neon-serverless` + `Pool`)
geçmek gerekir.

Batch kullanılan yerler: görev tamamlama (çalışma kaydı + görev durumu),
tamamlamayı geri alma, kayıt onaylama (kullanıcı durumu + öğrenci kaydı),
öğrenci pasife alma (öğrenci + giriş hesabı), görev durumunun geri çekilmesi.

Yan iş: `next` 16.2.10 → 16.3.7 yükseltildi. Eski sürümde kritik açıklar vardı
(App Router'da Proxy atlatma, Windows sunucularda kimlik doğrulamasız RCE).
Derleme ve mevcut portfolyo sayfaları doğrulandı.

## Karar özeti

| Konu | Karar | Gerekçe |
|---|---|---|
| Arayüz | Next.js 16 (bu proje), `/takip` altında | Apps Script'in iframe + RPC katmanı yok, ilk boya ~0.5s |
| Veritabanı | **Neon Postgres** (ücretsiz katman) | 20-50ms sorgu, indeks, transaction. E-tablo pratikte 1-2 yılda yavaşlıyor |
| Sabit veriler | Kodda TypeScript sabiti | Konu kataloğu (~200 satır) veritabanından tamamen çıkıyor |
| Oturum | httpOnly cookie + JWT (`jose`) | localStorage token'dan güvenli, istek başına DB okuması yok |
| Şifre | `bcryptjs` | 1000 tur SHA-256 döngüsünün yerine |
| Doğrulama | `zod` | Server Action girdilerinin tamamı |
| Hesaplama mantığı | `Reports.gs` / `Utils.gs` birebir TS'e taşınır | Projenin en değerli kısmı, saf fonksiyonlar, kaybolmuyor |

Neon ücretsiz katman (Eylül 2026 itibarıyla teyit edildi): 0,5 GB depolama, 100 compute-saat/ay,
5 GB trafik, 5 dakika boşta kalınca uyuma, kredi kartı yok, ticari kullanım serbest.
Bu projenin tahmini yükü ~27 MB/yıl → depolama sorun değil, izlenecek metrik compute-saat.

## Next.js 16 notları

Bu sürümde değişmiş ve plana etki eden şeyler (dokümanlar `node_modules/next/dist/docs/` içinden okundu):

- **`middleware.ts` artık `proxy.ts`** — proje kökünde, `app/` ile aynı seviyede.
- Proxy dokümanı açıkça söylüyor: proxy tam yetkilendirme çözümü değildir, yalnızca
  "iyimser kontrol" içindir. Gerçek kontroller DAL'da yapılacak.
- `use cache` / `cacheTag` / `cacheLife` modeli var ama `cacheComponents: true` gerektiriyor
  ve tüm render modelini değiştiriyor. **İlk aşamada açmıyoruz** — Postgres 20-50ms'de
  cevap verdiği için gerek yok, erken önbellek bayat veri hatası üretir. İhtiyaç çıkarsa
  koç panelinin toplu hesaplamaları için sonradan eklenir.
- `use cache` içinden `cookies()` okunamıyor; runtime değerler argüman olarak geçirilmeli.
- `use cache: private` deneysel ve yalnızca tarayıcı belleğinde — kullanmıyoruz.
- İstek içi tekrarlı okumaları React'in `cache()` fonksiyonuyla birleştiriyoruz (DAL deseni).

## Klasör yapısı

```
app/
  takip/
    layout.tsx                 ÖTS kabuğu (portfolyo navbar'ı yok, noindex)
    (auth)/
      giris/page.tsx
      kayit/page.tsx
    (panel)/
      layout.tsx               verifySession + role göre yan menü
      page.tsx                 role göre dashboard
      program/page.tsx         haftalık program
      konular/page.tsx
      denemeler/page.tsx
      gecmis/page.tsx          çalışma geçmişi
      rapor/page.tsx
      profil/page.tsx
      ogrenciler/page.tsx      koç
      ogrenciler/[id]/page.tsx koç — öğrenci profili
      dikkat/page.tsx          koç
      notlar/page.tsx          koç
      haftalik/page.tsx        koç — haftalık rapor
proxy.ts                       cookie yoksa /takip/giris'e yönlendir (yalnızca iyimser)
lib/ots/
  sabitler.ts                  Config.gs + Seed.gs → konu kataloğu, dersler, eşikler
  sema.ts                      Drizzle tablo tanımları
  db.ts                        Neon bağlantısı
  oturum.ts                    JWT şifrele/çöz, cookie yaz/sil
  dal.ts                       verifySession, getUser, requireCoach, requireStudentAccess
  tarih.ts                     Utils.gs tarih fonksiyonları
  hesap.ts                     Reports.gs hesaplamaları (saf, DB'siz)
  net.ts                       deneme net hesabı
  sorgular/                    okuma sorguları (ogrenci.ts, gorev.ts, deneme.ts, ...)
  actions/                     Server Actions (yazma işlemleri)
  dogrulama.ts                 zod şemaları
components/ots/                ÖTS arayüz bileşenleri
drizzle/                       migration dosyaları
```

## Veritabanı şeması

`oturumlar` tablosu **yok** (JWT stateless). `KonuKatalog` tablosu **yok** (kodda sabit).

| Tablo | Notlar |
|---|---|
| `users` | id, ad, soyad, email (unique, lower), sifre_hash, rol, durum, telefon, olusturma, son_giris, basarisiz_deneme, kilit_bitis |
| `ogrenciler` | users'a FK, profil + hedefler + günlük hedefler |
| `gorevler` | ogrenciler'e FK, index `(ogrenci_id, tarih)` |
| `calisma` | gorevler'e FK (nullable — serbest çalışma), `CHECK` tüm sayısal alanlar ≥ 0 |
| `ogrenci_konu` | `konu_id` koddaki katalog anahtarı, `UNIQUE(ogrenci_id, konu_id)` |
| `denemeler` | toplam_net numeric |
| `deneme_detay` | denemeler'e FK `ON DELETE CASCADE`, `CHECK` ≥ 0 |
| `yanlis_analiz` | denemeler'e FK `ON DELETE CASCADE` |
| `koc_notlari` | ogrenciler'e FK |

Şemanın kendi başına çözdüğü şeyler:

- `ON DELETE CASCADE` → `deleteWhere_` ile elle yapılan temizlik kayboluyor
- `CHECK (deger >= 0)` → negatif doğru/yanlış girme açığı veritabanı seviyesinde kapanıyor
- `UNIQUE(ogrenci_id, konu_id)` → mükerrer konu satırı imkânsız
- Transaction → `withLock_` eksikliğinden doğan eşzamanlı yazma kaybı bitiyor

**Dikkat:** `ogrenci_konu.konu_id` koddaki sabit anahtara (`KNU-0001` biçimi) bağlı.
Katalog ileride düzenlenirse **mevcut anahtarlar değişmemeli**, yalnızca sonuna eklenmeli.

## Taşınan / yeniden yazılan / silinen

**Birebir taşınıyor (saf fonksiyon, TS'e çevrilir):**
`Reports.gs` (`aggregate_`, `topicStats_`, `coachOverview_`, `studentWeeklyReport_`, `studentTrend_`,
`coachWeeklyReport_`), `Utils.gs` tarih/sayı yardımcıları, `Exams.gs` net hesabı,
`Config.gs` şema sözlükleri ve eşikler, `Seed.gs` konu kataloğu.

**Yeniden yazılıyor:**
Auth (cookie + bcrypt), veri katmanı (Drizzle + Neon), tüm istemci (`Client*.html` → React),
`Styles.html` → Tailwind 4 tokenları.

**Siliniyor:**
`Code.gs`, `Api.gs` sarmalayıcıları (yerine DAL + Server Actions), `Setup.gs`,
`Db.gs`, `Oturumlar` tablosu, HtmlService şablonları, `tools/` önizleme üreticisi.

## Yetki modeli

Apps Script'teki model doğruydu, korunuyor — yalnızca yeri değişiyor:

| Eski | Yeni |
|---|---|
| `withAuth_` | `verifySession()` |
| `withCoach_` | `requireCoach()` |
| `withStudent_` | `requireStudent()` |
| `withStudentAccess_` | `requireStudentAccess(ogrenciId)` — koç her öğrenciye, öğrenci kendi kaydına sabitlenir |

Kural aynı kalıyor: **öğrencinin gönderdiği `ogrenciId` asla güvenilmez**, kendi kaydına
sunucuda sabitlenir. Her Server Action ve her sayfa okuması bu fonksiyonlardan geçer.

## Taşıma sırasında düzeltilecek hatalar

Önceki incelemede bulunanlar. Numaralar plan boyunca referans için.

1. **`Setup.gs`'in istemciye açık olması (kritik)** — bu mimaride o fonksiyonlar hiç var olmuyor, açık kendiliğinden kapanıyor.
2. **Deneme türlerinin aynı seride karışması** — `examDeclineInfo_` tür filtresi boş çağırıyordu; TYT/AYT/LGS netleri ayrı serilerde değerlendirilecek.
3. **"Hareketsiz gün" bugünü sayması** — döngü dünden başlayacak, günü kapanmamış gün sayılmayacak.
4. **Negatif değer doğrulaması** — `CHECK` constraint + zod, iki katman.
5. **Eşzamanlı yazma kaybı** — çok tablolu yazmalar transaction içinde.
6. **Pasife alınan kullanıcının oturumunun sürmesi** — JWT ömrü kısa + DAL her istekte `durum` kontrol ediyor (artık ucuz).
7. **Şifre türetme** — bcrypt.
8. **`updateTask_` durum/çalışma tutarsızlığı** — durum geri alınırken çalışma satırı aynı transaction'da temizlenir.
9. **Ders adı tutarsızlığı** — katalogda `TYT Matematik`, programda `Matematik` idi; tek sözlükten beslenecek.
10. **`apiSeedCatalog` önbellek düşürmemesi** — konu kataloğu artık kodda, sorun ortadan kalkıyor.

## Fazlar

### Faz 0 — Kurulum (senin yapacağın, ~5 dakika)
1. [neon.com](https://neon.com) → GitHub ile giriş → proje oluştur
2. Bağlantı satırını kopyala → `.env.local` içine `DATABASE_URL=`
3. `openssl rand -base64 32` → `SESSION_SECRET=`
4. Aynı ikisini Vercel'de env değişkeni olarak ekle

### Faz 1 — Temel
Paketler (`drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`, `jose`, `bcryptjs`, `zod`, `server-only`),
`sabitler.ts` (konu kataloğu + eşikler), `sema.ts`, ilk migration, `hesap.ts` + `tarih.ts` + `net.ts` portu.
Bu fazın sonunda veritabanı ayakta ve hesaplama mantığı test edilebilir durumda.

### Faz 2 — Auth ve iskelet
`oturum.ts`, `dal.ts`, `proxy.ts`, `/takip` layout, giriş + kayıt ekranı, ilk koç hesabı için seed script.
Sonunda giriş yapıp boş bir panele düşebiliyoruz.

### Faz 3 — Öğrenci ekranları
Ana sayfa, haftalık program, görev tamamlama, serbest çalışma, konu takibi, denemeler, çalışma geçmişi, profil.

### Faz 4 — Koç ekranları
Dashboard, öğrenci listesi ve CRUD, **onay bekleyenler ekranı**, hesap açma/şifre sıfırlama,
program oluşturma ve hafta kopyalama, dikkat listesi, koç notları.

### Faz 5 — Raporlar ve grafikler
Öğrenci haftalık raporu, koç haftalık raporu, trend grafikleri.
Grafikler `ClientCore.html`'deki elle yazılmış SVG'den taşınacak (bağımlılık yok, tasarım hazır).
Renkler README'de doğrulanmış palet: `#b4862b`, `#3e8bd8`, `#2aa285` — durum renkleri her zaman metin etiketiyle.

### Faz 6 — Kapanış (kalan iş)

1. **Vercel'e deploy.** Env değişkenleri: `DATABASE_URL`, `SESSION_SECRET`.
   Fonksiyon bölgesi **Frankfurt (`fra1`)** yapılmalı — veritabanı orada,
   varsayılan ABD bölgesi her sorguya Atlantik geçişi ekler.
2. **Neon şifresini yenile.** Bağlantı satırı sohbet geçmişine girdi.
3. **Koç şifresini değiştir.** `/takip/profil` üzerinden.
4. `ILK_KOC_EMAIL` / `ILK_KOC_SIFRE` satırlarını `.env.local`'den sil.
5. İlk gerçek öğrenciler girdikten sonra: geliştirme için ayrı bir Neon branch'i aç,
   canlı veri üzerinde test edilmesin.
6. Compute-saat kullanımını Neon panelinden ara ara kontrol et.

### Sonraya bırakılanlar

- Kayıt için IP bazlı hız sınırlaması (şu an yalnızca 200 bekleyen kayıt üst sınırı var).
- Deneme düzenleme ekranı (sunucu tarafı `denemeGuncelle` hazır, arayüzü yok —
  şu an yanlış girilen deneme koç tarafından silinip yeniden girilir).
- `use cache` / `cacheComponents` ile önbellekleme (Postgres yeterince hızlı olduğu
  sürece gereksiz; yavaşlarsa buradan başlanır).

## Kayıt ve onay akışı

Karar: **kayıt herkese açık, ama koç onayı olmadan giriş yok. Onaylanmayan hesap bir hafta sonra kalıcı silinir.**

Akış:

1. Öğrenci `/takip/kayit` ekranından kaydolur → `users.durum = 'beklemede'`
2. Giriş denemesinde "Hesabınız koç onayı bekliyor" mesajı alır (bu mantık `Auth.gs`'de zaten var)
3. Koç panelinde **Onay Bekleyenler** ekranı: onayla / reddet
4. Onaylananın durumu `aktif` olur, aynı işlemde `ogrenciler` kaydı açılır
5. 7 günden eski `beklemede` kayıtlar kalıcı silinir

Silme işi için **zamanlanmış görev kurmuyoruz.** Koç onay ekranını her açtığında süresi geçmiş
kayıtlar temizlenir (tembel temizlik). Zamanlanmış göreve göre avantajı: kurulum yok, ücretsiz
katman kısıtı yok, hata yapacak bir yer az. Koç haftalarca girmezse kayıtlar bir süre fazla
kalır — veri hacmi olarak önemsiz.

Notlar:

- 7 gün `sabitler.ts` içinde ayar olacak. Koç tatildeyse gerçek bir öğrenci silinebilir;
  gerekirse 14 güne çıkarılır.
- Kayıt herkese açık olduğu için kötü niyetli biri çok sayıda `beklemede` kayıt üretebilir.
  Faz 2'de basit bir koruma ekleyeceğim (aynı IP'den dakikada sınırlı kayıt).
- `FIRST_USER_IS_COACH` mantığı kaldırılıyor; ilk koç hesabı seed script'ten açılacak.

## Açık sorular

1. ~~Mevcut e-tabloda gerçek veri var mı?~~ **Boş / test verisi — import scripti yazılmayacak.**
2. ~~Kayıt açık kalacak mı?~~ **Açık + koç onayı + 7 gün sonra temizlik (üstteki bölüm).**
3. **Adres `/takip` olarak varsayıldı.** Değiştirmek istersen tek klasör adı meselesi.
4. **İlk koç hesabı** env'deki e-posta + şifreyle seed script'ten açılacak (varsayılan kabul edildi).

## Notlar

- Kaynak proje git deposu değil. Taşıma başlamadan Masaüstündeki klasörün bir kopyasını al.
- Apps Script projesi bir süre paralel açık kalabilir; ama `Setup.gs` açığı sebebiyle
  taşıma bitince yayından kaldırılması gerekiyor.

## Faz 8 — görsel dil

Tema doğruydu ama yüzeyler düzdü ve hiç ikon yoktu; "basit" hissinin sebebi buydu.

**Kurulan tek kütüphane:** `lucide-react` (ikonlar). `motion` zaten projede vardı.
shadcn/ui bilerek kurulmadı — kendi tema değişkenlerini getiriyor, `--color-ots-*`
sistemiyle çakışır ve onlarca dosya ekler.

Yüzey dili `globals.css` içinde dört kuralda toplandı:

| Sınıf | Ne yapıyor |
|---|---|
| `.ots-kok` | Zeminde üstten çok hafif altın parıltı — tek düze koyu yüzeyi kırıyor |
| `.ots-yuzey` | Yukarıdan aşağı hafif koyulaşma + 1px iç kenar parlaklığı + geniş yumuşak gölge |
| `.ots-altin` | Altın düğme: geçişli dolgu, üst parlaklık, basınca 1px iniyor |
| `.ots-sayi` | `tabular-nums` — sütunlarda rakamlar kaymıyor |
| `.ots-belir` | İçerik girişte yumuşak beliriyor; `prefers-reduced-motion` ile kapanıyor |

Menüde etkin öğe üç işaretle belli oluyor: sol kenarda altın şerit, altın tonlu
zemin, altın metin — ve `aria-current`. Renk tek başına bırakılmadı.

### Faz 8'de yakalanan hata

Menü ikonlarını sunucu bileşeninden istemci bileşenine **bileşen olarak**
geçirmiştim; React Server Components bunu yasaklıyor (fonksiyon serileştirilemez)
ve panel 500 veriyordu. İkonlar artık ada göre geçiyor, eşleme istemci tarafında.

## Faz 9 — öğrenci yönetimi: tablo, diyalog, şifre

- **Öğrenciler sayfası tablo** oldu: Ad soyad (e-posta altında), Sınıf, Sınav,
  Hedef, Hesap, Durum ve satır sonunda **Düzenle**.
- **Ekleme ve düzenleme diyalogda.** `Modal` bileşeni: Escape ve arka plana
  tıklama kapatıyor, açıkken arka plan kaydırılmıyor, odak diyaloğun içinde
  dönüyor ve kapanınca çağıran düğmeye geri veriliyor.
- **Şifre alanı** hem eklemede hem düzenlemede:
  - eklerken boş → sistem üretir ve mesajda gösterir; dolu → o kullanılır
  - düzenlerken boş → şifreye dokunulmaz; dolu → öğrencinin şifresi değişir
  - düzenlemede e-posta da değiştirilebiliyor; hesabı olmayan öğrenciye
    e-posta + şifre verilince hesap açılıyor

Bu sayede **"şifremi unuttum" akışına gerek kalmıyor** — öğrenci unutursa koç
Düzenle'den yenisini veriyor. (Planın "sonraya bırakılanlar" listesinden düştü.)

Uçtan uca doğrulandı: eski şifreyle giriş → koç yeni şifre verdi → yeni şifre
çalışıyor, eski şifre geçersiz, boş bırakılınca şifre korunuyor ama diğer
alanlar güncelleniyor, zayıf şifre reddediliyor.

## Faz 10 — tasarım yenileme: "Lacivert Akşam" (koyu, mobil-önce)

Kullanıcı geri bildirimi: sistem "aşırı karanlık", düğmeler "pastel/çocuksu",
mobil en önemli kriter. İlk deneme (açık zeminli "Gündüz Lacivert") **reddedildi**
— koyu tema kimlik. Ders: tema gibi geri dönüşü pahalı görsel kararlar
uygulanmadan önce tek cümleyle onaylatılacak.

Karar: koyu tema kalır, zemin bir kademe kaldırılır, efekt yığını silinir.

| Katman | Eski | Yeni |
|---|---|---|
| Zemin / kart / yükselti | `#0b1320` / ~`#111c30` | `#141e34` / `#1c2842` / `#26365a` |
| İskelet (menü, alt sekme, toast) | zeminle aynı | `#0f172a` (zeminden koyu) |
| Altın | gradyan + parıltı | düz `#f2b722`, metin lacivert `#0f172a` (9.84:1) |
| Durum renkleri | `/12` opaklıklı bulanık rozet | doygun ton + sabit tint zemini (`*-tint`) |
| Girdi sınırı | `line` (1.5:1) | `line-strong #6583bd` (≥3:1 her zeminde) |

- Tüm çiftler WCAG 2.1 ile hesaplandı (`docs/ots-tasarim-spec.md` §2.2): metin ≥4.5,
  UI sınırı ≥3 — hepsi geçiyor. Grafik paleti koyu zemin için dataviz doğrulayıcıdan
  geçti; daha canlı adaylar parlaklık bandını aştığı için `GRAFIK_RENKLERI` değişmedi.
- Yapısal iş temadan bağımsız (spec §3–§9): alt sekme çubuğu (5 yuva) + "Daha fazla"
  sheet, md altı her modal vaul bottom sheet, tablolar kart listesi, 4×2 ızgara
  mobilde gün şeridi + dikey liste, FAB, 44px hedefler, 16px girdi, 11px altı metin yok,
  sonner toast, motion (tek easing, 150/220/300 ms, reduced-motion'da sıfır).
- Yazdırma CSS'i (tek A4 yatay PDF) dokunulmadı.
- Uygulama: 3 kademeli iş akışı (Temel → Kabuk → 7 sayfa grubu, kesin dosya sahipliği).

### Faz 10 revizyonları (kullanıcı isteği, aynı turda)

1. **Kaynaklarım** (`/takip/kaynaklar`): öğrenci ders ders elindeki kaynakları
   (kitap, soru bankası, video…) girer; koç görüntüler, ekleyip silebilir.
   Yeni tablo `kaynaklar` (ogrenci_id cascade, ders, ad, tur, not_metni);
   `actions/kaynak.ts` (kaynakEkle, kaynakSil — yetki `actionOgrenciErisimi`),
   `sorgular/kaynak.ts` (kaynaklariGetir, derseGoreGrupla). Menüde her iki rolde.
2. **Mezun durumu + geçen yıl sıralaması**: `kullanicilar.mezun/gecen_yil_siralama`
   (kayıt formunda alınır) → onayda `ogrenciler`'e kopyalanır; koç düzenleme
   formunda da değiştirilebilir. Öğrenciler tablosunda Düzenle'nin yanına
   **Görüntüle** (detay sayfası; mezun/sıralama ve kaynaklar orada da görünür).
3. **Gün modalı**: program ızgarasında güne tıklayınca modal — öğrenci o günün
   görevlerini orada tamamlar (ızgara altındaki uzun liste kaldırıldı, scroll yok);
   koç o günün özetini görür (tamamlanan/soru/süre, görev başına gerçekleşen,
   düzenle kısayolu, o güne görev ekle).

Migration: `drizzle/0004_revize-mezun-kaynaklar.sql` uygulandı.

### Faz 10'da yakalanan hata — CSS katmanı

`.ots-kok * { border-color }` ve portfolyonun `* { border-color }` kuralları
katmansızdı; Tailwind v4 utility'leri `@layer utilities` içinde olduğu için
**hiçbir `border-*` renk sınıfı ekranda çıkmıyordu** (katmansız bildirim
katmanlıyı yener). Çözüm: ÖTS varsayılanı `@layer base { body:has(.ots-kok) * }`
(portalları da kapsar), portfolyo kuralı `body:not(:has(.ots-kok)) *` ile ÖTS
dışına alındı — portfolyonun görünümü değişmedi.

### Faz 10 sağlamlaştırma — bozuk adres parametreleri

Denetimde bulundu: adres çubuğuna `?hafta=abc` ya da `?ogrenci=xyz` yazılınca 12
sayfa Postgres hatasıyla çöküyordu (`NaN-NaN-NaN` tarih, geçersiz `uuid`).
Kök nedende düzeltildi, sayfa sayfa değil:
- `tarih.ts` `haftaBasi()` — biçime uymayan anahtar bu haftaya çevrilir.
- `dal.ts` `ogrenciKaydi()` — UUID olmayan kimlikte sorguya gitmeden `null`
  (koçun öğrenci sayfaları "bulunamadı"/seçim ekranı gösterir, detay 404).
- `/takip/kayit-eksik` sayfası eklendi (onaylı ama öğrenci kaydı olmayan hesap
  için `dal.ts` buraya yönlendiriyordu, sayfa yoktu → 404).
- Tailwind `@source not` ile `docs/` ve plan dosyası sınıf taramasından çıkarıldı
  (belgedeki örnek metin sahte `bg-[url(chevron)]` üretip derlemeyi kırıyordu).

### Faz 10 denetimi — 6 mercek, 46 bulgu

Mobil düzen, tema/token, RSC/çalışma zamanı, yazdırma, erişilebilirlik ve
işlev regresyonu mercekleriyle denetlendi; her bulgu iki bağımsız çürütücüden
geçti (38 onaylandı, 8 çürütüldü). Öne çıkanlar:

- **Form sıfırlanma (React 19):** `<form action={fn}>` eylem bitince formu
  koşulsuz sıfırlıyor (react-dom `startHostTransition` → `requestFormReset`),
  eylem hata dönse bile. Yanlış şifrede e-posta, kayıtta tüm alanlar siliniyordu.
  Ortak kanca `components/ots/hooks/useFormGonder.ts`: `onSubmit` içinde
  `preventDefault` + `startTransition` — React eylemi noop'la çalıştırır, sıfırlama
  olmaz, bekleme durumu çalışır. 13 forma uygulandı; tarayıcıda doğrulandı.
- **Tek FAB:** 4 sayfadaki kopyalar `components/ots/Fab.tsx`'e toplandı (gizlenme
  mesafeleri farklıydı, bazıları safe-area'lı telefonda altın şerit bırakıyordu;
  gizliyken `inert`).
- Ana sayfadaki "Serbest çalışma ekle" artık Geçmiş'e gitmiyor, formu yerinde açıyor.
- Tekrarlanan formlarda yinelenen `id`'ler (`Alan` `kimlik` prop'u), iki yapışkan
  üst öğe çakışması, 3'lü sayaçların 360px'te sıkışması, 44px altı dokunma alanları,
  etkisiz genişlik sınıfları, gün kartında "bugün"ün yalnızca renkle belirtilmesi.

Bilinçli bırakılanlar: girdi odak halkası /40 (koyu zeminde /25 görünmüyor),
üst çubuk `bg/95`, mezun onay kutusu altın.

Doğrulama (tümü geçti): tsc, `next build`, 30 sayfa koç+öğrenci oturumuyla,
14 bozuk-parametre senaryosu, 24 sayfada tarayıcı konsolu temiz, tarayıcıda form
testi (8 kontrol), PDF tek A4 yatay sayfa (koç ve öğrenci, mobilden de).

### Faz 10 — masaüstü yoğunluğu

Kullanıcı geri bildirimi: masaüstünde her şey büyük, minimal değil. Neden: mobil
için konan 44–48px dokunma hedefleri ve 16px girdi yazısı masaüstünde de
uygulanıyordu; kenar menü ekrana sığmayıp kayıyordu.

Çözüm: **lg (1024px) ve üstünde fare ölçüsü**, altında dokunmatik ölçü aynen:
düğme 36px / 13.5px, ikon düğmesi 32px, girdi 40px / 14px, ikonlar 16px, kenar
menü 240px ve 36px öğeler, tablo satırı sıkı, sayfa başlığı 22px. Ortak
parçalarda (`Parcalar`, `Alan`, `KenarMenu`) yapıldı; sayfalardaki elle yazılmış
yüksekliklere betikle `lg:` karşılığı eklendi (54 yer).

Aynı turda:
- Öğrenci tablosunda **Görüntüle** ikonu geri geldi (denetim "fazladan bağlantı"
  diye kaldırmıştı; kullanıcının açık isteği).
- `CizgiGrafigi` ölçülen genişlikte çiziliyor (ResizeObserver): geniş kartta
  eksen yazısı 27px'e, grafik 450px yüksekliğe çıkıyordu; artık her ekranda 11px.
- Hidrasyon uyumsuzluğu: `Belir`, grafik çizgisi ve tamamlandı işareti
  `initial`'ı hareket azaltma tercihine göre render'da seçiyordu — sunucu tercihi
  bilmediği için HTML farklı çıkıyordu. Başlangıç artık sabit; tercih CSS'te
  (`.ots-belir-kap`) ya da yalnızca etkileşim sonrası uygulanıyor. 24 sayfa ×
  mobil/masaüstü, tercih açık/kapalı tarandı: temiz.
