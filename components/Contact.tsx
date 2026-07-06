"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { site } from "@/lib/content";
import { Reveal } from "./Reveal";
import {
  PhoneIcon,
  PinIcon,
  WhatsappIcon,
  InstagramIcon,
  CheckIcon,
} from "./Icons";

export function Contact() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = data.get("name");
    const grade = data.get("grade");
    const message = data.get("message");
    // Backend yok: e-posta uygulamasını hazır metinle açar.
    // İstersen Formspree/Resend gibi bir servise bağlayabilirim.
    const body = encodeURIComponent(
      `Merhaba ${site.name},\n\nSınıf/Sınav: ${grade}\n\n${message}\n\n— ${name}`
    );
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(
      "Koçluk Başvurusu / Ön Görüşme Talebi"
    )}&body=${body}`;
    setSent(true);
  }

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
    <section id="iletisim" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5">
        <div className="overflow-hidden rounded-[2.5rem] border border-forest/10 bg-white shadow-soft">
          <div className="grid lg:grid-cols-2">
            {/* Sol: bilgi */}
            <div className="relative overflow-hidden bg-forest p-9 text-white sm:p-12">
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sun/20 blur-3xl" />
              <Reveal>
                <span className="text-sm font-bold uppercase tracking-wider text-sun">
                  İletişim
                </span>
                <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-balance sm:text-4xl">
                  Hedefine giden yol
                  <br />
                  bir mesajla başlar
                </h2>
                <p className="mt-4 text-mint/80">
                  Ücretsiz ön görüşmede durumunu konuşalım; sana en uygun paketi
                  ve yol haritasını birlikte belirleyelim.
                </p>
              </Reveal>

              <div className="mt-10 space-y-5">
                {contactItems.map((c) => {
                  const Inner = (
                    <div className="flex items-center gap-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-sun">
                        <c.icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-mint/50">
                          {c.label}
                        </p>
                        <p className="font-semibold">{c.value}</p>
                      </div>
                    </div>
                  );
                  return c.href ? (
                    <a
                      key={c.label}
                      href={c.href}
                      target={c.href.startsWith("http") ? "_blank" : undefined}
                      rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="block transition-opacity hover:opacity-80"
                    >
                      {Inner}
                    </a>
                  ) : (
                    <div key={c.label}>{Inner}</div>
                  );
                })}
              </div>

              <a
                href={`https://wa.me/${site.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-10 inline-flex items-center gap-2 rounded-full bg-sun px-6 py-3.5 font-display font-bold text-forest-deep shadow-sun transition-transform hover:-translate-y-0.5"
              >
                <WhatsappIcon className="h-5 w-5" />
                WhatsApp&apos;tan yaz
              </a>
            </div>

            {/* Sağ: başvuru formu */}
            <div className="p-9 sm:p-12">
              <AnimatePresence mode="wait">
                {sent ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex h-full flex-col items-center justify-center py-12 text-center"
                  >
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-sun/30 text-forest">
                      <CheckIcon className="h-8 w-8" />
                    </span>
                    <h3 className="mt-5 font-display text-2xl font-extrabold text-forest-deep">
                      Teşekkürler!
                    </h3>
                    <p className="mt-2 max-w-xs text-slate-muted">
                      E-posta uygulaman açıldı. En kısa sürede sana geri
                      döneceğim.
                    </p>
                    <button
                      onClick={() => setSent(false)}
                      className="mt-6 text-sm font-bold text-forest hover:underline"
                    >
                      Yeni başvuru gönder
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-5"
                  >
                    <h3 className="font-display text-2xl font-extrabold text-forest-deep">
                      📋 Başvuru Formu
                    </h3>
                    <Field label="Adın Soyadın">
                      <input
                        name="name"
                        required
                        placeholder="Örn. Ayşe Yılmaz"
                        className="input"
                      />
                    </Field>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Sınıfın / Sınavın">
                        <select name="grade" required className="input" defaultValue="">
                          <option value="" disabled>
                            Seç
                          </option>
                          <option>LGS (8. sınıf)</option>
                          <option>YKS (11. sınıf)</option>
                          <option>YKS (12. sınıf)</option>
                          <option>YKS (Mezun)</option>
                          <option>Diğer</option>
                        </select>
                      </Field>
                      <Field label="Telefon / E-posta">
                        <input
                          name="contact"
                          required
                          placeholder="sana nasıl ulaşayım?"
                          className="input"
                        />
                      </Field>
                    </div>
                    <Field label="Mesajın">
                      <textarea
                        name="message"
                        required
                        rows={4}
                        placeholder="Hedefinden ve şu anki durumundan kısaca bahset..."
                        className="input resize-none"
                      />
                    </Field>
                    <button
                      type="submit"
                      className="w-full rounded-full bg-sun px-6 py-4 font-display font-bold text-forest-deep shadow-sun transition-transform hover:-translate-y-0.5"
                    >
                      Başvuruyu Gönder
                    </button>
                    <p className="text-center text-xs text-slate-muted">
                      Bilgilerin gizli tutulur, üçüncü kişilerle paylaşılmaz.
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-soft">
        {label}
      </span>
      {children}
    </label>
  );
}
