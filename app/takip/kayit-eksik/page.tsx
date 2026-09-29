import { UserX } from 'lucide-react';

import { DUGME_SESSIZ } from '@/components/ots/Parcalar';
import { cikisYap } from '@/lib/ots/actions/kimlik';
import { girisGerekli } from '@/lib/ots/dal';

export const metadata = { title: 'Kayıt eksik — OnurrHocam ÖTS' };

/**
 * Onaylanmış ama öğrenci kaydı bulunmayan hesap.
 *
 * Normalde oluşmaz: onay, kullanıcıyı aktif yaparken öğrenci kaydını da aynı
 * atomik işlemde açar. Koç öğrenci kaydını elle silerse ya da veri elle
 * değiştirilirse hesap burada kalır. `dal.ts` bu durumda buraya yönlendiriyor;
 * sayfa panel kabuğunun dışında, çünkü panel kabuğu öğrenci kaydı ister ve
 * yeniden buraya yönlendirirdi.
 */
export default async function KayitEksikSayfasi() {
  await girisGerekli();

  return (
    <main className="flex flex-1 items-start justify-center px-4 pt-[max(4rem,env(safe-area-inset-top))]">
      <section className="w-full max-w-[400px] rounded-2xl border border-ots-line bg-ots-surface p-6 text-center shadow-ots-dialog sm:p-8">
        <span className="mx-auto mb-4 grid h-12 lg:h-10 w-12 lg:w-10 place-items-center rounded-full bg-ots-kirmizi-tint text-ots-kirmizi">
          <UserX size={22} aria-hidden />
        </span>
        <h1 className="font-display text-[22px] font-bold text-ots-ink">Öğrenci kaydın bulunamadı</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ots-soft">
          Hesabın açık ama sana bağlı bir öğrenci kaydı yok. Koçunla iletişime geç; kaydını
          yeniden oluşturduğunda buradan devam edebilirsin.
        </p>
        <form action={cikisYap} className="mt-6">
          <button type="submit" className={`${DUGME_SESSIZ} h-12 lg:h-10 w-full`}>
            Çıkış yap
          </button>
        </form>
      </section>
    </main>
  );
}
