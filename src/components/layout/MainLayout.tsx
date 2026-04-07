import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileNav } from "./MobileNav";
import { InstallAppButton } from "@/components/InstallAppButton";
import { useState, useEffect } from "react";

function getUgandaBackground() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ugandaTime = new Date(utc + 3 * 60 * 60000);
  const hour = ugandaTime.getHours();
  if (hour >= 5 && hour < 12) return '/images/bg-morning.jpg';
  if (hour >= 12 && hour < 17) return '/images/bg-afternoon.jpg';
  return '/images/bg-evening.jpg';
}

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [bgImage, setBgImage] = useState(getUgandaBackground);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgImage(getUgandaBackground());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex relative">
      {/* Background */}
      <div
        className="fixed inset-0 z-0 transition-all duration-1000"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      />
      <div className="fixed inset-0 z-0 bg-background/85 dark:bg-background/90" />
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen lg:ml-56 relative z-10">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <MobileNav />
      <InstallAppButton />
    </div>
  );
}
