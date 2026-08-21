import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface KeyboardViewportValue {
  keyboardOpen: boolean;
  bottomInset: number;
}

const KeyboardViewportContext = createContext<KeyboardViewportValue>({
  keyboardOpen: false,
  bottomInset: 0,
});

/** Phát hiện bàn phím ảo (mobile) qua Visual Viewport — ẩn bottom nav, chỉnh padding */
export function KeyboardViewportProvider({ children }: { children: ReactNode }) {
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [bottomInset, setBottomInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const gap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      const open = gap > 80;
      setKeyboardOpen(open);
      setBottomInset(open ? gap : 0);
      document.documentElement.classList.toggle("keyboard-open", open);
      document.documentElement.style.setProperty("--keyboard-inset", `${open ? gap : 0}px`);
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      document.documentElement.classList.remove("keyboard-open");
      document.documentElement.style.setProperty("--keyboard-inset", "0px");
    };
  }, []);

  const value = useMemo(() => ({ keyboardOpen, bottomInset }), [keyboardOpen, bottomInset]);
  return (
    <KeyboardViewportContext.Provider value={value}>{children}</KeyboardViewportContext.Provider>
  );
}

export function useKeyboardViewport() {
  return useContext(KeyboardViewportContext);
}

/** Cuộn ô nhập vào vùng nhìn thấy khi bàn phím mở */
export function scrollFieldIntoView(el: HTMLElement | null) {
  if (!el) return;
  window.setTimeout(() => {
    el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, 300);
}
