import { createStore } from "@/lib/store";

// Giao diện sáng/tối theo thiết bị (không theo tài khoản). Token màu tối nằm ở `.dark` trong styles.css.
export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "metro.theme";

export const themeStore = createStore<ThemePreference>("system");

function readStored(): ThemePreference {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function prefersDark() {
  return (
    typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches
  );
}

function apply(theme: ThemePreference) {
  const dark = theme === "dark" || (theme === "system" && prefersDark());
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

export function setTheme(theme: ThemePreference) {
  themeStore.set(() => theme);
  try {
    if (theme === "system") window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Trình duyệt chặn storage: vẫn áp dụng cho phiên hiện tại.
  }
  apply(theme);
}

/** Gọi một lần sau khi mount: đọc lựa chọn đã lưu và theo dõi thay đổi giao diện hệ điều hành. */
export function initTheme() {
  setTheme(readStored());
  const media = window.matchMedia?.("(prefers-color-scheme: dark)");
  const onChange = () => themeStore.get() === "system" && apply("system");
  media?.addEventListener("change", onChange);
  return () => media?.removeEventListener("change", onChange);
}
