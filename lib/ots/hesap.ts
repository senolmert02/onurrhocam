/**
 * Hesaplama katmanı — Apps Script sürümündeki `Reports.gs` karşılığı.
 *
 * Buradaki her fonksiyon **saftır**: veritabanına dokunmaz, "bugün"ü kendi
 * hesaplamaz, dışarıya durum yazmaz. Girdileri sorgu katmanı verir.
 * Bu yüzden tamamı test edilebilir ve veritabanı değişse bile aynen kalır.
 *
 * Girdi tipleri veritabanı satırlarının tamamı değil, yalnızca hesaplama için
 * gereken alanlardır; böylece sorgular sadece kullandıkları sütunları çeker.
 */

import { konuBul, katalogSayilari, type SinavTuru } from './konu-katalogu';
import { netDususVarMi, type DenemeGirdisi } from './net';
import { ESIKLER, konuTamamMi } from './sabitler';

/** Eşik ayarları — varsayılanı sabitler.ts, panelden değiştirilebilir. */
export type EsikAyarlari = typeof ESIKLER;
import {
  aralikta,
  gunEkle,
  gunFarki,
  haftaBasi,
  trTarih,
  trTarihKisa,
  type GunAnahtari,
} from './tarih';

/* -------------------------------------------------------------------- Girdiler */

export type GorevGirdisi = {
  id: string;
  tarih: GunAnahtari;
  ders: string;
  konu: string;
  gorevTuru: string;
  durum: string;
  hedefSoru: number;
  hedefSure: number;
};

export type CalismaGirdisi = {
  tarih: GunAnahtari;
  ders: string;
  soru: number;
  dogru: number;
  yanlis: number;
  bos: number;
  sure: number;
};

export type KonuGirdisi = {
  konuId: string;
  durum: string;
  tamamlanmaTarihi: GunAnahtari | null;
};

/* ------------------------------------------------------------------ Sayı işleri */

/** Sıfıra bölmeden korunan yüzde, bir ondalık. */
export function yuzde(pay: number, toplam: number): number {
  if (!toplam || toplam <= 0) return 0;
  return Math.round((pay / toplam) * 1000) / 10;
}

export function birOndalik(deger: number): number {
  return Math.round((Number(deger) || 0) * 10) / 10;
}

export type DurumBandi = {
  renk: 'yesil' | 'sari' | 'turuncu' | 'kirmizi';
  etiket: string;
};

/** Uyum yüzdesinin bandı. Renk tek başına anlam taşımaz; etiket her zaman gösterilir. */
export function uyumDurumu(deger: number, esikler: EsikAyarlari = ESIKLER): DurumBandi {
  if (deger >= esikler.UYUM_IYI) return { renk: 'yesil', etiket: 'Çok iyi' };
  if (deger >= esikler.UYUM_ORTA) return { renk: 'sari', etiket: 'İyi / geliştirilebilir' };
  if (deger >= esikler.UYUM_DUSUK) return { renk: 'turuncu', etiket: 'Dikkat edilmeli' };
  return { renk: 'kirmizi', etiket: 'Müdahale gerekli' };
}

/* ------------------------------------------------------------------ Özetleme */

export type DersOzeti = {
  ders: string;
  gorev: number;
  tamamlanan: number;
  uyum: number;
  hedefSoru: number;
  soru: number;
  sure: number;
  dogru: number;
  yanlis: number;
  bos: number;
};

export type EksikGorev = {
  id: string;
  tarih: GunAnahtari;
  tarihTr: string;
  ders: string;
  konu: string;
  gorevTuru: string;
};

export type Ozet = {
  baslangic: GunAnahtari;
  bitis: GunAnahtari;
  toplamGorev: number;
  /** Tarihi gelmiş görevler — uyum yüzdesinin paydası. */
  vadesiGelenGorev: number;
  tamamlanan: number;
  tamamlanmayan: number;
  gelecekGorev: number;
  uyum: number;
  durum: DurumBandi;
  hedefSoru: number;
  hedefSure: number;
  cozulenSoru: number;
  calismaSuresi: number;
  dogru: number;
  yanlis: number;
  bos: number;
  dersler: DersOzeti[];
  eksikGorevler: EksikGorev[];
};

