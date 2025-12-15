import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initErrorSuppression } from "./lib/errorSuppression";

// Initialize error suppression for known Supabase issues
initErrorSuppression();

createRoot(document.getElementById("root")!).render(<App />);
