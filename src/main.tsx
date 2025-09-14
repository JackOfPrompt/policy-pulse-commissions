import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeMockData } from "./lib/mockApi/superadmin";

// Initialize mock data for Super Admin
initializeMockData();

createRoot(document.getElementById("root")!).render(<App />);
