import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import CTA from "@/components/cta";
import FAQ from "@/components/faq";
import Features from "@/components/features";
import Hero from "@/components/hero";
import HowItWorks from "@/components/how-it-works";
import Perks from "@/components/perks";
import PlatformMetrics from "@/components/platform-metrics";
import Pricing from "@/components/pricing";
import Testimonials from "@/components/testimonials";

export default function RootPage() {
  return (
    <main className="w-full relative">
      <Navbar />
      <div className="w-full relative flex flex-col">
        <section className="w-full">
          <Hero />
        </section>

        <section className="w-full">
          <Perks />
        </section>

        <section className="w-full">
          <HowItWorks />
        </section>

        <section id="features" className="w-full">
          <Features />
        </section>

        <section className="w-full">
          <Testimonials />
        </section>

        <section id="pricing" className="w-full">
          <Pricing />
        </section>

        <section className="w-full">
          <PlatformMetrics />
        </section>

        <section className="w-full">
          <FAQ />
        </section>

        <section id="contact" className="w-full">
          <CTA />
        </section>
      </div>
      <Footer />
    </main>
  );
}