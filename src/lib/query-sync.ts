import { useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiErrorMessage } from "@/lib/api";
import type { createStore } from "@/lib/store";

type Store<V> = ReturnType<typeof createStore<V>>;

/**
 * Tải dữ liệu từ API rồi đẩy bản đã chuyển đổi vào kho dùng chung, để các màn hình và hàm
 * nghiệp vụ đang đọc kho (`store.get()`, `store.use()`) dùng đúng dữ liệu backend.
 * Nhiều component gọi cùng `queryKey` thì TanStack Query chỉ gửi một request.
 */
export function useSyncedQuery<TData, TView>({
  queryKey,
  queryFn,
  store,
  map,
  enabled = true,
}: {
  queryKey: QueryKey;
  queryFn: () => Promise<TData>;
  store: Store<TView>;
  map: (data: TData) => TView;
  enabled?: boolean;
}) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey, queryFn, enabled, retry: false });
  const data = query.data;
  useEffect(() => {
    if (data !== undefined) store.set(() => map(data));
    // `map` thường là hàm khai báo tại chỗ: chỉ đồng bộ lại khi dữ liệu đổi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, store]);
  return {
    data: query.data,
    loading: enabled && query.isPending,
    loadError: query.error ? apiErrorMessage(query.error) : "",
    reload: () => queryClient.invalidateQueries({ queryKey }),
  };
}

/** Ngày hôm nay theo giờ máy, dạng yyyy-MM-dd (toISOString dùng UTC nên lệch ngày trước 7 giờ sáng). */
export function todayIso(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Instant ISO của backend → `dd/MM/yyyy HH:mm` theo giờ máy. */
export function fmtInstant(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
