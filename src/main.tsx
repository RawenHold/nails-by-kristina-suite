import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import App from "./App.tsx";
import "./index.css";

// Mark native platform so heavy CSS effects (backdrop-filter blur)
// can be disabled on mobile to avoid GPU overheating.
if (Capacitor.isNativePlatform()) {
  document.body.classList.add("is-native");
}

createRoot(document.getElementById("root")!).render(<App />);