/**
 * Bir tarih aralığının bütün sayıları.
 *
 * Uyum hesabında **geleceğe ait görevler paydaya girmez**: bugünden sonrası için
 * atanmış görevler henüz yapılmadığı için yüzdeyi haksız düşürmemeli.
 */
export function ozetle(girdi: {
  gorevler: readonly GorevGirdisi[];
  calismalar: readonly CalismaGirdisi[];
  baslangic: GunAnahtari;
  bitis: GunAnahtari;
  bugun: GunAnahtari;
  esikler?: EsikAyarlari;
}): Ozet {
  const { baslangic, bitis, bugun } = girdi;

  const sonuc: Ozet = {
    baslangic,
    bitis,
    toplamGorev: 0,
    vadesiGelenGorev: 0,
    tamamlanan: 0,
    tamamlanmayan: 0,
    gelecekGorev: 0,
    uyum: 0,
    durum: uyumDurumu(0, girdi.esikler),
    hedefSoru: 0,
    hedefSure: 0,
    cozulenSoru: 0,
    calismaSuresi: 0,
    dogru: 0,
    yanlis: 0,
    bos: 0,
    dersler: [],
    eksikGorevler: [],
  };

  const dersHaritasi = new Map<string, DersOzeti>();
  const ders = (ad: string): DersOzeti => {
    const anahtar = ad.trim() || 'Diğer';
    let kayit = dersHaritasi.get(anahtar);
    if (!kayit) {
      kayit = {
        ders: anahtar,
        gorev: 0,
        tamamlanan: 0,
        uyum: 0,
        hedefSoru: 0,
        soru: 0,
        sure: 0,
        dogru: 0,
        yanlis: 0,
        bos: 0,
      };
      dersHaritasi.set(anahtar, kayit);
      sonuc.dersler.push(kayit);
    }
    return kayit;
  };

  for (const gorev of girdi.gorevler) {
    if (!aralikta(gorev.tarih, baslangic, bitis)) continue;

    const d = ders(gorev.ders);
    const tamamlandi = gorev.durum === 'tamamlandi';

    sonuc.toplamGorev += 1;
    sonuc.hedefSoru += gorev.hedefSoru;
    sonuc.hedefSure += gorev.hedefSure;
    d.gorev += 1;
    d.hedefSoru += gorev.hedefSoru;

    if (tamamlandi) {
      sonuc.tamamlanan += 1;
      d.tamamlanan += 1;
    }

    if (gorev.tarih > bugun) {
      sonuc.gelecekGorev += 1;
    } else {
      sonuc.vadesiGelenGorev += 1;
      if (!tamamlandi) {
        sonuc.tamamlanmayan += 1;
        sonuc.eksikGorevler.push({
          id: gorev.id,
          tarih: gorev.tarih,
          tarihTr: trTarih(gorev.tarih),
          ders: gorev.ders,
          konu: gorev.konu,
          gorevTuru: gorev.gorevTuru,
        });
      }
    }
  }

  for (const calisma of girdi.calismalar) {
    if (!aralikta(calisma.tarih, baslangic, bitis)) continue;

    const d = ders(calisma.ders);
    sonuc.cozulenSoru += calisma.soru;
    sonuc.calismaSuresi += calisma.sure;
    sonuc.dogru += calisma.dogru;
    sonuc.yanlis += calisma.yanlis;
    sonuc.bos += calisma.bos;
    d.soru += calisma.soru;
    d.sure += calisma.sure;
    d.dogru += calisma.dogru;
    d.yanlis += calisma.yanlis;
    d.bos += calisma.bos;
  }

  sonuc.uyum = yuzde(sonuc.tamamlanan, sonuc.vadesiGelenGorev);
  sonuc.durum = uyumDurumu(sonuc.uyum, girdi.esikler);

  for (const d of sonuc.dersler) d.uyum = yuzde(d.tamamlanan, d.gorev);
  sonuc.dersler.sort((a, b) => b.soru - a.soru || b.gorev - a.gorev);
  sonuc.eksikGorevler.sort((a, b) => b.tarih.localeCompare(a.tarih));

  return sonuc;
}

