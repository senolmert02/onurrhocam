"use client";

import { posts } from "@/lib/content";
import { Reveal, RevealGroup, RevealItem } from "./Reveal";
import { ArrowIcon } from "./Icons";

export function Blog() {
  return (
    <section id="blog" className="relative bg-mint/50 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <span className="text-sm font-bold uppercase tracking-wider text-forest">
              Blog
            </span>
            <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-forest-deep text-balance sm:text-4xl">
              Doğru çalışmanın yol haritası
            </h2>
            <p className="mt-3 text-slate-muted">
              Her hafta YKS & LGS sürecine dair yeni bir yazı.
            </p>
          </div>
        </Reveal>

        <RevealGroup className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <RevealItem key={post.title}>
              <article className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-forest/10 bg-white transition-all hover:-translate-y-1.5 hover:shadow-card">
                <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-mint via-paper to-sun-pale">
                  <span className="absolute left-4 top-4 rounded-full bg-forest px-3 py-1 text-xs font-bold text-sun">
                    {post.category}
                  </span>
                  <div className="absolute inset-0 grid place-items-center text-5xl opacity-25 transition-transform duration-500 group-hover:scale-110">
                    📚
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-muted">
                    <span>{post.date}</span>
                    <span>·</span>
                    <span>{post.readTime} okuma</span>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-bold leading-snug text-forest-deep transition-colors group-hover:text-forest">
                    {post.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-muted">
                    {post.excerpt}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-forest">
                    Devamını oku
                    <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
