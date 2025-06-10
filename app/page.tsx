import { CallToAction } from "@/components/marketing/CallToAction";
import { Faqs } from "@/components/marketing/Faqs";
import { Footer } from "@/components/marketing/Footer";
import { Header } from "@/components/marketing/Header";
import { Hero } from "@/components/marketing/Hero";
import { MultipleOutputs } from "@/components/marketing/MultipleOutputs";
import { Pricing } from "@/components/marketing/Pricing";
import { SecondaryFeatures } from "@/components/marketing/SecondaryFeatures";
// import { Testimonials } from "@/components/marketing/Testimonials";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <MultipleOutputs />
        <SecondaryFeatures />
        <CallToAction />
        {/* <Testimonials /> */}
        <Pricing />
        <Faqs />
      </main>
      <Footer />
    </>
  );
}
