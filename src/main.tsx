import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initContentProtection } from "./lib/content-protection";

// Apply saved theme on load
const savedTheme = localStorage.getItem("theme") || "dark";
document.documentElement.classList.add(savedTheme);

// Initialize content protection (disable right-click, dev tools, etc.)
if (import.meta.env.PROD) {
  initContentProtection();
}

// Auto-reload when a new service worker version is detected
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });

  // Check for updates every 2 minutes
  setTimeout(() => {
    const checkForUpdates = () => {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) reg.update();
      });
    };
    checkForUpdates();
    setInterval(checkForUpdates, 2 * 60 * 1000);
  }, 2 * 60 * 1000);
}

createRoot(document.getElementById("root")!).render(<App />);
