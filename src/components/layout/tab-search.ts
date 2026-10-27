/** validateSearch dùng chung cho các route có `PageTabs`: giữ `?tab=` trên URL để chia sẻ/đánh dấu. */
export const tabSearch = (search: Record<string, unknown>): { tab?: string } => ({
  tab: typeof search.tab === "string" ? search.tab : undefined,
});

/** validateSearch cho trang Ga & tuyến: thêm `?station=` để mở thẳng một ga (vd. từ bản đồ). */
export const stationSearch = (
  search: Record<string, unknown>,
): { tab?: string; station?: string } => ({
  ...tabSearch(search),
  station: typeof search.station === "string" ? search.station : undefined,
});
