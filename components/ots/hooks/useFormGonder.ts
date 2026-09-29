'use client';

import { useActionState, useEffect, useRef, useTransition, type FormEvent } from 'react';

import type { FormDurumu } from '@/lib/ots/dogrulama';

/**
 * Hata dönünce formu SİLMEYEN Server Action gönderimi.
 *
 * React 19'da `<form action={fn}>` eylem bittiğinde formu koşulsuz sıfırlar
 * (react-dom `startHostTransition` → `requestFormReset`); eylemin döndürdüğü
 * `{ ok: false }` durumuna bakmaz. Sonuç: yanlış şifrede e-posta, eksik alanda
 * uzun bir form baştan yazılıyordu.
 *
 * Çıkış yolu React'in kendisinde: `onSubmit` içinde `preventDefault` çağrılıp
 * aynı olayda bir geçiş başlatılırsa React eylemi `noop` ile çalıştırır —
 * sıfırlama yok, ama `useFormStatus` ve `useActionState` bekleme durumu yine
 * çalışır. `action={gonder}` formda kalır: JS yüklenmeden gönderilirse sunucu
 * eylemi yine çalışır (ilerleyici geliştirme).
 *
 * Kullanım:
 *   const { durum, gonder, bekliyor, gonderElle } = useFormGonder(eylem, BOS_DURUM);
 *   <form action={gonder} onSubmit={gonderElle}>
 *
 * `basaridaSifirla`: form ekranda kalıp tekrar kullanılıyorsa (yeni not,
 * şifre değiştirme) başarıdan sonra boşaltılır. Modalda açılıp başarıda
 * kapanan formlarda gerekmez.
 */
export function useFormGonder(
  eylem: (onceki: FormDurumu, veri: FormData) => Promise<FormDurumu>,
  ilkDurum: FormDurumu,
  { basaridaSifirla = false }: { basaridaSifirla?: boolean } = {},
) {
  const [durum, gonder, bekliyor] = useActionState(eylem, ilkDurum);
  const [, gecisBaslat] = useTransition();
  const sonForm = useRef<HTMLFormElement | null>(null);

  function gonderElle(olay: FormEvent<HTMLFormElement>) {
    olay.preventDefault();
    const form = olay.currentTarget;
    sonForm.current = form;
    // Modal eylem çubuğundaki `form="…"` düğmesi de gönderen olabilir.
    const gonderen = (olay.nativeEvent as SubmitEvent).submitter ?? undefined;
    const veri = new FormData(form, gonderen);
    gecisBaslat(() => gonder(veri));
  }

  useEffect(() => {
    if (basaridaSifirla && durum.ok) sonForm.current?.reset();
  }, [durum, basaridaSifirla]);

  return { durum, gonder, bekliyor, gonderElle };
}
