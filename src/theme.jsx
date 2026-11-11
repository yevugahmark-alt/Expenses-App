import { createContext, useContext, useEffect, useState } from "react";

// "light" | "dark" | "system". Stored on its own key so deleting the
// account (which clears app data) keeps the user's display preference.
const KEY = "theme";
const THEMES = ["light", "dark", "system"];

const readTheme = () => {
  try {
    const t = localStorage.getItem(KEY);
    return THEMES.includes(t) ? t : "system";
  } catch {
    return "system";
  }
};

const applyTheme = (theme) => {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
};

const systemPrefersDark = () =>
  window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(readTheme);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* private mode: theme just won't persist */
    }
  }, [theme]);

  // keep "system" in sync if the OS theme changes while the app is open
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolved = theme === "system" ? (systemDark ? "dark" : "light") : theme;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
