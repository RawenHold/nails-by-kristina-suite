import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import App from "./App.tsx";
import "./index.css";

// Mark native platform so heavy CSS effects (backdrop-filter blur)
// can be disabled on mobile to avoid GPU overheating.
if (Capacitor.isNativePlatform()) {
  document.body.classList.add("is-native");

  // Hint the system to render at the highest refresh rate the display
  // supports (e.g. 90/120Hz). The browser/WebView will only honour this
  // when the device + power profile allow it.
  try {
    // CSS hint: enables high-refresh compositing on Chromium-based WebViews
    document.documentElement.style.setProperty("will-change", "scroll-position");
  } catch {
    /* noop */
  }
}

createRoot(document.getElementById("root")!).render(<App />);
