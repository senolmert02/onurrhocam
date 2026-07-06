"use client";

import { site } from "@/lib/content";
import { Reveal, RevealGroup, RevealItem } from "./Reveal";
import { InstagramIcon, PlayIcon } from "./Icons";

// 📷 Instagram'daki gerçek paylaşımlar API/embed ile bağlanabilir.
// Şimdilik profil linkine giden şık kartlar; Reel linklerini verince gerçek embed eklerim.
const igCards = [
  { type: "Reel", emoji: "🎬", label: "Başarı hikayeleri" },
  { type: "Post", emoji: "📊", label: "Deneme analizi ipuçları" },
  { type: "Reel", emoji: "💪", label: "Motivasyon" },
  { type: "Post", emoji: "📝", label: "Çalışma programı örnekleri" },
];

export function InstagramSection() {
  return (
    <section className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-forest">
            Sosyal medya
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-forest-deep text-balance sm:text-4xl">
            Instagram&apos;da @{site.handle}
          </h2>
          <p className="mt-4 text-lg text-slate-muted">
            Reels, story&apos;ler ve öğrenci başarı hikayeleri her gün burada.
          </p>
        </Reveal>

        <RevealGroup className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4" stagger={0.08}>
          {igCards.map((c, i) => (
            <RevealItem key={i}>
              <a
                href={site.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-square overflow-hidden rounded-3xl border border-forest/10 bg-gradient-to-br from-mint via-paper to-sun-pale transition-all hover:-translate-y-1.5 hover:shadow-card"
              >
                <span className="absolute left-4 top-4 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-forest-deep backdrop-blur">
                  {c.type}
                </span>
                <div className="absolute inset-0 grid place-items-center">
                  <span className="text-6xl transition-transform duration-500 group-hover:scale-125">
                    {c.emoji}
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-forest/90 to-transparent p-4 pt-10">
                  <p className="text-sm font-bold text-white">{c.label}</p>
                  {c.type === "Reel" && (
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-sun text-forest-deep">
                      <PlayIcon className="ml-0.5 h-4 w-4" />
                    </span>
                  )}
                </div>
              </a>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal delay={0.15} className="mt-10 text-center">
          <a
            href={site.socials.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-forest to-forest-soft px-7 py-4 font-display font-bold text-white shadow-soft transition-transform hover:-translate-y-0.5"
          >
            <InstagramIcon className="h-5.5 w-5.5" />
            Takip et → @{site.handle}
          </a>
        </Reveal>
      </div>
    </section>
  );
}
