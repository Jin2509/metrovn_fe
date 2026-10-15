import { useSyncExternalStore } from "react";

// Kho trạng thái nhỏ dùng chung cho dữ liệu giả (thay bằng TanStack Query + API thật sau).
export function createStore<T>(initial: T) {
  let state = initial;
  const subs = new Set<() => void>();
  return {
    get: () => state,
    set: (fn: (s: T) => T) => {
      state = fn(state);
      subs.forEach((f) => f());
    },
    use: () =>
      useSyncExternalStore(
        (cb) => {
          subs.add(cb);
          return () => subs.delete(cb);
        },
        () => state,
        () => initial,
      ),
  };
}
