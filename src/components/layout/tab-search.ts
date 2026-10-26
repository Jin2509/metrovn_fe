/** validateSearch dùng chung cho các route có `PageTabs`: giữ `?tab=` trên URL để chia sẻ/đánh dấu. */
export const tabSearch = (search: Record<string, unknown>): { tab?: string } => ({
  tab: typeof search.tab === "string" ? search.tab : undefined,
});
