export const cleanupAuthState = () => {
  try {
    // Remove standard auth tokens
    localStorage.removeItem("supabase.auth.token");
    // Remove all Supabase auth keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("supabase.auth.") || key.includes("sb-")) {
        try { localStorage.removeItem(key); } catch {}
      }
    });
    // Remove from sessionStorage if in use
    try {
      Object.keys(sessionStorage || {}).forEach((key) => {
        if (key.startsWith("supabase.auth.") || key.includes("sb-")) {
          try { sessionStorage.removeItem(key); } catch {}
        }
      });
    } catch {}
  } catch {}
};
