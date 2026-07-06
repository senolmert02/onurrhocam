import { Preloader } from "@/components/Preloader";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { WhyMe } from "@/components/WhyMe";
import { Process } from "@/components/Process";
import { Packages } from "@/components/Packages";
import { Stats } from "@/components/Stats";
import { Testimonials } from "@/components/Testimonials";
import { SuccessStories } from "@/components/SuccessStories";
import { Blog } from "@/components/Blog";
import { FAQ } from "@/components/FAQ";
import { Resources } from "@/components/Resources";
import { InstagramSection } from "@/components/InstagramSection";
import { Contact } from "@/components/Contact";
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
        <Packages />
        <Stats />
        <Testimonials />
        <SuccessStories />
        <Blog />
        <FAQ />
        <Resources />
        <InstagramSection />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
