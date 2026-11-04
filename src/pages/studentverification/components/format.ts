export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });

export const formatDate = (value: string | null) =>
  value ? value.split("-").reverse().join("/") : null;