/* ---------------------------------------------------------------- Konu takibi */

export type KonuIstatistigi = {
  genel: { toplam: number; tamamlanan: number; yuzde: number };
  dersler: { ders: string; toplam: number; tamamlanan: number; yuzde: number }[];
};

/**
 * Ders bazında konu tamamlama yüzdeleri.
 *
 * Toplam konu sayısı katalogdan (koddan) gelir, tamamlananlar öğrencinin
 * satırlarından. Öğrencinin dokunmadığı konu için satır yoktur — "Başlanmadı"
 * sayılır, boş satır üretilmez.
 */
export function konuIstatistikleri(
  konular: readonly KonuGirdisi[],
  sinavTuru: SinavTuru,
): KonuIstatistigi {
  const katalog = katalogSayilari(sinavTuru);

  const tamamlananlar = new Map<string, number>();
  let tamamToplam = 0;

  for (const kayit of konular) {
    if (!konuTamamMi(kayit.durum)) continue;

    const katalogKaydi = konuBul(kayit.konuId);
    // Katalogdan kaldırılmış ya da başka sınav türüne ait satırlar sayılmaz.
    if (!katalogKaydi || katalogKaydi.sinavTuru !== sinavTuru) continue;

    tamamlananlar.set(katalogKaydi.ders, (tamamlananlar.get(katalogKaydi.ders) ?? 0) + 1);
    tamamToplam += 1;
  }

  const dersler = Object.entries(katalog.dersler).map(([ders, toplam]) => {
    const tamamlanan = Math.min(tamamlananlar.get(ders) ?? 0, toplam);
    return { ders, toplam, tamamlanan, yuzde: yuzde(tamamlanan, toplam) };
  });

  const tamamlanan = Math.min(tamamToplam, katalog.toplam);
  return {
    genel: { toplam: katalog.toplam, tamamlanan, yuzde: yuzde(tamamlanan, katalog.toplam) },
    dersler,
  };
}

/** En son tamamlanan konunun tarihi; hiç yoksa boş metin. */
export function sonKonuTamamlama(konular: readonly KonuGirdisi[]): GunAnahtari | '' {
  let enSon: GunAnahtari | '' = '';
  for (const kayit of konular) {
    const tarih = kayit.tamamlanmaTarihi;
    if (tarih && tarih > enSon) enSon = tarih;
  }
  return enSon;
}

/* --------------------------------------------------------------------- Uyarılar */

/**
 * Kaç gündür hiç görev tamamlanmıyor?
 *
 * **Bugün sayılmaz.** Günü kapanmamış bir gün "yapılmadı" sayılamaz: Apps Script
 * sürümü bugünden başladığı için, dün görevini kaçırmış bir öğrenci sabah 09:00'da
 * "2 gündür görev tamamlamıyor" kritik uyarısı alıyordu. Sayım dünden başlar.
 *
 * Program atanmamış günler atlanır — o gün için tamamlanacak bir şey yoktu.
 */
export function hareketsizGun(
  gorevler: readonly GorevGirdisi[],
  bugun: GunAnahtari,
  taranacakGun = 14,
): number {
  const gunler = new Map<GunAnahtari, { toplam: number; tamam: number }>();

  for (const gorev of gorevler) {
    if (!gorev.tarih || gorev.tarih >= bugun) continue; // bugün ve sonrası hariç
    let gun = gunler.get(gorev.tarih);
    if (!gun) {
      gun = { toplam: 0, tamam: 0 };
      gunler.set(gorev.tarih, gun);
    }
    gun.toplam += 1;
    if (gorev.durum === 'tamamlandi') gun.tamam += 1;
  }

  let sayac = 0;
  for (let geri = 1; geri <= taranacakGun; geri++) {
    const gun = gunler.get(gunEkle(bugun, -geri));
    if (!gun) continue; // o gün program yok
    if (gun.tamam > 0) break; // en son çalıştığı güne geldik
    sayac += 1;
  }
  return sayac;
}

export type Uyari = {
  seviye: 'kritik' | 'uyari' | 'bilgi';
  mesaj: string;
};

