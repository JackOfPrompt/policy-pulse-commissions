import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Force build refresh to clear phantom component references
createRoot(document.getElementById("root")!).render(<App />);
