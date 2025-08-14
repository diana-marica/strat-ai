import { Header } from "@/components/Landing/Header";
import { Hero } from "@/components/Landing/Hero";
import { Features } from "@/components/Landing/Features";
import { Pricing } from "@/components/Landing/Pricing";
import { Footer } from "@/components/Landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <section id="features">
          <Features />
        </section>
        <section id="pricing">
          <Pricing />
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
