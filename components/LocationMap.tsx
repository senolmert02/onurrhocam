import { site } from "@/lib/content";
import { Reveal } from "./Reveal";
import { PinIcon, ClockIcon, ArrowIcon } from "./Icons";

const { lat, lng } = site.map;
const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=16&hl=tr&output=embed`;
const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&hl=tr`;
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&hl=tr`;

export function LocationMap() {
  return (
    <section id="konum" className="relative pb-24 sm:pb-32">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-forest">
            Konum
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-forest-deep text-balance sm:text-4xl">
            Yüz yüze görüşmek istersen
            <br />
            buradayım
          </h2>
          <p className="mt-4 text-slate-muted">
            {site.map.city}&apos;dayım — dilersen ofiste tanışalım, dilersen
            online devam edelim.
          </p>
        </Reveal>

        <Reveal delay={0.15} className="mt-12">
          <div className="group relative overflow-hidden rounded-3xl border border-forest/10 bg-white shadow-soft sm:rounded-[2.5rem]">
            {/* Harita */}
            <div className="relative h-[340px] sm:h-[440px]">
              <iframe
                src={embedUrl}
                title={`${site.name} konum haritası`}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full border-0 grayscale-[35%] saturate-[85%] transition-all duration-700 group-hover:grayscale-0 group-hover:saturate-100"
              />
              {/* Kenarlara yumuşak geçiş */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-forest-deep/25 to-transparent lg:h-32" />

              {/* Bilgi kartı — masaüstünde haritanın üzerinde yüzer */}
              <div className="pointer-events-none absolute inset-0 hidden items-end p-8 lg:flex">
                <InfoCard floating />
              </div>
            </div>

            {/* Bilgi kartı — mobilde haritanın altında */}
            <div className="p-5 lg:hidden">
              <InfoCard />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function InfoCard({ floating = false }: { floating?: boolean }) {
  return (
    <div
      className={
        floating
          ? "pointer-events-auto max-w-md rounded-2xl border border-forest/10 bg-white/95 p-6 shadow-card backdrop-blur-sm"
          : ""
      }
    >
      <div className="flex items-start gap-4">
        <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-sun text-forest-deep shadow-sun">
          <PinIcon className="h-6 w-6" />
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-forest-soft" />
        </span>
        <div>
          <p className="font-display text-lg font-extrabold text-forest-deep">
            {site.map.city}
          </p>
          <p className="mt-0.5 text-sm text-slate-muted">{site.map.address}</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-soft">
            <ClockIcon className="h-3.5 w-3.5 text-forest" />
            {site.map.note}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-display font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-forest-deep"
        >
          Yol Tarifi Al
          <ArrowIcon className="h-4 w-4" />
        </a>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-forest/15 bg-white px-5 py-2.5 text-sm font-display font-bold text-forest transition-all hover:-translate-y-0.5 hover:border-forest/30"
        >
          Haritada Aç
        </a>
      </div>
    </div>
  );
}
