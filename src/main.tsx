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

  const LAST_CHECK_KEY = 'sw-last-update-check';
  const ONE_DAY = 24 * 60 * 60 * 1000;

  const shouldCheck = () => {
    const last = localStorage.getItem(LAST_CHECK_KEY);
    if (!last) return true;
    return Date.now() - Number(last) >= ONE_DAY;
  };

  // Check after 2 minutes, but only once per day
  setTimeout(() => {
    if (shouldCheck()) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) reg.update();
        localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
      });
    }
  }, 2 * 60 * 1000);
}

createRoot(document.getElementById("root")!).render(<App />);
