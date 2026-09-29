'use client';

import { useSyncExternalStore } from 'react';

/** Görünür alan bu oranın altına inince klavye açık sayılır (spec §5.1). */
const ESIK = 0.75;

/*
 * Aynı yönelimde görülen en büyük yükseklik. Spec'in formülü
 * `visualViewport.height < innerHeight * 0.75`; ancak `interactiveWidget:
 * 'resizes-content'` (spec §5.2) altında Android Chrome klavye açılınca
 * `innerHeight`'ı da küçültür ve oran hiç 0.75'in altına inmez. Bu yüzden
 * referans yükseklik `innerHeight`'tan küçük olamaz ve bu yönelimde görülen
 * en büyük değeri korur. Yönelim değişince (genişlik değişince) sıfırlanır ki
 * yatay ekran klavye sanılmasın.
 */
let taban = { genislik: 0, yukseklik: 0 };

function abone(bildir: () => void) {
  const gorunur = window.visualViewport;
  gorunur?.addEventListener('resize', bildir);
  window.addEventListener('resize', bildir);
  return () => {
    gorunur?.removeEventListener('resize', bildir);
    window.removeEventListener('resize', bildir);
  };
}

function oku(): boolean {
  const gorunur = window.visualViewport;
  if (!gorunur) return false;

  if (window.innerWidth !== taban.genislik) {
    taban = { genislik: window.innerWidth, yukseklik: 0 };
  }
  const simdiki = Math.max(gorunur.height, window.innerHeight);
  if (simdiki > taban.yukseklik) taban.yukseklik = simdiki;

  return gorunur.height < taban.yukseklik * ESIK;
}

function sunucuOku(): boolean {
  return false;
}

/**
 * Sanal klavye açık mı? — spec §5.1.
 *
 * Alt sekme çubuğu ve FAB, klavye açıkken `translate-y-full` ile gizlenir
 * (Android'de klavyenin üstünde yüzen çubuk sorunu). Sunucuda `false`.
 */
export function useKlavyeAcik(): boolean {
  return useSyncExternalStore(abone, oku, sunucuOku);
}
