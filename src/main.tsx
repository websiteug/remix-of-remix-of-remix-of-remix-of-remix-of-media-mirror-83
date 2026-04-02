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

createRoot(document.getElementById("root")!).render(<App />);
