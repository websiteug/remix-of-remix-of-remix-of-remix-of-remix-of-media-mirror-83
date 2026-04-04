import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileNav } from "./MobileNav";
import { InstallAppButton } from "@/components/InstallAppButton";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex relative">
      {/* Background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(/images/hero-bg.jpg)',
          backgroundSize: '300px 300px',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
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
