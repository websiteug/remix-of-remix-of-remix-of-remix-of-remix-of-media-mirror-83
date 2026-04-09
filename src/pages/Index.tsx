import { MainLayout } from "@/components/layout/MainLayout";
import { HeroBanner } from "@/components/home/HeroBanner";
import { ContentSection } from "@/components/home/ContentSection";

const Index = () => {
  return (
    <MainLayout>
      <HeroBanner />
      <div className="px-4 lg:px-6 space-y-4 sm:space-y-8 pb-24 lg:pb-8 -mt-4 sm:-mt-2">
        <div className="overflow-hidden whitespace-nowrap relative h-6 sm:h-7 md:h-8 -mb-4">
          <div
            className="absolute whitespace-nowrap flex gap-[33vw]"
            style={{
              animation: "marquee-continuous 35s linear infinite, easter-blink-fade 35s ease-in-out infinite",
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="text-sm sm:text-base md:text-lg lg:text-xl font-black uppercase tracking-widest italic bg-clip-text text-transparent inline-block"
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  backgroundImage: 'linear-gradient(90deg, #ff0000, #ff8000, #ffff00, #00ff00, #00bfff, #8000ff, #ff00ff)',
                  filter: 'drop-shadow(1px 1px 0px rgba(255,255,255,0.5)) drop-shadow(2px 3px 4px rgba(0,0,0,0.6))',
                }}
              >
                🎬 Enjoy the full world of Luo cinema, perfectly translated by Luo Ancient 🎬
              </span>
            ))}
          </div>
        </div>
        <ContentSection title="🔥Trending in Cinema🎞️" category="trending" />
        <ContentSection title="Popular Movies" category="popular" />
        <ContentSection title="Top TV Series" category="top-series" />
        <ContentSection title="Recently Added" category="recently-added" />
        <ContentSection title="Action Movies" category="action" />
        <ContentSection title="Comedy Shows" category="comedy" />
      </div>
    </MainLayout>
  );
};

export default Index;