/** Dikkat listesi kuralları. Eşikler `sabitler.ts` içinde. */
export function uyarilarUret(girdi: {
  hafta: Ozet;
  oncekiHafta: Ozet;
  gorevler: readonly GorevGirdisi[];
  calismalar: readonly CalismaGirdisi[];
  denemeler: readonly DenemeGirdisi[];
  konular: readonly KonuGirdisi[];
  bugun: GunAnahtari;
  esikler?: EsikAyarlari;
}): Uyari[] {
  const { hafta, oncekiHafta, bugun } = girdi;
  const esikler = girdi.esikler ?? ESIKLER;
  const uyarilar: Uyari[] = [];

  /* 1 — program uyumu */
  if (hafta.vadesiGelenGorev > 0) {
    if (hafta.uyum < esikler.UYUM_DUSUK) {
      uyarilar.push({
        seviye: 'kritik',
        mesaj: `Bu hafta program uyumu %${hafta.uyum} (${hafta.tamamlanan}/${hafta.vadesiGelenGorev} görev)`,
      });
    } else if (hafta.uyum < esikler.UYUM_ORTA) {
      uyarilar.push({
        seviye: 'uyari',
        mesaj: `Program uyumu %${hafta.uyum}, hedefin altında`,
      });
    }
  }

  /* 2 — üst üste görev tamamlamama */
  const durgun = hareketsizGun(girdi.gorevler, bugun);
  if (durgun >= esikler.HAREKETSIZ_GUN) {
    uyarilar.push({
      seviye: 'kritik',
      mesaj: `${durgun} gündür görev tamamlamıyor`,
    });
  }

  /* 3 — soru hedefinin altında kalma */
  if (hafta.hedefSoru > 0 && hafta.cozulenSoru < hafta.hedefSoru * esikler.SORU_HEDEF_ORANI) {
    uyarilar.push({
      seviye: 'uyari',
      mesaj: `Soru hedefinin %${yuzde(hafta.cozulenSoru, hafta.hedefSoru)} seviyesinde`,
    });
  }

  /* 4 — çalışma süresi düşüşü */
  if (oncekiHafta.calismaSuresi > 0) {
    const dususYuzdesi = yuzde(
      oncekiHafta.calismaSuresi - hafta.calismaSuresi,
      oncekiHafta.calismaSuresi,
    );
    if (dususYuzdesi >= esikler.SURE_DUSUS) {
      uyarilar.push({
        seviye: 'uyari',
        mesaj: `Çalışma süresi geçen haftaya göre %${dususYuzdesi} azaldı`,
      });
    }
  }

  /* 5 — deneme netlerinde düşüş (tür bazında) */
  const netDusus = netDususVarMi(girdi.denemeler);
  if (netDusus.dusus) {
    uyarilar.push({
      seviye: 'uyari',
      mesaj: `Son ${netDusus.seri.length} ${netDusus.tur} denemesinde net düşüşü (${netDusus.fark} net)`,
    });
  }

  /* 6 — uzun süre konu tamamlamama */
  const sonKonu = sonKonuTamamlama(girdi.konular);
  if (sonKonu) {
    const gecenGun = gunFarki(sonKonu, bugun);
    if (gecenGun >= esikler.KONU_DURGUN_GUN) {
      uyarilar.push({
        seviye: 'bilgi',
        mesaj: `${gecenGun} gündür yeni konu tamamlamadı`,
      });
    }
  }

  /* 7 — ders bazlı, çok haftalı düşüklük */
  uyarilar.push(
    ...dersBazliUyarilar({
      gorevler: girdi.gorevler,
      calismalar: girdi.calismalar,
      bugun,
      esik: esikler.UYUM_ORTA,
      dusukEsik: esikler.UYUM_DUSUK,
    }),
  );

  return uyarilar;
}

export function kritikVarMi(uyarilar: readonly Uyari[]): boolean {
  return uyarilar.some((u) => u.seviye === 'kritik');
}

/* ----------------------------------------------------------------- Seriler */

export type HaftaNoktasi = {
  hafta: GunAnahtari;
  etiket: string;
  uyum: number;
  soru: number;
  sure: number;
  tamamlanan: number;
};

