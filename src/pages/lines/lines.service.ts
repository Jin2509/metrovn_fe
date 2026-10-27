import type { LineStation } from "@/mocks/metro";

export type DistanceBracket = { from: number; to: number; price: number };

/** Giá vé lượt theo cự ly (bảng ticket_price): bậc có from < cự ly ≤ to; vượt bậc cuối thì lấy bậc cuối. */
export function fareForDistance(km: number, brackets: DistanceBracket[]) {
  const sorted = [...brackets].sort((a, b) => a.to - b.to);
  return sorted.find((b) => km <= b.to) ?? sorted.at(-1)!;
}

/** Sắp lại số thứ tự liên tục 1..n theo vị trí hiện tại trong danh sách. */
export const renumber = (rows: LineStation[]) => rows.map((r, i) => ({ ...r, order: i + 1 }));

export function moveRow(rows: LineStation[], from: number, to: number) {
  if (to < 0 || to >= rows.length) return rows;
  const next = [...rows];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return renumber(next);
}
