CREATE TABLE "kaynaklar" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ogrenci_id" uuid NOT NULL,
	"ders" text NOT NULL,
	"ad" text NOT NULL,
	"tur" text DEFAULT '' NOT NULL,
	"not_metni" text DEFAULT '' NOT NULL,
	"olusturma_zamani" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kullanicilar" ADD COLUMN "mezun" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "kullanicilar" ADD COLUMN "gecen_yil_siralama" integer;--> statement-breakpoint
ALTER TABLE "ogrenciler" ADD COLUMN "mezun" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ogrenciler" ADD COLUMN "gecen_yil_siralama" integer;--> statement-breakpoint
ALTER TABLE "kaynaklar" ADD CONSTRAINT "kaynaklar_ogrenci_id_ogrenciler_id_fk" FOREIGN KEY ("ogrenci_id") REFERENCES "public"."ogrenciler"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kaynaklar_ogrenci_idx" ON "kaynaklar" USING btree ("ogrenci_id","ders");--> statement-breakpoint
ALTER TABLE "ogrenciler" ADD CONSTRAINT "ogrenciler_siralama" CHECK ("ogrenciler"."gecen_yil_siralama" is null or "ogrenciler"."gecen_yil_siralama" > 0);