import { site } from "@/lib/content";
import { Reveal } from "./Reveal";
import {
  PhoneIcon,
  PinIcon,
  WhatsappIcon,
  InstagramIcon,
} from "./Icons";

export function Contact() {
  const contactItems = [
    { icon: PhoneIcon, label: "Telefon", value: site.phone, href: `tel:${site.phone}` },
    {
      icon: WhatsappIcon,
      label: "WhatsApp",
      value: "Hemen yaz",
      href: `https://wa.me/${site.whatsapp}`,
    },
    {
      icon: InstagramIcon,
      label: "Instagram",
      value: `@${site.handle}`,
      href: site.socials.instagram,
    },
    { icon: PinIcon, label: "Konum", value: site.location },
  ];

  return (
    <section id="iletisim" className="relative py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-5">
        <div className="relative overflow-hidden rounded-3xl bg-forest p-6 text-white shadow-soft sm:p-10 sm:rounded-[2.5rem] lg:p-14">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-sun/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

          <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-2 [&>*]:min-w-0">
            {/* Sol: başlık + CTA */}
            <Reveal>
              <span className="text-sm font-bold uppercase tracking-wider text-sun">
                İletişim
              </span>
              <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-balance sm:text-4xl">
                Hedefine giden yol
                <br />
                bir mesajla başlar
              </h2>
              <p className="mt-4 max-w-md text-mint/80">
                Ücretsiz ön görüşmede durumunu konuşalım; sana en uygun yol
                haritasını birlikte belirleyelim.
              </p>
              <a
                href={`https://wa.me/${site.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-sun px-7 py-4 font-display font-bold text-forest-deep shadow-sun transition-transform hover:-translate-y-0.5"
              >
                <WhatsappIcon className="h-5 w-5" />
                WhatsApp&apos;tan yaz
              </a>
            </Reveal>

            {/* Sağ: iletişim kanalları */}
            <Reveal delay={0.15}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
                {contactItems.map((c) => {
                  const Inner = (
                    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur transition-colors hover:border-sun/40 hover:bg-white/10">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-sun">
                        <c.icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider text-mint/50">
                          {c.label}
                        </p>
                        <p className="break-words font-semibold leading-snug">{c.value}</p>
                      </div>
                    </div>
                  );
                  return c.href ? (
                    <a
                      key={c.label}
                      href={c.href}
                      target={c.href.startsWith("http") ? "_blank" : undefined}
                      rel={
                        c.href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                      className="block"
                    >
                      {Inner}
                    </a>
                  ) : (
                    <div key={c.label}>{Inner}</div>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
