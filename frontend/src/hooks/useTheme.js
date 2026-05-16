import { useState, useEffect } from "react";

const THEME_KEY = "ai_chatbot_theme";

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved;
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;

    // PEHLE saari theme classes hatao
    root.classList.remove("dark", "light");

    // SIRF agar dark hai to "dark" class add karo
    // Light mode ke liye koi class NAHI chahiye (Tailwind default = light)
    if (theme === "dark") {
      root.classList.add("dark");
    }

    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return { theme, toggleTheme };
}
