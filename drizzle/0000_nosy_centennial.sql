CREATE TABLE "calisma" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gorev_id" uuid,
	"ogrenci_id" uuid NOT NULL,
	"tarih" date NOT NULL,
	"ders" text NOT NULL,
	"konu" text DEFAULT '' NOT NULL,
	"soru" integer DEFAULT 0 NOT NULL,
	"dogru" integer DEFAULT 0 NOT NULL,
	"yanlis" integer DEFAULT 0 NOT NULL,
	"bos" integer DEFAULT 0 NOT NULL,
	"sure" integer DEFAULT 0 NOT NULL,
	"not_metni" text DEFAULT '' NOT NULL,
	"kayit_zamani" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "calisma_gorev_id_unique" UNIQUE("gorev_id"),
	CONSTRAINT "calisma_negatif_olamaz" CHECK ("calisma"."soru" >= 0 and "calisma"."dogru" >= 0 and "calisma"."yanlis" >= 0 and "calisma"."bos" >= 0 and "calisma"."sure" >= 0),
	CONSTRAINT "calisma_dagilim" CHECK ("calisma"."dogru" + "calisma"."yanlis" + "calisma"."bos" <= "calisma"."soru")
);
--> statement-breakpoint
CREATE TABLE "deneme_detay" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deneme_id" uuid NOT NULL,
	"bolum" text NOT NULL,
	"dogru" integer DEFAULT 0 NOT NULL,
	"yanlis" integer DEFAULT 0 NOT NULL,
	"bos" integer DEFAULT 0 NOT NULL,
	"net" real DEFAULT 0 NOT NULL,
	CONSTRAINT "deneme_detay_tek" UNIQUE("deneme_id","bolum"),
	CONSTRAINT "deneme_detay_negatif_olamaz" CHECK ("deneme_detay"."dogru" >= 0 and "deneme_detay"."yanlis" >= 0 and "deneme_detay"."bos" >= 0)
);
--> statement-breakpoint
CREATE TABLE "denemeler" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ogrenci_id" uuid NOT NULL,
	"tarih" date NOT NULL,
	"deneme_adi" text NOT NULL,
	"tur" text NOT NULL,
	"sure" integer DEFAULT 0 NOT NULL,
	"toplam_net" real DEFAULT 0 NOT NULL,
	"degerlendirme" text DEFAULT '' NOT NULL,
	"yapilmasi_gerekenler" text DEFAULT '' NOT NULL,
	"kayit_zamani" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "denemeler_tur" CHECK ("denemeler"."tur" in ('TYT', 'AYT', 'LGS')),
	CONSTRAINT "denemeler_sure" CHECK ("denemeler"."sure" >= 0)
);
--> statement-breakpoint
CREATE TABLE "gorevler" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ogrenci_id" uuid NOT NULL,
	"tarih" date NOT NULL,
	"baslangic_saati" time,
	"bitis_saati" time,
	"ders" text NOT NULL,
	"konu" text DEFAULT '' NOT NULL,
	"alt_konu" text DEFAULT '' NOT NULL,
	"gorev_turu" text DEFAULT 'Soru çözümü' NOT NULL,
	"hedef_soru" integer DEFAULT 0 NOT NULL,
	"hedef_sure" integer DEFAULT 0 NOT NULL,
	"oncelik" text DEFAULT 'Normal' NOT NULL,
	"aciklama" text DEFAULT '' NOT NULL,
	"durum" text DEFAULT 'bekliyor' NOT NULL,
	"tamamlanma_zamani" timestamp with time zone,
	"olusturan" text DEFAULT '' NOT NULL,
	"olusturma_zamani" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gorevler_durum" CHECK ("gorevler"."durum" in ('bekliyor', 'tamamlandi', 'yapilmadi')),
	CONSTRAINT "gorevler_hedefler" CHECK ("gorevler"."hedef_soru" >= 0 and "gorevler"."hedef_sure" >= 0)
);
--> statement-breakpoint
CREATE TABLE "koc_notlari" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ogrenci_id" uuid NOT NULL,
	"tarih" date NOT NULL,
	"not_metni" text NOT NULL,
	"aksiyon" text DEFAULT '' NOT NULL,
	"takip_tarihi" date,
	"yazan" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kullanicilar" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ad" text NOT NULL,
	"soyad" text NOT NULL,
	"email" text NOT NULL,
	"sifre_hash" text NOT NULL,
	"rol" text DEFAULT 'ogrenci' NOT NULL,
	"durum" text DEFAULT 'beklemede' NOT NULL,
	"telefon" text DEFAULT '' NOT NULL,
	"olusturma_zamani" timestamp with time zone DEFAULT now() NOT NULL,
	"son_giris" timestamp with time zone,
	"basarisiz_deneme" integer DEFAULT 0 NOT NULL,
	"kilit_bitis" timestamp with time zone,
	CONSTRAINT "kullanicilar_email_unique" UNIQUE("email"),
	CONSTRAINT "kullanicilar_rol" CHECK ("kullanicilar"."rol" in ('koc', 'ogrenci')),
	CONSTRAINT "kullanicilar_durum" CHECK ("kullanicilar"."durum" in ('beklemede', 'aktif', 'pasif')),
	CONSTRAINT "kullanicilar_deneme" CHECK ("kullanicilar"."basarisiz_deneme" >= 0)
);
--> statement-breakpoint
CREATE TABLE "ogrenci_konu" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ogrenci_id" uuid NOT NULL,
	"konu_id" text NOT NULL,
	"durum" text DEFAULT 'Başlanmadı' NOT NULL,
	"ilk_calisma_tarihi" date,
	"tamamlanma_tarihi" date,
	"tekrar_tarihi" date,
	"soru_sayisi" integer DEFAULT 0 NOT NULL,
	"basari_yuzdesi" integer DEFAULT 0 NOT NULL,
	"not_metni" text DEFAULT '' NOT NULL,
	"guncelleme_zamani" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ogrenci_konu_tek" UNIQUE("ogrenci_id","konu_id"),
	CONSTRAINT "ogrenci_konu_durum" CHECK ("ogrenci_konu"."durum" in ('Başlanmadı', 'Çalışılıyor', 'Tamamlandı', 'Tekrar gerekli', 'Eksik', 'Deneme ile kontrol edildi')),
	CONSTRAINT "ogrenci_konu_soru" CHECK ("ogrenci_konu"."soru_sayisi" >= 0),
	CONSTRAINT "ogrenci_konu_yuzde" CHECK ("ogrenci_konu"."basari_yuzdesi" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "ogrenciler" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kullanici_id" uuid,
	"ad_soyad" text NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"telefon" text DEFAULT '' NOT NULL,
	"sinif" text DEFAULT '' NOT NULL,
	"sinav_turu" text DEFAULT 'YKS' NOT NULL,
	"alan" text DEFAULT 'Belirtilmedi' NOT NULL,
	"hedef" text DEFAULT '' NOT NULL,
	"hedef_universite" text DEFAULT '' NOT NULL,
	"hedef_bolum" text DEFAULT '' NOT NULL,
	"veli_adi" text DEFAULT '' NOT NULL,
	"veli_telefon" text DEFAULT '' NOT NULL,
	"baslangic_tarihi" date NOT NULL,
	"gunluk_soru_hedefi" integer DEFAULT 0 NOT NULL,
	"gunluk_sure_hedefi" integer DEFAULT 0 NOT NULL,
	"durum" text DEFAULT 'aktif' NOT NULL,
	"olusturma_zamani" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ogrenciler_kullanici_id_unique" UNIQUE("kullanici_id"),
	CONSTRAINT "ogrenciler_sinav_turu" CHECK ("ogrenciler"."sinav_turu" in ('YKS', 'LGS')),
	CONSTRAINT "ogrenciler_durum" CHECK ("ogrenciler"."durum" in ('aktif', 'pasif')),
	CONSTRAINT "ogrenciler_hedefler" CHECK ("ogrenciler"."gunluk_soru_hedefi" >= 0 and "ogrenciler"."gunluk_sure_hedefi" >= 0)
);
--> statement-breakpoint
CREATE TABLE "yanlis_analiz" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ogrenci_id" uuid NOT NULL,
	"deneme_id" uuid,
	"tarih" date NOT NULL,
	"ders" text DEFAULT '' NOT NULL,
	"konu" text DEFAULT '' NOT NULL,
	"neden" text NOT NULL,
	"adet" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "yanlis_analiz_adet" CHECK ("yanlis_analiz"."adet" > 0)
);
--> statement-breakpoint
ALTER TABLE "calisma" ADD CONSTRAINT "calisma_gorev_id_gorevler_id_fk" FOREIGN KEY ("gorev_id") REFERENCES "public"."gorevler"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calisma" ADD CONSTRAINT "calisma_ogrenci_id_ogrenciler_id_fk" FOREIGN KEY ("ogrenci_id") REFERENCES "public"."ogrenciler"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deneme_detay" ADD CONSTRAINT "deneme_detay_deneme_id_denemeler_id_fk" FOREIGN KEY ("deneme_id") REFERENCES "public"."denemeler"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "denemeler" ADD CONSTRAINT "denemeler_ogrenci_id_ogrenciler_id_fk" FOREIGN KEY ("ogrenci_id") REFERENCES "public"."ogrenciler"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gorevler" ADD CONSTRAINT "gorevler_ogrenci_id_ogrenciler_id_fk" FOREIGN KEY ("ogrenci_id") REFERENCES "public"."ogrenciler"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "koc_notlari" ADD CONSTRAINT "koc_notlari_ogrenci_id_ogrenciler_id_fk" FOREIGN KEY ("ogrenci_id") REFERENCES "public"."ogrenciler"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ogrenci_konu" ADD CONSTRAINT "ogrenci_konu_ogrenci_id_ogrenciler_id_fk" FOREIGN KEY ("ogrenci_id") REFERENCES "public"."ogrenciler"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ogrenciler" ADD CONSTRAINT "ogrenciler_kullanici_id_kullanicilar_id_fk" FOREIGN KEY ("kullanici_id") REFERENCES "public"."kullanicilar"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yanlis_analiz" ADD CONSTRAINT "yanlis_analiz_ogrenci_id_ogrenciler_id_fk" FOREIGN KEY ("ogrenci_id") REFERENCES "public"."ogrenciler"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yanlis_analiz" ADD CONSTRAINT "yanlis_analiz_deneme_id_denemeler_id_fk" FOREIGN KEY ("deneme_id") REFERENCES "public"."denemeler"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calisma_ogrenci_tarih_idx" ON "calisma" USING btree ("ogrenci_id","tarih");--> statement-breakpoint
CREATE INDEX "deneme_detay_deneme_idx" ON "deneme_detay" USING btree ("deneme_id");--> statement-breakpoint
CREATE INDEX "denemeler_ogrenci_tarih_idx" ON "denemeler" USING btree ("ogrenci_id","tarih");--> statement-breakpoint
CREATE INDEX "gorevler_ogrenci_tarih_idx" ON "gorevler" USING btree ("ogrenci_id","tarih");--> statement-breakpoint
CREATE INDEX "koc_notlari_ogrenci_tarih_idx" ON "koc_notlari" USING btree ("ogrenci_id","tarih");--> statement-breakpoint
CREATE INDEX "koc_notlari_takip_idx" ON "koc_notlari" USING btree ("takip_tarihi");--> statement-breakpoint
CREATE INDEX "kullanicilar_durum_idx" ON "kullanicilar" USING btree ("durum","olusturma_zamani");--> statement-breakpoint
CREATE INDEX "ogrenci_konu_ogrenci_idx" ON "ogrenci_konu" USING btree ("ogrenci_id");--> statement-breakpoint
CREATE INDEX "yanlis_analiz_ogrenci_tarih_idx" ON "yanlis_analiz" USING btree ("ogrenci_id","tarih");