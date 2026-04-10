import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Film, Tv, UserCheck, Music, Megaphone, Shield } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();

  const handleAdminClick = () => {
    navigate("/admin");
  };

  // Base nav items
  const mobileNavItems = [
    { title: "Home", href: "/", icon: Home },
    { title: "Movies", href: "/movies", icon: Film },
    { title: "TV", href: "/tv-series", icon: Tv },
    { title: "Music", href: "https://luomusic.luoancientmovies.com/", icon: Music, external: true },
    { title: "Guide", href: "/adverts", icon: Megaphone },
    { title: "Agent", href: "/agent", icon: UserCheck },
  ];

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border">
        <div className="flex items-center justify-around px-2 py-2">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors relative text-muted-foreground hover:text-foreground"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.title}</span>
                </a>
              ) : (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors relative ${
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.title}</span>
                </Link>
              )
            );
          })}
          
          {/* Admin button - only visible for admin user */}
          {isAdmin && (
            <button
              onClick={handleAdminClick}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors relative ${
                location.pathname.startsWith("/admin") ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Shield className="w-5 h-5" />
              <span className="text-xs font-medium">Admin</span>
            </button>
          )}
          
        </div>
      </nav>
    </>
  );
}
