CREATE TABLE "ayarlar" (
	"anahtar" text PRIMARY KEY NOT NULL,
	"deger" text NOT NULL,
	"guncelleme_zamani" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "haftalik_degerlendirme" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ogrenci_id" uuid NOT NULL,
	"hafta_baslangic" date NOT NULL,
	"koc_degerlendirmesi" text DEFAULT '' NOT NULL,
	"gelecek_hedefler" text DEFAULT '' NOT NULL,
	"yazan" text DEFAULT '' NOT NULL,
	"guncelleme_zamani" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "haftalik_degerlendirme_tek" UNIQUE("ogrenci_id","hafta_baslangic")
);
--> statement-breakpoint
ALTER TABLE "haftalik_degerlendirme" ADD CONSTRAINT "haftalik_degerlendirme_ogrenci_id_ogrenciler_id_fk" FOREIGN KEY ("ogrenci_id") REFERENCES "public"."ogrenciler"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "haftalik_degerlendirme_idx" ON "haftalik_degerlendirme" USING btree ("ogrenci_id","hafta_baslangic");