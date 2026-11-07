import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "gold" | "light" | "dark";

/** v2: đổi theme mặc định sang "light" — key mới để người dùng cũ cũng nhận mặc định mới */
const STORAGE_KEY = "iqc-theme-v2";
const ORDER: ThemeMode[] = ["light", "dark", "gold"];
const DEFAULT_THEME: ThemeMode = "light";

function isTheme(v: string | null): v is ThemeMode {
  return v === "gold" || v === "light" || v === "dark";
}

function readStored(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (isTheme(v)) return v;
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

function applyDom(theme: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
  root.dataset.theme = theme;
  root.style.colorScheme = theme === "light" ? "light" : "dark";
}

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof document === "undefined") return DEFAULT_THEME;
    return readStored();
  });

  useEffect(() => {
    applyDom(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    applyDom(theme);
  }, []);

  const setTheme = useCallback((t: ThemeMode) => setThemeState(t), []);
  const cycleTheme = useCallback(
    () => setThemeState((t) => ORDER[(ORDER.indexOf(t) + 1) % ORDER.length]),
    [],
  );
  const toggleTheme = cycleTheme;

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, cycleTheme }),
    [theme, setTheme, toggleTheme, cycleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
