import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/content";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: `${site.name} — ${site.role} | @${site.handle}`,
  description: `${site.motto}. ${site.tagline} Online ve yüz yüze YKS & LGS koçluğu.`,
  keywords: [
    "eğitim koçu",
    "YKS koçluğu",
    "LGS koçluğu",
    "online eğitim koçu",
    "birebir takip",
    site.handle,
  ],
  openGraph: {
    title: `${site.name} — ${site.role}`,
    description: `${site.motto}. ${site.tagline}`,
    locale: "tr_TR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${jakarta.variable} ${outfit.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-paper text-slate">
        {children}
      </body>
    </html>
  );
}
