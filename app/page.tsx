import { Preloader } from "@/components/Preloader";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { WhyMe } from "@/components/WhyMe";
import { Process } from "@/components/Process";
import { Stats } from "@/components/Stats";
import { Testimonials } from "@/components/Testimonials";
import { FAQ } from "@/components/FAQ";
import { InstagramSection } from "@/components/InstagramSection";
import { Contact } from "@/components/Contact";
import { LocationMap } from "@/components/LocationMap";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Preloader />
      <Navbar />
      <main className="flex-1">
        <Hero />
        <About />
        <WhyMe />
        <Process />
        <Stats />
        <Testimonials />
        <FAQ />
        <InstagramSection />
        <Contact />
        <LocationMap />
      </main>
      <Footer />
    </>
  );
}
