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
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen lg:ml-56">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <MobileNav />
      <InstallAppButton />
    </div>
  );
}
