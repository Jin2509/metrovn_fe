import "@testing-library/jest-dom/vitest";
import { seedStores } from "./fixtures";

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Các store của app khởi tạo rỗng; test dùng dữ liệu cố định trong `src/test/fixtures`.
seedStores();