/** Son N haftanın serisi, eskiden yeniye. */
export function haftalikSeri(girdi: {
  gorevler: readonly GorevGirdisi[];
  calismalar: readonly CalismaGirdisi[];
  bugun: GunAnahtari;
  haftaSayisi?: number;
}): HaftaNoktasi[] {
  const adet = girdi.haftaSayisi ?? 8;
  const buHafta = haftaBasi(girdi.bugun);
  const seri: HaftaNoktasi[] = [];

  for (let geri = adet - 1; geri >= 0; geri--) {
    const baslangic = gunEkle(buHafta, -7 * geri);
    const ozet = ozetle({
      gorevler: girdi.gorevler,
      calismalar: girdi.calismalar,
      baslangic,
      bitis: gunEkle(baslangic, 6),
      bugun: girdi.bugun,
    });
    seri.push({
      hafta: baslangic,
      etiket: trTarihKisa(baslangic),
      uyum: ozet.uyum,
      soru: ozet.cozulenSoru,
      sure: ozet.calismaSuresi,
      tamamlanan: ozet.tamamlanan,
    });
  }

  return seri;
}

/** Haftalık karşılaştırma bloğu. */
export function haftaKarsilastir(hafta: Ozet, onceki: Ozet) {
  return {
    uyumFarki: birOndalik(hafta.uyum - onceki.uyum),
    soruFarki: hafta.cozulenSoru - onceki.cozulenSoru,
    sureFarki: hafta.calismaSuresi - onceki.calismaSuresi,
    oncekiUyum: onceki.uyum,
    oncekiSoru: onceki.cozulenSoru,
    oncekiSure: onceki.calismaSuresi,
  };
}

/* --------------------------------------------------- Ders bazlı, çok haftalı */

/**
 * Bir dersin uyumu üst üste birkaç haftadır eşiğin altında mı?
 *
 * Genel uyum iyi görünürken tek bir ders sürekli geride kalabilir — haftalık
 * ortalama bunu gizler. Bu kural o dersi ayrıca yakalar:
 *
 *   "TYT Matematik uyumu son 3 haftadır %70'in altında (%58, %61, %55)"
 *
 * Yalnızca **her hafta görev atanmış** dersler değerlendirilir; program
 * verilmeyen bir haftada uyumun düşük olması dersin suçu değildir.
 */
export function dersBazliUyarilar(girdi: {
  gorevler: readonly GorevGirdisi[];
  calismalar: readonly CalismaGirdisi[];
  bugun: GunAnahtari;
  haftaSayisi?: number;
  esik?: number;
  dusukEsik?: number;
}): Uyari[] {
  const haftaSayisi = girdi.haftaSayisi ?? 3;
  const esik = girdi.esik ?? ESIKLER.UYUM_ORTA;
  const buHafta = haftaBasi(girdi.bugun);

  // Her hafta için ders → uyum
  const haftalar: Map<string, number>[] = [];
  for (let geri = haftaSayisi - 1; geri >= 0; geri--) {
    const baslangic = gunEkle(buHafta, -7 * geri);
    const ozet = ozetle({
      gorevler: girdi.gorevler,
      calismalar: girdi.calismalar,
      baslangic,
      bitis: gunEkle(baslangic, 6),
      bugun: girdi.bugun,
    });
    haftalar.push(new Map(ozet.dersler.filter((d) => d.gorev > 0).map((d) => [d.ders, d.uyum])));
  }

  // Her haftada görev almış dersler
  const ortakDersler = [...(haftalar[0]?.keys() ?? [])].filter((ders) =>
    haftalar.every((h) => h.has(ders)),
  );

  const uyarilar: Uyari[] = [];
  for (const ders of ortakDersler) {
    const degerler = haftalar.map((h) => h.get(ders)!);
    if (!degerler.every((d) => d < esik)) continue;

    uyarilar.push({
      seviye:
        degerler.at(-1)! < (girdi.dusukEsik ?? ESIKLER.UYUM_DUSUK) ? 'kritik' : 'uyari',
      mesaj:
        `${ders} uyumu son ${haftaSayisi} haftadır %${esik} eşiğinin altında ` +
        `(${degerler.map((d) => `%${d}`).join(', ')})`,
    });
  }

  return uyarilar;
}
