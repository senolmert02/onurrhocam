"use client";

import Image from "next/image";
import { about, site } from "@/lib/content";
import { Reveal, RevealGroup, RevealItem } from "./Reveal";
import { CheckIcon } from "./Icons";

export function About() {
  return (
    <section id="hakkimda" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          {/* Fotoğraf bloğu */}
          <Reveal className="relative">
            <div className="absolute -left-4 -top-4 h-full w-full rounded-[2rem] bg-sun/40" />
            <div className="relative aspect-[4/4.2] overflow-hidden rounded-[2rem] border-4 border-white bg-black shadow-card">
              <Image
                src="/about.jpg"
                alt="Onur Akbağ"
                fill
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="object-cover object-top"
              />
            </div>
            <div className="absolute -bottom-5 right-6 rounded-2xl bg-forest px-5 py-3 font-display text-sm font-bold text-sun shadow-soft">
              5+ yıllık deneyim
            </div>
          </Reveal>

          {/* Metin */}
          <div>
            <Reveal>
              <span className="text-sm font-bold uppercase tracking-wider text-forest">
                Hakkımda
              </span>
              <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-forest-deep text-balance sm:text-4xl">
                {about.title}
              </h2>
              <p className="mt-5 font-display text-xl font-semibold text-slate">
                {about.intro}
              </p>
            </Reveal>

            <RevealGroup className="mt-4 space-y-4">
              {about.paragraphs.map((p, i) => (
                <RevealItem key={i}>
                  <p className="text-lg leading-relaxed text-slate-soft">{p}</p>
                </RevealItem>
              ))}
            </RevealGroup>

            <RevealGroup className="mt-8 grid gap-3 sm:grid-cols-2" stagger={0.07}>
              {about.highlights.map((h) => (
                <RevealItem
                  key={h}
                  className="flex items-center gap-3 rounded-2xl border border-forest/10 bg-white px-4 py-3.5 transition-transform hover:-translate-y-0.5"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sun/30 text-forest">
                    <CheckIcon className="h-4.5 w-4.5" />
                  </span>
                  <span className="font-semibold text-slate">{h}</span>
                </RevealItem>
              ))}
            </RevealGroup>

            <Reveal delay={0.15} className="mt-8">
              <a
                href={site.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-bold text-forest underline-offset-4 hover:underline"
              >
                Instagram&apos;da tanış → @{site.handle}
              </a>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
