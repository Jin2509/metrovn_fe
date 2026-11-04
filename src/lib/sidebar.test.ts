import { afterEach, describe, expect, it } from "vitest";
import { initSidebar, sidebarCollapsedStore, toggleSidebar } from "@/lib/sidebar";

afterEach(() => {
  window.localStorage.clear();
  sidebarCollapsedStore.set(() => false);
});

describe("thu gọn sidebar", () => {
  it("mặc định mở rộng khi chưa lưu gì", () => {
    initSidebar();
    expect(sidebarCollapsedStore.get()).toBe(false);
  });

  it("nhớ lựa chọn qua lần mở sau", () => {
    toggleSidebar();
    expect(sidebarCollapsedStore.get()).toBe(true);
    sidebarCollapsedStore.set(() => false);
    initSidebar();
    expect(sidebarCollapsedStore.get()).toBe(true);
    toggleSidebar();
    initSidebar();
    expect(sidebarCollapsedStore.get()).toBe(false);
  });
});
