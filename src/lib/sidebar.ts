import { createStore } from "@/lib/store";

// Sidebar thu gọn theo thiết bị, nhớ qua các lần mở lại. Chỉ áp dụng cho sidebar cố định ở màn hình rộng.
const STORAGE_KEY = "metro.sidebar.collapsed";

export const sidebarCollapsedStore = createStore(false);

function save(collapsed: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  } catch {
    // Trình duyệt chặn storage: vẫn áp dụng cho phiên hiện tại.
  }
}

export function toggleSidebar() {
  sidebarCollapsedStore.set((collapsed) => !collapsed);
  save(sidebarCollapsedStore.get());
}

/** Gọi một lần sau khi mount, tránh lệch giữa server và trình duyệt lúc hydrate. */
export function initSidebar() {
  try {
    const collapsed = window.localStorage.getItem(STORAGE_KEY) === "1";
    sidebarCollapsedStore.set(() => collapsed);
  } catch {
    sidebarCollapsedStore.set(() => false);
  }
}
