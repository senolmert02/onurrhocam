# OnurrHocam ÖTS — Nihai Tasarım Spesifikasyonu
**Omurga:** "Lacivert Akşam" — **KOYU TEMA KORUNUR** (kullanıcı kararı: açık tema reddedildi). **Graftlar:** parlatma katmanının tek hamlede silinmesi, tint'lerin sabit hex ile kilitlenmesi, "sayfa başına 1 birincil düğme", ≤9 karakter sekme etiketi, `satirVerisi()` tek veri kaynağı, klavye açıkken alt çubuğun gizlenmesi, 11px-altı metnin yasaklanması, "Daha fazla göster" sayfalama. **Düzeltmeler:** girdi/düğme sınırı için ≥3:1 `line-strong` tokenı, 640–767 çelişkisi, Modal SSR/hydration, hardcoded hover hex'leri, ~170px sabit krom, tamamlanan gün göstergesi, tipografi sessizliği.

Tüm kontrast oranları WCAG 2.1 bağıl parlaklık formülüyle Node betiğiyle hesaplandı (scratchpad/kontrast.mjs). Kapsam: yalnızca `/takip`; portfolyo (`/`) dokunulmaz. **§3–§9 (tipografi, bileşen reçeteleri, mobil, hareket, kütüphaneler, sayfa notları, anti-pattern'ler) temadan bağımsızdır ve aynen geçerlidir; yalnızca tokenlar koyu değerlerle değiştirildi.**

---

## 1. Tez

Eski temanın sorunu koyu olması değil, **siyaha yakın** olmasıydı (zemin #0b1320, bağıl parlaklık 0,006) ve kartların zeminden ancak ayrışmasıydı. Tedavi laciverti terk etmek değil, laciverti "gece"den "akşam" tonuna kaldırmaktır: zemin `#141E34` (parlaklık 3 kat artar), kart `#1C2842`, yükselti `#26365A` — üç net basamak, göz kartı zeminden çabasız ayırır; beyaz metin (`#EEF2F9`, kart üstünde 13.07:1) kamaştırmaz. İskelet (kenar menü, alt sekme çubuğu, giriş üst bloğu, toast) zeminden **daha koyu** `#0F172A` kalır; içerik alanı ondan bir kademe açıktır, böylece derinlik hissi tokenlardan gelir, gölgeden değil. "Soluk / pastel / çocuksu" hissin kaynağı palet değil efekt yığınıdır — hardal gradyanı, iç parlaklık, renkli gölge, neon nokta, her yerde `rounded-full`, `/12` opaklıklı bulanık rozetler — bunların tamamı silinir; yerine **tek doygun altın düz dolgu** (`#F2B722`, sarı değil altın) + lacivert metin (`#0F172A`, 9.84:1) gelir. Durum renkleri koyu zemin için doygun ve açık tonlardır (`#3AD29A` yeşil, `#FF9F43` turuncu, `#FF7676` kırmızı) ve her zaman metin etiketiyle birlikte kullanılır. Altın yalnızca üç yerde yaşar: birincil düğme, etkin gezinme göstergesi ve "dikkat" vurgusu; azlık premium hissi, doygunluk canlılığı verir. Mobil birinci sınıf vatandaştır: 768 altında her modal vaul bottom sheet, her tablo kart listesi, 4×2 hafta ızgarası "yapışkan gün şeridi + bugün odaklı dikey liste", gezinme 5 yuvalı alt sekme çubuğudur ve her sayfada en fazla bir yapışkan üst öğe vardır. Hareket az ve kararlıdır: tek easing, tek yön (aşağıdan yukarı), üç süre (150/220/300 ms), kaydırmaya bağlı sürekli animasyon yok, `prefers-reduced-motion`'da sıfır.

---

## 2. Tokenlar

`app/globals.css` içindeki `@theme` bloğu **yazıldı** (uygulama ajanları dokunmaz). Ad alanı `--color-ots-*` korunur; portfolyo tokenlarına dokunulmaz.

### 2.1 Tam liste

| Token | Hex | Gerekçe |
|---|---|---|
| `--color-ots-bg` | `#141E34` | Sayfa zemini. Mürekkep laciverti; eskisinden 3 kat parlak, hâlâ koyu. |
| `--color-ots-surface` | `#1C2842` | Kart, girdi, diyalog, sheet. Zeminden bir kademe açık. |
| `--color-ots-raised` | `#26365A` | Kart içi yükselti, hover, nötr rozet, sessiz düğme hover, "Daha fazla" kutucukları. |
| `--color-ots-line` | `#35476E` | **Dekoratif** ayırıcı: kart kenarı, `divide-y`, ilerleme rayı. Kontrast şartı yok. Girdi/düğme sınırında KULLANILMAZ. |
| `--color-ots-line-strong` | `#6583BD` | Girdi, ikincil düğme, ikon düğmesi, segmented ve `<select>` sınırı — WCAG 1.4.11: surface 3.87, bg 4.38, raised 3.15. Hover'da `faint`'e açılır. |
| `--color-ots-panel` | `#0F172A` | Lacivert iskelet: kenar menü, alt sekme çubuğu, giriş üst bloğu, toast, grafik balonu. **Altın düğme/FAB/rozet metni** de bu renktir. |
| `--color-ots-panel-hover` | `#1A2540` | Menü öğesi hover zemini. |
| `--color-ots-panel-line` | `#243352` | Panel içi ayırıcı. |
| `--color-ots-panel-ink` | `#EEF2F9` | Panel üstünde birincil metin (= ink). |
| `--color-ots-panel-soft` | `#B4C0D8` | Panel üstünde ikincil metin ve pasif sekme ikonu (= soft). |
| `--color-ots-ink` | `#EEF2F9` | Birincil metin. |
| `--color-ots-soft` | `#B4C0D8` | İkincil metin (açıklamalar, etiketler). |
| `--color-ots-faint` | `#9FADC8` | Sönük metin, placeholder, eksen etiketi, meta. 11px'te bile surface 6.49 / raised 5.28. Daha koyu faint YASAK. |
| `--color-ots-gold` | `#F2B722` | Birincil düğme dolgusu, FAB, etkin sekme çizgisi, kenar menü şeridi, **sari ilerleme dolgusu** (ray üstünde 5.08). Gradyan yok. |
| `--color-ots-gold-hover` | `#FFC633` | Birincil düğme hover (bir kademe açık — koyu zeminde hover aydınlanır). |
| `--color-ots-gold-deep` | `#D49B18` | Odak halkası, `vurgu` kart kenarlığı, gün şeridinde "bugün" halkası (surface 5.94). Altın düğmeye iç halka GEREKMEZ (gold/surface 8.08). |
| `--color-ots-gold-ink` | `#F7C94F` | Koyu zeminde altın **metin/ikon**: hayalet düğme, ikon kutusu, sari rozet metni (surface 9.38, gold-tint 8.02). |
| `--color-ots-gold-bright` | `#F7C94F` | Panel üstünde altın metin (etkin sekme, avatar baş harfi). = gold-ink; ad §8 ile uyum için tutuldu. |
| `--color-ots-gold-tint` | `#3A3320` | Altın vurgulu kart/uyarı/rozet zemini (sabit hex — Tailwind `/10` yerine; PDF'te tutarlı). |
| `--color-ots-yesil` | `#3AD29A` | Başarı metni, rozet, ilerleme dolgusu, tamamlanan işaret. |
| `--color-ots-yesil-tint` | `#1F3F4A` | Yeşil rozet ve tamamlanan görev kartı zemini. |
| `--color-ots-turuncu` | `#FF9F43` | Uyarı metni, rozet, ilerleme dolgusu. |
| `--color-ots-turuncu-tint` | `#3F3330` | Turuncu rozet zemini. |
| `--color-ots-kirmizi` | `#FF7676` | Hata metni, çerçeveli tehlike düğmesi, kritik rozet, kritik satır şeridi. |
| `--color-ots-kirmizi-dolgu` | `#CC3333` | **Dolu** tehlike düğmesi zemini (metin ink, 4.57). `kirmizi` açık ton olduğu için dolguda kullanılmaz. |
| `--color-ots-kirmizi-hover` | `#B82D2D` | Dolu tehlike düğmesi hover. |
| `--color-ots-kirmizi-tint` | `#3F2A35` | Kırmızı rozet, hata bildirimi, kritik dikkat satırı zemini. |
| `--color-ots-overlay` | `rgba(8,13,26,.62)` | Modal/sheet perdesi. `backdrop-blur` YOK. |
| `--shadow-ots` | `0 1px 2px rgba(0,0,0,.25), 0 8px 24px -16px rgba(0,0,0,.5)` | Kart gölgesi (koyu zeminde kısa). |
| `--shadow-ots-hover` | `… rgba(0,0,0,.65)` | Tıklanabilir kart hover (yalnızca masaüstü). |
| `--shadow-ots-dialog` | `0 24px 64px -24px rgba(0,0,0,.7)` | Merkez diyalog ve giriş kartı. |
| `--shadow-ots-sheet` | `0 -8px 32px -12px rgba(0,0,0,.6)` | Bottom sheet ve alt sekme çubuğu. |
| `--shadow-ots-gold` | `0 6px 16px -8px rgba(242,183,34,.45)` | Yalnızca birincil düğme ve FAB (dinlenme hâli). |
| `--ease-ots` | `cubic-bezier(.22,1,.36,1)` | Tek easing. Motion'da `[0.22,1,0.36,1]`. |

**Silinenler:** `.ots-kok` radial altın parıltı; `.ots-yuzey` gradient + inset parlaklık + 34px gölge; `.ots-yuzey-hover` transform ve altın kenarlık karışımı; `.ots-altin` (gradient, filter, inset, translateY) — tüm kullanım noktaları `DUGME_ALTIN` sabitine bağlanır; `Ilerleme`'deki `bg-gradient-to-r` ve `bg-black/25` ray; `Bos`'taki `bg-black/15`; rozetlerdeki `/12` opaklık ve `shadow-[0_0_8px_currentColor]`.

**globals.css'te hazır olanlar** (Temel ajanı yeniden yazmaz, yalnızca kullanır): `.ots-kok`, `.ots-kok *` kenarlık sızıntı kesici, `touch-action`, `.ots-yuzey`, `.ots-yuzey-hover`, `.ots-liste-oge`, `.ots-sayi`, `.ots-belir` (+`--i` kademe, reduced-motion kapalı), yazdırma CSS. Tailwind v4'te `hover:` zaten `@media (hover:hover)` içinde üretilir.

### 2.2 Kontrast tablosu

Eşik: gövde metni ≥ 4.5 · büyük metin (≥18.66px bold / 24px) ve UI bileşen sınırı ≥ 3.0. Tümü hesaplandı, tümü geçti.

**Metin / koyu zemin**
| Çift | Kullanım | Oran | Eşik | Sonuç |
|---|---|---|---|---|
| ink / surface | kart metni | 13.07 | 4.5 | geçti |
| ink / bg | sayfa başlığı | 14.79 | 4.5 | geçti |
| ink / raised | kutucuk metni | 10.64 | 4.5 | geçti |
| ink / panel | menü / toast metni | 15.90 | 4.5 | geçti |
| soft / surface | açıklama | 8.01 | 4.5 | geçti |
| soft / bg | sayfa açıklaması | 9.07 | 4.5 | geçti |
| soft / raised | notr rozet metni | 6.53 | 4.5 | geçti |
| soft / panel | pasif sekme, ikincil menü | 9.75 | 4.5 | geçti |
| soft / panel-hover | hover'da pasif metin | 8.30 | 4.5 | geçti |
| faint / surface | meta, placeholder, eksen | 6.49 | 4.5 | geçti |
| faint / bg | sayfa altı meta | 7.3 | 4.5 | geçti |
| faint / raised | Mini/Dagilim etiketi | 5.28 | 4.5 | geçti |
| gold-ink / surface | altın metin, hayalet düğme, ikon kutusu | 9.38 | 4.5 | geçti |
| gold-ink / bg | altın bağlantı zeminde | 10.61 | 4.5 | geçti |
| gold-ink / raised | ikon rengi kutucukta | 7.64 | 4.5 | geçti |
| gold-ink / panel | etkin sekme, avatar baş harfi | 11.41 | 4.5 | geçti |
| gold-ink / panel-hover | hover'da etkin metin | 9.71 | 4.5 | geçti |
| gold-ink / gold-tint | sari rozet, uyarı kartı bağlantısı | 8.02 | 4.5 | geçti |
| ink / gold-tint | vurgu Sayac değeri | 11.17 | 4.5 | geçti |
| soft / gold-tint | görev açıklama kutusu | 6.85 | 4.5 | geçti |
| faint / gold-tint | vurgu Sayac alt metni | 5.55 | 4.5 | geçti |
| ink / yesil-tint | tamamlanan görev kartı metni | 10.01 | 4.5 | geçti |
| soft / yesil-tint | tamamlanan görev konusu | 6.14 | 4.5 | geçti |
| ink / kirmizi-tint | kritik dikkat satırı | 11.73 | 4.5 | geçti |
| soft / kirmizi-tint | kritik satır açıklaması | 7.20 | 4.5 | geçti |
| ink / turuncu-tint | uyarı satırı | 10.83 | 4.5 | geçti |

**Düğmeler**
| Çift | Kullanım | Oran | Eşik | Sonuç |
|---|---|---|---|---|
| panel / gold | birincil düğme metni (lacivert üstüne altın) | 9.84 | 4.5 | geçti |
| panel / gold-hover | birincil hover | 11.37 | 4.5 | geçti |
| gold / surface | altın düğme kenarı (halkasız) | 8.08 | 3.0 | geçti — iç halka gerekmez |
| gold / bg | FAB kenarı (halkasız) | 9.15 | 3.0 | geçti — iç halka gerekmez |
| gold / panel | etkin sekme 2px çizgi, şerit, menü rozeti | 9.84 | 3.0 | geçti |
| gold-deep / surface | odak halkası, vurgu kart kenarı | 5.94 | 3.0 | geçti |
| ink / kirmizi-dolgu | dolu tehlike metni | 4.57 | 4.5 | geçti |
| kirmizi / surface | çerçeveli tehlike metni ve kenarı | 5.66 | 4.5 | geçti |
| ink / raised | sessiz düğme hover metni | 10.64 | 4.5 | geçti |
| line-strong / surface | girdi, ikincil düğme sınırı | 3.87 | 3.0 | geçti |
| line-strong / bg | giriş kartı dışı girdi | 4.38 | 3.0 | geçti |
| line-strong / raised | kutucuk içi girdi | 3.15 | 3.0 | geçti |
| faint / surface | girdi hover sınırı | 6.49 | 3.0 | geçti |
| line / surface | eski girdi sınırı | ~1.5 | 3.0 | **kaldı → girdi sınırı line-strong** |

**Durum rozetleri** (11–12px semibold → gövde eşiği uygulanır)
| Çift | Oran | Eşik | Sonuç |
|---|---|---|---|
| yesil / yesil-tint | 5.82 | 4.5 | geçti |
| turuncu / turuncu-tint | 5.96 | 4.5 | geçti |
| kirmizi / kirmizi-tint | 5.08 | 4.5 | geçti |
| gold-ink / gold-tint | 8.02 | 4.5 | geçti |
| soft / raised (notr) | 6.53 | 4.5 | geçti |
| yesil / surface | 7.59 | 4.5 | geçti |
| turuncu / surface | 7.19 | 4.5 | geçti |
| kirmizi / surface | 5.66 | 4.5 | geçti |

**İlerleme çubuğu** (dolgu / ray `line #35476E`, UI eşiği 3.0)
| Dolgu | Oran | Sonuç |
|---|---|---|
| yesil | 4.77 | geçti |
| gold (sari bandı) | 5.08 | geçti |
| turuncu | 4.52 | geçti |
| kirmizi | 3.56 | geçti |

**Dekoratif / muaf:** `line / surface` (kart kenarı, `divide-y`, ray — zemin farkı taşır); `panel-line / panel`; disabled düğme (%50 opaklık) WCAG'de muaf; iskelet blokları `bg-ots-raised`.

**Grafik serileri — DOĞRULANDI.** `GRAFIK_RENKLERI = ['#b4862b', '#2aa285', '#3e8bd8']` dataviz doğrulayıcısında `--mode dark --surface #1c2842` ile TÜM kontroller geçti (parlaklık bandı, kroma, CVD ayrımı ΔE 10.7, normal görüş 16.1, surface kontrastı ≥3). Daha canlı adaylar (`#f2b722/#3ad29a/#5aa6ff`, `#d0982a/#2db58c/#4b95e6`) parlaklık bandını aştı — **değiştirilmez**. Sıra altın → yeşil → mavi; grafik metinleri (eksen, değer, açıklama) seri rengini değil `faint`/`soft` tokenını giyer.

---

## 3. Tipografi ve boşluk ölçeği

Fontlar mevcut (root layout): **Outfit** (`font-display`) başlık ve büyük sayı, **Plus Jakarta Sans** (`font-sans`) gövde. Yeni font yok.

| Rol | Sınıf | Ağırlık | Not |
|---|---|---|---|
| Sayfa başlığı | `font-display text-[22px] sm:text-[26px] leading-tight tracking-[-0.02em]` | 700 | Alt çizgi kaldırılır |
| Üst çubuk başlığı (mobil) | `text-[17px] leading-none` | 700 | |
| Modal/sheet başlığı | `font-display text-[18px] tracking-[-0.01em]` | 700 | |
| Kart başlığı | `font-display text-[16px] tracking-[-0.01em]` | 700 | |
| Sayac değeri | `ots-sayi font-display text-[26px] sm:text-[28px] leading-none` | 700 | mobil 2×2'de `text-[24px]` |
| Gövde | `text-[15px] leading-[1.5]` | 400 | görev kartı ders adı 600 |
| Düğme | `text-[15px] leading-none` | 600 | 700 değil — yığılma azalır |
| Girdi | `text-[16px]` | 400 | **16px altı yasak** (iOS zoom) |
| Etiket / ikincil | `text-[13px] leading-snug` | 500 | |
| Meta / alt bilgi | `text-[12px]` | 400–500 | uppercase ve `tracking-wide` KALDIRILIR |
| Rozet | `text-[12px] leading-4` | 600 | |
| Sekme etiketi | `text-[11px] leading-none` | 500 | etkin 600 |
| Eksen etiketi (SVG) | `text-[11px]` | 400 | `text-[9px]` → 11px |

Kurallar: ekranda **11px altı metin yok** (`HaftaIzgarasi` `text-[8px]/[10px]`, `Grafik` `text-[9px]` düzeltilir; yalnızca `@media print` küçülebilir). Uppercase + geniş tracking etiket hiçbir yerde yok ("ucuz dashboard" hissi). Sayılar her yerde `ots-sayi` (tabular, `-0.02em`). Ağırlıklar yalnızca 400/500/600/700; 800 yok.

**Boşluk (4px ritim):** 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48. Kart iç boşluğu `p-4 sm:p-5`; kartlar arası `gap-4 sm:gap-5`; form alanları arası `gap-4`; liste satırı iç dikey `py-3`; sayfa yatay `px-4 sm:px-6`; sayfa üst `pt-4 sm:pt-8`; bölümler arası `space-y-6 sm:space-y-8`.

**Yarıçap:** `rounded-md` 6px rozet · `rounded-[10px]` düğme, girdi, ikon düğmesi, ikon kutusu, menü öğesi · `rounded-2xl` 16px kart, diyalog · `rounded-t-[20px]` sheet · `rounded-full` yalnızca avatar, nokta, gün çipi, ilerleme rayı, FAB.

**İkon (lucide):** gezinme 22px, kart başlığı 18px, satır içi/düğme 16–18px, `strokeWidth 2` (etkin sekme 2.5).

---

## 4. Bileşen reçeteleri

`components/ots/Parcalar.tsx` sabitleri tek kaynak; sayfalardaki elle yazılmış düğmeler/rozetler bunlara bağlanır.

### 4.1 Düğmeler
```
DUGME_TEMELI =
'inline-flex items-center justify-center gap-2 rounded-[10px] text-[15px] font-semibold leading-none min-h-11 px-4 select-none touch-manipulation transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-[var(--ease-ots)] active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ots-gold-deep focus-visible:ring-offset-2 focus-visible:ring-offset-ots-bg disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100'
```
| Sabit | Ek sınıflar | Kullanım |
|---|---|---|
| `DUGME_ALTIN` | `bg-ots-gold text-ots-panel shadow-[var(--shadow-ots-gold)] hover:bg-ots-gold-hover active:shadow-none` | Birincil. **Sayfa başına en fazla 1** (görev kartlarındaki "Tamamla" liste istisnası). |
| `DUGME_LACIVERT` | `bg-ots-raised text-ots-ink border border-ots-line-strong hover:bg-ots-line` | Segmented seçili, giriş dışı önemli onay. Altınla yan yana durmaz. |
| `DUGME_SESSIZ` | `bg-ots-surface text-ots-ink border border-ots-line-strong hover:border-ots-faint hover:bg-ots-raised` | İkincil. Metin **ink** (soft değil — solgun düğme pasif okunur). |
| `DUGME_HAYALET` | `min-h-11 px-2 -mx-2 text-[14px] text-ots-gold-ink hover:bg-ots-gold-tint rounded-lg` | "Tümü →", "Vazgeç", "Geri al". Metin bağlantısını 44px hedefe çıkarır. |
| `DUGME_TEHLIKE` | `bg-ots-surface text-ots-kirmizi border border-ots-kirmizi/50 hover:bg-ots-kirmizi-tint` | İlk tık (çerçeveli). |
| `DUGME_TEHLIKE_DOLU` | `bg-ots-kirmizi-dolgu text-ots-ink hover:bg-ots-kirmizi-hover` | Onay adımındaki gerçek silme. `brightness` filtresi YOK. |
| `DUGME_IKON` | `grid h-11 w-11 place-items-center rounded-[10px] border border-ots-line-strong bg-ots-surface text-ots-soft hover:bg-ots-raised hover:text-ots-ink` + temel odak sınıfları | Kapat, kalem, hafta okları, avatar çipi sarmalayıcısı. Mevcut `h-9 w-9` ve `p-1` kalem kaldırılır. |

Mobilde birincil/ikincil `w-full sm:w-auto`. Yükleniyor: metin sabit, sola `Loader2 size={16} className="animate-spin"` + `aria-busy` (genişlik zıplamaz). İkon 18px, `strokeWidth 2.25` (birincilde).

### 4.2 Kart (`Kart`)
```
section: 'rounded-2xl border border-ots-line bg-ots-surface shadow-ots p-4 sm:p-5'
başlık satırı: 'mb-4 flex items-start justify-between gap-3'
ikon kutusu: 'grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-ots-gold-tint text-ots-gold-ink'
h2: 'font-display text-[16px] font-bold tracking-[-0.01em] text-ots-ink'
alt: 'mt-0.5 text-[13px] leading-snug text-ots-faint'
```
`Kart` **sunucu bileşeni kalır** (whileInView eklenmez; bkz. §6 `Belir`). Mobilde `sag` slotu `flex-wrap` ile başlığın altına iner (`w-full sm:w-auto`).

**Kart-hover** (yalnızca tıklanabilir kartlar: `KonuKartlari`, öğrenci kartı): `ots-yuzey-hover` sınıfı → kenarlık `line-strong`, gölge `shadow-ots-hover`, 180 ms; **transform yok**. Dokunmatikte `active:bg-ots-raised` (100 ms). Tıklanabilir kartın tamamı `<Link>`.

### 4.3 Sayaç (`Sayac`)
```
kap: 'rounded-2xl border border-ots-line bg-ots-surface shadow-ots p-3.5 sm:p-4'
vurgu: 'border-ots-gold-deep/40 bg-ots-gold-tint'
etiket satırı: 'flex items-center gap-1.5 text-[12px] font-medium text-ots-faint' (ikon 16px, vurguda text-ots-gold-ink)
değer: 'ots-sayi mt-2 font-display text-[24px] sm:text-[28px] font-bold leading-none text-ots-ink'
alt: 'mt-1.5 text-[12px] text-ots-faint'
```
Sayı sayma animasyonu YOK.

### 4.4 Rozetler (`Rozet`, `DurumRozeti`, `Fark`)
```
taban: 'inline-flex items-center gap-1.5 rounded-md px-2 py-[3px] text-[12px] font-semibold leading-4 whitespace-nowrap'
notr:    'bg-ots-raised text-ots-soft'
yesil:   'bg-ots-yesil-tint text-ots-yesil'
sari:    'bg-ots-gold-tint text-ots-gold-ink'
turuncu: 'bg-ots-turuncu-tint text-ots-turuncu'
kirmizi: 'bg-ots-kirmizi-tint text-ots-kirmizi'
DurumRozeti noktası: 'h-1.5 w-1.5 rounded-full bg-current'   (shadow-[0_0_8px_currentColor] SİLİNİR)
Fark: 'ots-sayi inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[12px] font-semibold' + yesil/turuncu tint
```
Kenarlık yok, `rounded-full` yok. Metin etiketi her zaman var; nokta yalnızca destek.

### 4.5 Form alanı (`Alan`, `GIRDI`, `Sayi`, `<select>`, `<textarea>`)
```
GIRDI (normal): 'h-12 w-full rounded-[10px] border border-ots-line-strong bg-ots-surface px-3.5 text-[16px] text-ots-ink placeholder:text-ots-faint outline-none transition-[border-color,box-shadow] duration-150 hover:border-ots-faint'
odak:           'focus:border-ots-gold-deep focus:ring-2 focus:ring-ots-gold-deep/25'
hata:           'aria-invalid:border-ots-kirmizi aria-invalid:ring-2 aria-invalid:ring-ots-kirmizi/20'
etiket:         'text-[13px] font-medium text-ots-soft mb-1.5'  ("(isteğe bağlı)" text-ots-faint)
hata metni:     'mt-1.5 flex items-center gap-1 text-[13px] font-medium text-ots-kirmizi' + CircleAlert 14px
select:         GIRDI + 'appearance-none pr-10' + sarmalayıcıda 'pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ots-faint' ChevronDown 16px
textarea:       GIRDI (h-12 yerine 'min-h-28 py-3')
Sayi:           GIRDI + 'ots-sayi text-center font-semibold' ; inputMode="numeric" pattern="[0-9]*"
```
`GIRDI` yalnızca `Alan.tsx`'ten dışa aktarılır; `HaftaIzgarasi`, `GorevKarti`, `OgrenciSecici` kopyalarını siler. Alanlar arası `gap-4`. Sayı ızgarası görev tamamlamada `grid grid-cols-3 gap-3` (Soru/Doğru/Yanlış) + `grid-cols-2` (Boş/Süre). Öncelik gibi 2–3 seçenekli alanlar segmented control: `grid grid-cols-3 rounded-[10px] border border-ots-line-strong p-1 gap-1`, seçenek `h-10 rounded-[8px] text-[14px] font-semibold text-ots-soft`, seçili `bg-ots-raised text-ots-ink shadow-[inset_0_0_0_1px_var(--color-ots-line-strong)]`; `role="radiogroup"`.

### 4.6 Bildirim ve toast
Form içi `Bildirim` yalnızca **hata**: `'flex items-start gap-2 rounded-[10px] border border-ots-kirmizi/30 bg-ots-kirmizi-tint px-3.5 py-3 text-[14px] text-ots-kirmizi'` + `CircleAlert 16px`, `aria-live="polite"`. Başarı → `toast.success()` (sonner). `<Toaster richColors={false} duration={3200} visibleToasts={2} expand={false} toastOptions={{ className: '!rounded-xl !border-0 !bg-ots-panel !text-ots-panel-ink !shadow-ots-sheet', classNames: { description: '!text-ots-panel-soft', icon: '!text-ots-gold-bright' } }} />`. Konum mobil `top-center`, lg `bottom-right` — `OtsToaster` istemci sarmalayıcısı (`useMediaQuery`) `(panel)/layout.tsx`'e konur. `GorevFormu` ve `OgrenciFormu`'daki `setTimeout(kapat, 500/800)` kaldırılır: kaydedince anında kapat + toast.

### 4.7 Tablo satırı (md+)
```
sarmalayıcı: 'hidden md:block overflow-hidden rounded-2xl border border-ots-line bg-ots-surface shadow-ots'
thead th:    'h-11 px-4 text-left text-[12px] font-semibold text-ots-faint bg-ots-raised'  (uppercase yok)
tbody tr:    'min-h-14 border-b border-ots-line last:border-0 hover:bg-ots-raised transition-colors duration-150'
td:          'px-4 py-3 text-[14px] text-ots-ink'   sayısal: '+ ots-sayi text-right'
satır eylemi: DUGME_IKON (h-11 w-11) + aria-label
```
`min-w-[820px]` / `min-w-[640px]` ve yatay kaydırma silinir; md altında kart listesi (§5.4). Tablo ve kart aynı `satirVerisi(ogrenci)` dizisini tüketir.

### 4.8 İlerleme (`Ilerleme`)
```
ray:   'h-2 w-full overflow-hidden rounded-full bg-ots-line'   (bg-black/25 + ring silinir)
dolgu: 'h-full rounded-full' + { yesil:'bg-ots-yesil', sari:'bg-ots-gold-ink', turuncu:'bg-ots-turuncu', kirmizi:'bg-ots-kirmizi' }
```
Gradient yok. Yüzde metni her zaman yanında (`ots-sayi text-[13px] font-semibold text-ots-ink`). İlk mount'ta `motion.div initial={{width:0}} animate={{width}} transition={{duration:.6, ease:'easeOut'}}`; reduced-motion'da anında. `role="progressbar"` korunur.

### 4.9 Boş durum (`Bos`)
```
'rounded-2xl border border-dashed border-ots-line-strong/50 bg-ots-raised px-5 py-10 text-center'
ikon: 'mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full border border-ots-line bg-ots-surface text-ots-faint' (18px, strokeWidth 1.75)
başlık: 'font-display text-[15px] font-bold text-ots-ink'   açıklama: 'mx-auto mt-1 max-w-xs text-[14px] leading-relaxed text-ots-soft'
eylem (varsa): 'mt-4' DUGME_SESSIZ (boş ekran bağırmaz; sayfada zaten FAB/birincil varsa tekrar edilmez)
```

### 4.10 Modal (md+) ve bottom sheet (md altı) — tek `Modal.tsx`
```
useMediaQuery: useSyncExternalStore(subscribe, () => matchMedia('(min-width:768px)').matches, () => undefined)
masaustu === undefined → return null   (hydration'dan önce hiçbir dal render edilmez; modal zaten kullanıcı eylemiyle açılır)
```
**Diyalog (md+):**
```
perde:  'fixed inset-0 z-50 flex items-center justify-center bg-ots-overlay p-6'   (backdrop-blur YOK)
kutu:   'flex max-h-[calc(100dvh-3rem)] w-full max-w-lg flex-col rounded-2xl border border-ots-line bg-ots-surface shadow-ots-dialog'
başlık: 'flex shrink-0 items-start justify-between gap-4 border-b border-ots-line p-5' ; h2 'font-display text-[18px] font-bold tracking-[-0.01em] text-ots-ink' ; kapat DUGME_IKON
gövde:  'min-h-0 flex-1 overflow-y-auto overscroll-contain p-5'
eylem:  'sticky bottom-0 flex justify-end gap-3 border-t border-ots-line bg-ots-surface p-4'  → [Vazgeç sessiz] [Kaydet altın]; Sil en solda tehlike çerçeveli
```
Varsayılan `genislik` `max-w-lg` (eski `max-w-3xl` yalnızca konu listesi için prop ile). Giriş/çıkış motion `AnimatePresence`: `opacity 0→1, scale .97→1, y 8→0` 180 ms; çıkış 120 ms. Elle yazılmış odak tuzağı yalnızca bu dalda kalır.

**Bottom sheet (md altı, vaul):**
```
<Drawer.Root open={acik} onOpenChange={o => !o && kapat()} repositionInputs={false}>
 <Drawer.Portal>
  <Drawer.Overlay className="fixed inset-0 z-40 bg-ots-overlay" />
  <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-[20px] bg-ots-surface shadow-ots-sheet outline-none pb-[env(safe-area-inset-bottom)] motion-reduce:!transition-none">
   <div aria-hidden className="mx-auto mt-2.5 h-1 w-9 rounded-full bg-ots-line-strong/60" />
   <header className="flex items-start justify-between gap-3 border-b border-ots-line px-4 pb-3 pt-3">
     <Drawer.Title className="font-display text-[18px] font-bold text-ots-ink" /> <Drawer.Description className="text-[13px] text-ots-faint" /> + DUGME_IKON kapat (X görünür kalır — sürüklemeyi bilmeyen kullanıcı için)
   </header>
   <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
   /* form eylem çubuğu: 'sticky bottom-0 flex flex-col gap-2 border-t border-ots-line bg-ots-surface px-4 py-3' → Kaydet DUGME_ALTIN w-full h-12 üstte, Vazgeç DUGME_SESSIZ w-full altta; Sil en altta eylem çubuğunun DIŞINDA tehlike çerçeveli */
  </Drawer.Content>
 </Drawer.Portal>
</Drawer.Root>
```
`snapPoints` kullanılmaz (uzun form doğrudan `max-h-[92dvh]` açılır, içerik kendi içinde kayar). Onay diyalogları kısa sheet, iki düğme dikey: tehlike dolu üstte, Vazgeç altta. Çağıranlar (`HaftaIzgarasi`, `OgrenciListesi`, `DenemeFormu`…) değişmez.

### 4.11 Sekme çubuğu (`AltSekmeCubugu.tsx`, yeni)
```
nav:  'fixed inset-x-0 bottom-0 z-30 lg:hidden bg-ots-panel shadow-ots-sheet pb-[env(safe-area-inset-bottom)] transition-transform duration-150 data-[klavye=acik]:translate-y-full'
ul:   'grid h-14 grid-cols-5'
link: 'relative flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium text-ots-panel-soft aria-[current=page]:text-ots-gold-bright aria-[current=page]:font-semibold active:bg-white/[.06]'
etkin çizgi: <motion.span layoutId="sekme-aktif" className="absolute inset-x-4 top-0 h-0.5 rounded-b-full bg-ots-gold" />
ikon: 22px, etkin strokeWidth 2.5
rozet ("Daha fazla" / "Dikkat"): 'absolute right-[calc(50%-16px)] top-2 min-w-4 h-4 rounded-full bg-ots-gold px-1 text-[10px] font-bold leading-4 text-ots-panel'  (yalnızca rozet metni 10px; ondalık sayı, harf değil)
```
Etiketler ≤9 karakter: Ana Sayfa · Program · Konular · Denemeler · Daha fazla (öğrenci); Dashboard · Öğrenci · Program · Dikkat · Daha fazla (koç). Etkin = renk + kalınlık + çizgi + `aria-current`. Yuva ≥ 64×56 (320px'te bile).

**Üst çubuk (`UstCubuk.tsx`, lg altı):** `'sticky top-0 z-20 flex h-13 items-center justify-between border-b border-ots-line bg-ots-surface/90 px-4 backdrop-blur-md pt-[env(safe-area-inset-top)] data-[kaydi=true]:shadow-ots transition-shadow duration-220'` — sol: sayfa başlığı `text-[17px] font-bold text-ots-ink` (`usePathname` → menü eşlemesi), sağ: avatar çipi `grid h-9 w-9 place-items-center rounded-full bg-ots-panel text-[12px] font-bold text-ots-gold-bright` 44px hedef sarmalayıcıda → Profil/Çıkış sheet'i. Hamburger ve üstten açılan panel SİLİNİR. (`h-13` Tailwind v4 dinamik spacing = 52px.)

---

## 5. Mobil

### 5.1 Gezinme deseni — KESİN KARAR
**lg (1024) altında alt sekme çubuğu + "Daha fazla" sheet; lg+ kenar menü. Hamburger yok.** CSS ile dallanır (`lg:hidden` / `hidden lg:flex`), JS media query yok → hydration sorunu yok.

"Daha fazla" → vaul sheet: `grid grid-cols-2 gap-3` kutucuklar `'flex h-[72px] flex-col items-center justify-center gap-1.5 rounded-xl border border-ots-line bg-ots-raised text-[13px] font-medium text-ots-ink active:bg-ots-line/60'` (ikon 22px `text-ots-gold-ink`), etkin kutucuk `border-ots-gold-deep/40 bg-ots-gold-tint`; Onaylar kutucuğunda sayı rozeti; altta `DUGME_SESSIZ w-full text-ots-kirmizi` Çıkış. Sheet açıkken etkin sayfa "Daha fazla" içindeyse o yuva etkin görünür.

Klavye açıkken (`useKlavyeAcik`: `visualViewport.height < innerHeight * 0.75`) alt çubuk ve FAB `translate-y-full` ile gizlenir (Android'de klavye üstünde yüzen çubuk sorunu).

### 5.2 Breakpoint tablosu (Tailwind v4 varsayılanları)
Kural: **içerik desenleri `md` (768), gezinme ve 4 sütun `lg` (1024)'te değişir; `sm` (640) yalnızca boşluk/yazı boyu/düğme genişliği için kullanılır, hiçbir düzen deseni sm'de değişmez.** (640–767 çelişkisi böylece kapanır.)

| Aralık | Ad | Gezinme | Modal | Tablo | Sayaç | Hafta ızgarası | Grafikler (rapor) | İçerik |
|---|---|---|---|---|---|---|---|---|
| < 768 | telefon | alt sekme + üst çubuk | bottom sheet | kart listesi | `grid-cols-2` | gün şeridi + dikey liste | sekmeli tek kart | `px-4`, tek sütun |
| 768–1023 | tablet | alt sekme + üst çubuk | merkez diyalog | tablo | `md:grid-cols-4` | gün şeridi + dikey liste | sekmeli tek kart | `px-6`, `md:grid-cols-2` kartlar |
| ≥ 1024 | masaüstü | kenar menü w-64 | merkez diyalog | tablo | 4 sütun | 4×2 ızgara | `lg:grid-cols-3` | `max-w-6xl px-6` |

`app/takip/layout.tsx`:
```ts
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#FFFFFF', interactiveWidget: 'resizes-content' };
```
(Next 16 `generate-viewport.md` doğrulandı: `viewportFit`, `themeColor`, `interactiveWidget` destekli. `maximumScale`/`userScalable:false` KONMAZ.) `(auth)/layout.tsx` kendi `viewport.themeColor = '#0F172A'` dışa aktarır — iç layout'un dış layout'u ezdiği uygulamada doğrulanacak. Kök `<div className="ots-kok flex min-h-dvh flex-col bg-ots-bg">` (`min-h-screen` → `min-h-dvh`).

### 5.3 Yapışkan krom bütçesi (düzeltme)
**Her sayfada en fazla bir yapışkan üst öğe.** Üst çubuk varsayılan `sticky`; kendi yapışkan şeridi olan sayfalarda (`/takip/program`, `/takip/programlar`, `/takip/rapor`, `/takip/haftalik`) `UstCubuk` `position: static` olur (`YAPISKAN_SERITLI_SAYFALAR` sabiti, `usePathname`) ve şerit `top-0`'a oturur. Sonuç: 667px ekranda sabit krom en fazla 52 (şerit) + 56 (alt çubuk) + safe-area ≈ 108–140px, %25 değil ~%18.

### 5.4 Ana yapıların mobil davranışı

**Kart:** `p-4`, `gap-4`, tam genişlik; `sag` slotu başlığın altına iner; tıklanabilir kart `active:bg-ots-raised`. Uzun listelerde `.ots-liste-oge`.

**Tablo → kart listesi (`md:hidden`):**
- `OgrenciListesi` kartı: `'flex min-h-[72px] items-center gap-3 rounded-2xl border border-ots-line bg-ots-surface p-4 shadow-ots active:bg-ots-raised'` → 40px avatar çipi (`bg-ots-panel text-ots-gold-bright`), orta: `adSoyad text-[15px] font-semibold text-ots-ink` + `text-[12px] text-ots-faint` "{sınıf} · {sınavTuru} · {hedef}" + rozetler `mt-1.5 flex gap-1.5`, sağ: `DUGME_IKON` kalem (`stopPropagation`). Kart `<Link>` detaya. Üstte arama `GIRDI h-12` (ad filtresi, istemci tarafı).
- `OgrenciTablosu` (dashboard) kartı: üst satır ad + `DurumRozeti`; `Ilerleme` + `%uyum` (`ots-sayi text-[15px] font-bold`) sağda; alt `grid grid-cols-3 text-center` Soru/Çalışma/Konu (`text-[13px]`, değer `font-semibold`).
- Liste `flex flex-col gap-3`; 20+ kayıtta "Daha fazla göster" `DUGME_SESSIZ w-full` (sonsuz kaydırma yok).

**4×2 haftalık ızgara (`HaftaIzgarasi`, lg altı):**
1. **Gün şeridi** `'sticky top-0 z-10 -mx-4 bg-ots-bg/95 px-4 py-2 backdrop-blur-sm yazdirma-disi'` → `'flex gap-2 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none]'`; 8 çip (Pzt…Paz + Not) `'snap-start shrink-0 flex h-11 min-w-11 items-center gap-1.5 rounded-full border border-ots-line-strong bg-ots-surface px-3 text-[13px] font-semibold text-ots-soft'`; **bugün** `bg-ots-panel border-ots-panel text-ots-gold-bright`; **görünen gün** (IntersectionObserver `rootMargin:'-40% 0px -55% 0px'`) `border-ots-panel text-ots-ink` + `layoutId="gun-aktif"` alt çizgi; **tamamlanan gün** (düzeltme): 4px nokta yerine 14px `CheckCircle2` ikon `text-ots-yesil` + `aria-label="Pazartesi, 3/3 görev tamamlandı"`; kısmi gün "1/3" `text-[11px] text-ots-faint`. Dokunma → `scrollIntoView({behavior: reduced ? 'auto' : 'smooth', block:'start'})`.
2. **Gün kartları** `flex flex-col gap-3`; her gün `Kart scroll-mt-[64px]`, başlık "Pazartesi · 29 Eyl" + sağda `n/m` rozeti (geçmiş gün notr "geçti"); görevler `divide-y divide-ots-line`; satır `'flex min-h-12 items-center gap-3 py-2.5'` — koçta satırın tamamı dokunulabilir (düzenleme sheet'i; gizli kalem kaldırılır), öğrencide satır tamamlama formunu inline açar. Mobilde ızgara + ayrı görev listesi çift gösterimi KALDIRILIR: tek gruplu liste.
3. **Bugün odağı:** `buHaftaMi` ise mount'ta bugün kartına `scrollIntoView({block:'start', behavior:'instant'})`; kart `border-ots-gold-deep/40 bg-ots-gold-tint`.
4. "Görev ekle" (koç) her gün kartının altında **her zaman görünür**: `'h-11 w-full rounded-[10px] border border-dashed border-ots-line-strong/60 text-[14px] font-semibold text-ots-gold-ink active:bg-ots-gold-tint'`. lg+'da `opacity-60 group-hover:opacity-100` (hiç görünmez olmaz).
5. Not kutusu 8. kart, `textarea min-h-28 text-[16px]`.
6. Hafta gezgini `grid grid-cols-[44px_1fr_44px] gap-2 items-center` — `DUGME_IKON` oklar, orta `text-[14px] font-semibold text-center`, altında "Bu hafta" `DUGME_HAYALET`.
7. Şablon başlığı `hidden lg:grid`; "PDF indir" `DUGME_SESSIZ w-full` sayfa başında. `@media print` kuralları dokunulmaz; gün şeridi, alt çubuk, FAB, üst çubuk `yazdirma-disi`. lg+ mevcut 4×2 düzen (`min-h-[200px]`, hücre `rounded-2xl border border-ots-line bg-ots-surface p-3.5`).

**Modal:** md altı vaul sheet (§4.10). `GorevFormu` mobil düzeni: Ders + Görev türü tek sütun, Hedef soru / Süre `grid-cols-2`, Başlangıç / Bitiş `grid-cols-2`, Açıklama tam, Öncelik segmented. iOS klavye: `max-h-[92dvh]` + `repositionInputs={false}` + `interactive-widget=resizes-content`; gerçek cihazda test; yedek plan klavye açıkken sheet `h-[100dvh]`.

**Form:** girdiler `h-12 text-[16px]`, tam genişlik, `gap-4`; birincil `w-full h-12`; sayı alanları 3+2 ızgara; select `h-12`; hata metni girdinin hemen altında.

**Sayaç ızgarası:** `grid grid-cols-2 gap-3 md:grid-cols-4` — yatay kaydırıcı REDDEDİLDİ (4 sayı tek bakışta). Rapor "Son 30 gün" iç sayaçları da 2×2.

**Grafik:** `yukseklik=150`, `w-full`; `rect` hedefleri `onTouchStart` ile `setEtkin`, `onTouchEnd`/`onMouseLeave` 1500 ms sonra temizler; balon `'rounded-[10px] bg-ots-panel px-3 py-2 text-[12px] text-ots-panel-ink shadow-ots-sheet'`; eksen `fill-ots-faint text-[11px]`; ızgara `stroke-ots-line`; nokta halkası `stroke-[var(--color-ots-surface)]`.

### 5.5 FAB (tek elle erişim)
Sayfada tek ana eylem varsa (koç Öğrenciler: "Öğrenci ekle"; öğrenci Program: "Serbest çalışma"; Denemeler: "Deneme ekle") `'fixed right-4 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.75rem)] z-30 grid h-14 w-14 place-items-center rounded-full bg-ots-gold text-ots-panel shadow-[var(--shadow-ots-gold)] lg:hidden'` + `Plus 24px strokeWidth 2.5` + `aria-label`. İç halka gerekmez (gold/bg 9.15). Sayfa başına en fazla 1; FAB varsa `SayfaBasi`'nda aynı eylem düğmesi mobilde gizlenir (`hidden lg:inline-flex`).

### 5.6 Safe-area ve kaydırma
- Alt çubuk, sheet, FAB `env(safe-area-inset-bottom)`; üst çubuk `env(safe-area-inset-top)`; `<main>` `pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]`.
- `<main>` alt boşluk `pb-[calc(3.5rem+env(safe-area-inset-bottom)+1rem)] lg:pb-8`.
- `body` zemini `bg-ots-bg` (aşırı kaydırmada beyaz kenar yok); pull-to-refresh korunur (`overscroll-behavior` sayfada varsayılan); sheet/modal gövdesi `overscroll-contain`.
- `backdrop-blur` yalnızca üst çubuk (52px) ve gün şeridi; kart/perde/modal'da yok.
- `(panel)/loading.tsx`: 4 sayaç + 2 kart iskeleti `animate-pulse rounded-2xl bg-ots-line/70`.

### 5.7 Dokunma hedefleri
Tüm etkileşimliler `min-h-11` (44px); ikon düğmeleri `h-11 w-11`; girdiler `h-12`; sekme yuvaları ≥64×56; gün çipleri 44; FAB 56; liste satırları `min-h-12`, öğrenci kartı `min-h-[72px]`; metin bağlantıları `DUGME_HAYALET`; komşu hedefler arası ≥ `gap-2`. Rozetler etkileşimsiz (hedef gerekmez). Checkbox/radio görsel 20–24px, dokunma alanı satırın tamamı (`<label>` sarar).

---

## 6. Hareket

İlke: tek easing `var(--ease-ots)`, tek yön (aşağıdan yukarı 8–12px), üç süre: **150 ms** dokunma geri bildirimi · **220 ms** durum değişimi · **300 ms** giriş. Yalnızca `transform` ve `opacity` (istisna: ilerleme `width` ve akordeon `height`, tek seferlik). `(panel)/layout.tsx` içinde `<MotionConfig reducedMotion="user">` sarmalayıcısı (istemci bileşeni).

| Etkileşim | Animasyon | Süre / easing | Araç |
|---|---|---|---|
| Düğme basma | `scale .98` + arkaplan rengi | 150 ms ease-ots | CSS `active:` |
| Düğme/girdi hover | renk, kenarlık | 150 ms | CSS (Tailwind v4 hover zaten `hover:hover`) |
| Kart hover (tıklanabilir, masaüstü) | kenarlık `line-strong`, gölge | 180 ms | CSS `.ots-yuzey-hover` |
| Odak halkası | anında | 0 ms | CSS |
| Sayfa girişi | `.ots-belir` opacity 0→1, y 8→0; kart başına `--i × 40 ms` kademe, en fazla 6 | 300 ms ease-ots | CSS `animation-delay: calc(var(--i)*40ms)` |
| İlk ekranın altındaki kartlar (yalnızca rapor, öğrenci detay) | opacity 0→1, y 12→0, `once:true, amount:.2` | 300 ms | motion `Belir` istemci sarmalayıcısı (`Kart` sunucu kalır); reduced'da `initial={false}` |
| Sekme / kenar menü etkin göstergesi | çizgi/şerit kayar | spring `stiffness 500, damping 40` | motion `layoutId="sekme-aktif"` / `"menu-aktif"`; reduced'da statik |
| Gün şeridi etkin çip | alt çizgi kayar | aynı spring | motion `layoutId="gun-aktif"` |
| Liste ekleme/silme (görev, dikkat) | `initial {opacity:0,y:8}` → `{opacity:1,y:0}`; exit `{opacity:0,height:0}` | 220 ms | motion `AnimatePresence initial={false}` |
| Görev tamamlandı | kart zemini surface→yesil-tint; rozet `scale .8→1` | 220 ms | CSS `transition-colors` + motion; konfeti/parıltı YOK |
| Tamamlama formu açılışı (inline) | `height 0→auto, opacity` | 220 ms | motion `AnimatePresence` |
| İlerleme çubuğu | width 0→değer, yalnızca ilk mount | 600 ms easeOut | motion `animate={{width}}` |
| Modal (md+) | opacity 0→1, scale .97→1, y 8→0 / çıkış | 180 / 120 ms | motion `AnimatePresence` |
| Bottom sheet | alttan kayma, sürükleyerek kapatma, perde fade | vaul varsayılanı (~500 ms spring) | vaul |
| Toast | sonner varsayılanı | ~400 ms | sonner |
| FAB gizle/göster | kaydırma yönüne göre `y: 0 ↔ 96` (12px eşik, rAF throttle) | 150 ms | motion |
| Alt çubuk / FAB klavye açıkken | `translate-y-full` | 150 ms | CSS `data-[klavye=acik]` |
| Üst çubuk kaydırınca | `border-b` → `shadow-ots` (`data-kaydi`, IntersectionObserver sentinel) | 220 ms | CSS; scroll listener yok |
| Grafik çizgisi ilk görünüm | `pathLength 0→1` | 600 ms easeOut, `once` | motion `motion.path`; reduced'da kapalı |
| Yükleniyor | `Loader2 animate-spin`; iskelet `animate-pulse` 1.6 s | — | CSS |
| Sayaç değeri | **animasyon yok** | — | — |

**Scroll efektleri (bilinçli sınır):** yalnızca (1) üst çubuk gölgesi, (2) gün şeridi etkin çip, (3) `Belir` once, (4) FAB gizle. Parallax, scroll-scrub, blur-on-scroll, kaydırmaya bağlı opaklık YOK. `html{scroll-behavior:smooth}` portfolyoda kalır; `.ots-kok{scroll-behavior:auto}`.

**Reduced motion:** mevcut global `@media (prefers-reduced-motion: reduce){*{animation-duration:.01ms!important; transition-duration:.01ms!important}}` kalır (vaul ve sonner inline geçişlerini de sıfırlar); `.ots-belir{animation:none}`; `motion-reduce:active:scale-100`; `MotionConfig reducedMotion="user"` → layoutId/whileInView/AnimatePresence anında; `scrollIntoView` `behavior:'auto'`; grafik `pathLength` kapalı; `useReducedMotion()` true ise FAB gizleme yerine hep görünür.

---

## 7. Kütüphaneler

| Kütüphane | Karar | Gerekçe |
|---|---|---|
| **vaul ^1.1.2** (kurulu) | KULLAN | md altında `Modal` → bottom sheet: sürükleyerek kapatma, tutamaç, Radix Dialog tabanlı odak tuzağı/Escape/aria-modal/body kilidi; "Daha fazla" ve Profil sheet'leri. Elle yazımı 300+ satır + iOS klavye hataları. React 19 uyumlu. |
| **sonner ^2.0.8** (kurulu) | KULLAN | Başarı bildirimleri form içinden çıkar; aria-live hazır; mobil top-center alt çubukla çakışmaz; reduced-motion'ı kendisi okur; ~3 KB. |
| **motion ^12** (kurulu) | KULLAN (sınırlı) | Yalnızca `layoutId` (sekme/menü/gün çipi), `AnimatePresence` (liste çıkışı, modal, akordeon), `whileInView once` (`Belir`), ilerleme width, FAB, `MotionConfig`. Geri kalan hareket CSS. |
| **lucide-react** (kurulu) | KULLAN | İkon seti değişmez; yeni: `CheckCircle2`, `CircleAlert`, `ChevronDown/Left/Right`, `Loader2`, `MoreHorizontal`, `Plus`. |
| tailwind-merge / clsx / cva | KURMA | 15 bileşenlik sistemde sınıf sabitleri yeter. |
| Radix / shadcn | KURMA | vaul zaten Radix Dialog getiriyor; ikinci diyalog sistemi çakışır. |
| Recharts / Chart.js | KURMA | Mevcut SVG çizgi grafiği yalnızca renk/dokunma/eksen düzeltmesi alır. |
| Embla / Swiper | KURMA | Tek yatay kaydırma (gün şeridi) CSS `scroll-snap` ile. |
| number-flow / countup | KURMA | Sayı sayma animasyonu yapılmıyor. |

**Yeni kütüphane: YOK.**

---

## 8. Sayfa sayfa notlar

**Giriş (`(auth)/layout.tsx`, `GirisFormu`, `KayitFormu`)** — `min-h-dvh bg-ots-bg`; üstte `h-[40vh] min-h-[220px] bg-ots-panel` blok: "OH" karesi `h-11 w-11 rounded-[10px] bg-ots-gold text-ots-panel font-display font-bold` + "OnurrHocam" `text-[22px] font-bold text-ots-panel-ink` + slogan `text-[14px] text-ots-panel-soft` (italik değil); "← Siteye dön" `DUGME_HAYALET text-ots-panel-soft`. Kart `-mt-16 mx-4 max-w-[400px] sm:mx-auto rounded-2xl bg-ots-surface p-6 sm:p-8 shadow-ots-dialog`; girdiler `h-12 text-[16px]`; Giriş `DUGME_ALTIN w-full h-12`; "Kayıt ol" `DUGME_HAYALET`. Klavye açılınca kart görünür kalsın: `items-start`, blok yüksekliği `dvh` tabanlı. themeColor `#0F172A`.

**Dashboard (koç, `Panel.tsx`)** — Sıra: sayfa başı → onay bekleyen bandı (`border border-ots-gold-deep/40 bg-ots-gold-tint rounded-2xl p-4`, metin ink, eylem `DUGME_HAYALET` → mobilde `DUGME_SESSIZ w-full`) → 4 sayaç 2×2 → Dikkat listesi (kritik satır: `bg-ots-kirmizi-tint` + sol 3px `bg-ots-kirmizi` şerit + "Kritik" rozeti) → Öğrenci tablosu (md altı kart). "Öğrenciler" bağlantısı `DUGME_SESSIZ` (birincil değil). Sayfa başına 1 birincil: yok (FAB de yok — dashboard salt okunur).

**Öğrenci ana sayfa (`AnaSayfa.tsx`)** — Selam `text-[22px]` + `DurumRozeti` yanında → 4 sayaç 2×2 → **Bugünün programı** (`GorevKarti` listesi; her "Tamamla" `DUGME_ALTIN h-11 w-full sm:w-auto` — liste istisnası) → "Serbest çalışma ekle" `DUGME_SESSIZ w-full h-11` → Bu hafta (Ilerleme + %uyum) / Konu ilerlemen `lg:grid-cols-2`. Görev kartı bekleyen `border-ots-line bg-ots-surface`, tamamlanan `border-ots-yesil/30 bg-ots-yesil-tint` + "Tamamlandı" rozeti + `CheckCircle2`; açıklama kutusu `rounded-lg bg-ots-gold-tint px-3 py-2 text-[13px] text-ots-soft`; meta `flex-wrap gap-x-3 text-[12px] text-ots-faint`; inline tamamlama formu `mt-3 border-t border-ots-line pt-3`, Sayı ızgarası 3+2, Kaydet `w-full`.

**Öğrenciler tablosu (`OgrenciListesi`)** — md altı kart listesi + arama; md+ tablo (`hidden md:block`); tek `satirVerisi()`; FAB "Öğrenci ekle" (mobil), `SayfaBasi` düğmesi `hidden lg:inline-flex`; kalem `DUGME_IKON`; Aktif/Pasif ve Hesap var/yok rozetleri metinli.

**Programlar ızgarası (`/programlar`, `HaftaIzgarasi` koç modu)** — `OgrenciSecici` `h-12 w-full` select, gün şeridiyle aynı yapışkan blokta (`sticky top-0`, üst çubuk statik); lg altı gün şeridi + dikey liste; satır dokun → düzenleme sheet; "Görev ekle" her gün altında görünür; hafta gezgini `[44px_1fr_44px]`; PDF indir sessiz tam genişlik; lg+ 4×2 ızgara; yazdırma CSS dokunulmaz.

**Rapor (`/rapor`, `/haftalik`)** — Mobil sıra: hafta gezgini (yapışkan `top-0`, üst çubuk statik) → `OgrenciSecici` (koç, aynı blokta) → 4 sayaç 2×2 → **Koç değerlendirmesi** (öğrencide 2. sıra) → "Geçen haftaya göre" 3 satır `divide-y` (etiket sol, değer+`Fark` sağ, `min-h-14`) → 3 çizgi grafiği **sekmeli tek kart** (segmented `Uyum | Soru | Süre` `h-11`, `CizgiGrafigi yukseklik=150`; `AnimatePresence mode="wait"` 160 ms) → Soru dağılımı `grid-cols-2 md:grid-cols-4` → Derslere göre / Ders uyumu (etiket `w-24 truncate`, değer `w-14 text-right ots-sayi`) → Yanlış analizi → Denemeler → Tamamlanmamış görevler. lg+ 3 grafik yan yana. Değerlendirme `textarea min-h-32 text-[16px]`, Kaydet `w-full sm:w-auto`.

**Konu kartları (`KonuKartlari`, `/konular`)** — Genel `Ilerleme` + `Sayac` üstte; ders kartları `grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4`, kart `ots-yuzey-hover` tıklanabilir: ders adı `text-[15px] font-bold`, `%` `ots-sayi text-[22px]`, `Ilerleme`, "n/m konu" `text-[12px] text-ots-faint`. Dokun → konu listesi sheet (`max-h-[92dvh]`), satırlar `min-h-12 flex items-center gap-3 px-1` `<label>` sarar, checkbox 22px `accent-[var(--color-ots-yesil)] rounded`, durum rozeti metinli; başlıkta arama `GIRDI h-11`. md+ `genislik="max-w-2xl"` diyalog.

**Denemeler (`/denemeler`, `DenemeFormu`)** — Liste kart: üst satır deneme adı + tarih (`text-[12px] text-ots-faint`), alt satır net `ots-sayi text-[22px] font-bold` + D/Y/B `grid grid-cols-3 text-center text-[13px]`; `Fark` önceki denemeye göre. Grafik kartı üstte (`CizgiGrafigi`), dokunmatik balon. "Deneme ekle" FAB (öğrenci) / `SayfaBasi` düğmesi lg. Form sheet'te: ad + tarih `grid-cols-2`, ders bazlı D/Y/B `Sayi` `grid-cols-3`, Kaydet yapışkan. Silme iki adım (çerçeveli → dolu).

**Ayarlar / Profil (`/ayarlar`, `/profil`, `SifreFormu`)** — Tek sütun `max-w-2xl`; her bölüm bir `Kart` (Profil bilgileri, Şifre, Bildirimler); girdiler `h-12`; her kartın Kaydet'i `DUGME_ALTIN w-full sm:w-auto` (sayfa başına 1 birincil kuralı istisnası: bölüm formları bağımsız, ama aynı anda ekranda en fazla 1 görünür olacak şekilde kartlar arası `gap-6`); "Çıkış yap" ve "Hesabı pasifleştir" en altta ayrı kart, `DUGME_TEHLIKE` → onay sheet'i. Başarı toast.

**Kenar menü (lg+, `KenarMenu`)** — `w-64 bg-ots-panel p-3 border-r-0`; marka "OH" `bg-ots-gold text-ots-panel` düz; öğe `'flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[14px] font-medium text-ots-panel-soft hover:bg-white/[.06] hover:text-ots-panel-ink'`; etkin `bg-white/[.08] text-ots-gold-bright font-semibold` + `motion.span layoutId="menu-aktif"` sol 3px `bg-ots-gold rounded-r-full`; rozet `bg-ots-gold text-ots-panel rounded-md min-w-5 h-5 text-[11px] font-bold`; Çıkış hayalet, hover kırmızı metin.

---

## 9. Yapılmayacaklar (anti-pattern'ler)

1. Gradyan dolgu, `inset` parlaklık, renkli/altın gölge (dinlenme hâlindeki birincil düğme ve FAB `shadow-ots-gold` hariç), `filter: brightness()` — hiçbir yüzeyde.
2. `rounded-full` rozet, `rounded-2xl` düğme/girdi; `shadow-[0_0_8px_currentColor]` neon nokta.
3. Uppercase + `tracking-wide` etiketler; italik slogan ekranda; 11px altı metin.
4. `line` (#35476E) ile girdi/düğme sınırı; `faint`'ten koyu placeholder; `line-strong`'dan sönük odaklanmamış girdi kenarlığı.
5. Altın dolgu üstünde açık metin (`text-ots-ink`/`text-white`) — altın üstü metin daima `text-ots-panel`; `kirmizi` (#FF7676) ile dolu düğme (dolgu `kirmizi-dolgu`); `bg-ots-gold/10` gibi opaklıklı vurgu zemini (`gold-tint` kullan).
6. Renk tek başına anlam: rozet metinsiz, sekme etiketsiz, tamamlanan gün yalnızca nokta, hata yalnızca kırmızı çerçeve.
7. 44px altı dokunma hedefi (`h-9 w-9` kapat, `p-1` kalem, çıplak `<a>` bağlantı), `hover`'da beliren tek eylem yolu (dokunmatikte hover yok).
8. 16px altı girdi yazısı (iOS zoom); `min-h-screen`/`100vh` (dvh yerine); `maximumScale:1` / `userScalable:false`.
9. Hamburger menü; birden fazla yapışkan üst öğe; kaydırırken gizlenen alt sekme çubuğu; sayfa başına 1'den fazla FAB veya birincil düğme.
10. Mobilde `<table>` + `min-w-*` yatay kaydırma; 4 sayaç için yatay kaydırıcı; hafta ızgarasında 7 kartlık yatay karusel; 4×2'yi telefonda 2 sütuna sıkıştırma.
11. `sm:` ile düzen deseni değiştirme (yalnızca boşluk/yazı/genişlik).
12. Kart/perde/modal'da `backdrop-blur`; `will-change`; kaydırmaya bağlı sürekli animasyon (parallax, scrub); sayı sayma animasyonu; konfeti; 300 ms'den uzun etkileşim geçişi (sheet hariç); `width`/`height` dışı boyut animasyonu.
13. `whileInView`'i `Kart`'a doğrudan koymak (sunucu bileşenini istemciye çevirir) — yalnızca `Belir` sarmalayıcısı.
14. Modal dalını hydration öncesi seçmek (`undefined` → `null` kuralı atlanmaz); `setTimeout` ile modal kapatma; form içi başarı bildirimi (toast'a gider).
15. Hover renklerini hardcoded hex yazmak — yalnızca token (`gold-hover`, `panel-hover`, `kirmizi-hover`, `faint`).
16. `richColors` toast; sonner/MotionConfig/Toaster'ı root layout'a koymak (yalnızca `/takip`); portfolyo `--color-*` tokenlarına dokunmak; `body` kuralını `.ots-kok` dışına taşımak.
17. Tint'leri Tailwind `/10` opaklıkla üretmek (sabit hex kullan); turuncu tint'i %10 üstüne çıkarmak.
18. Yeni bağımlılık (tailwind-merge, cva, Radix, Recharts, Swiper, countup) eklemek.
19. Grafik seri renklerini doğrulamadan `sabitler.ts`'e yazmak; yazdırma stiline (`.yazdir-izgara`, `@page`) dokunmak; yeni mobil parçaya `yazdirma-disi` vermeyi unutmak.

---

### Ek A — Yargıç düzeltmeleri ve graft kaydı
| Bulgu | Çözüm | Bölüm |
|---|---|---|
| FAB `gold/bg` 1.93, ilerleme `gold/line` 1.63 (1.4.11) | FAB'a `gold-deep` iç halka (3.14); sari dolgu `gold-ink` (4.21) | §2.2, §4.8, §5.5 |
| Girdi/ikincil düğme sınırı `line` 1.33 | Yeni `line-strong #7A889F` (3.59/3.20/3.34) | §2.1, §4.1, §4.5 |
| 640–767 iki düzene atanmış | `sm` yalnızca boşluk; içerik `md`, gezinme/4 sütun `lg`; hafta ızgarası tek kırılım `lg` | §5.2 |
| Modal matchMedia SSR/hydration | `useSyncExternalStore` `getServerSnapshot → undefined` → `null` render | §4.10 |
| Hardcoded hover hex | `gold-hover`, `panel-hover`, `kirmizi-hover` tokenları | §2.1 |
| ~170px sabit krom | "Her sayfada en fazla bir yapışkan üst öğe"; şeritli sayfalarda üst çubuk statik | §5.3 |
| 4px yeşil nokta çok küçük | 14px `CheckCircle2` + aria-label + "n/m" metni | §5.4 |
| Tipografi sessiz | Outfit/Jakarta ölçeği, ağırlık kuralları, 11px tabanı | §3 |
| Amber "sarı uyarı" okunma riski | Hue ≈75° (sarı ≈95°+), ink metin + `gold-deep` halka ile çapalanır, 3 kullanım yeri kuralı | §1, §4.1 |
| `Kart`+whileInView istemciye döner | `Belir` sarmalayıcısı, `Kart` sunucu | §4.2, §6 |
| Graft (Ö2) | Parlatma katmanı tek hamlede silme; %10 tint kilidi; "sayfa başına 1 birincil"; ≤9 karakter etiket; `touch-action` | §2, §4.1, §4.11 |
| Graft (Ö3) | `satirVerisi()` tek kaynak; klavye açıkken çubuk gizleme; 10px-altı yasağı; "Daha fazla göster"; X düğmesi sheet'te kalır | §4.7, §5.1, §3, §5.4, §4.10 |