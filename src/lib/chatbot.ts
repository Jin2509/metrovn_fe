// Trợ lý ảo dạng luật dựa trên dữ liệu giả. Tầng này sẽ được thay bằng API AI thật sau.
import {
  busRoutes,
  busStops,
  lines,
  stations,
  stopsForStation,
  stationsForRoute,
  vnd,
} from "@/mocks/metro";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");

export function answer(q: string): string {
  const t = norm(q);
  const station = [...stations]
    .sort((a, b) => b.name.length - a.name.length)
    .find((s) => t.includes(norm(s.name)));
  const route = busRoutes.find((r) =>
    new RegExp(`(tuyen|xe|bus|buyt|so)\\s*${r.code.toLowerCase()}\\b`).test(t),
  );

  if (route) {
    const st = stationsForRoute(route.code);
    return `Tuyến buýt ${route.code} (${route.name}) do ${route.operator} vận hành, ${route.hours}, ${route.headwayMin} phút/chuyến, giá ${vnd(route.fare)}.\nKết nối với ga: ${st.map((s) => s.name).join(", ") || "chưa có"}.`;
  }
  if (station && /(bus|buyt|xe|ket noi|tram)/.test(t)) {
    const stops = stopsForStation(station.id);
    if (!stops.length) return `Ga ${station.name} hiện chưa có trạm buýt kết nối trong dữ liệu.`;
    return (
      `Quanh ga ${station.name} có ${stops.length} trạm buýt:\n` +
      stops
        .map((b) => `• ${b.name} (~${b.walkMinutes} phút đi bộ): tuyến ${b.routes.join(", ")}`)
        .join("\n")
    );
  }
  if (station) {
    const ls = station.lineIds.map((id) => lines.find((l) => l.id === id)!.code).join(", ");
    return (
      `Ga ${station.name} thuộc ${ls}${station.interchange ? ", là ga chuyển tuyến" : ""}. ` +
      (station.status === "ACTIVE"
        ? `Lưu lượng trung bình ${station.dailyFlow.toLocaleString("vi-VN")} lượt/ngày. `
        : "Ga đang trong quy hoạch. ") +
      `Có ${stopsForStation(station.id).length} trạm buýt kết nối.`
    );
  }
  if (/(dong|cao diem|luu luong)/.test(t)) {
    const top = [...stations].sort((a, b) => b.dailyFlow - a.dailyFlow).slice(0, 3);
    return `Ga đông nhất: ${top.map((s) => `${s.name} (${s.dailyFlow.toLocaleString("vi-VN")})`).join(", ")}. Giờ cao điểm: 7–9h và 17–19h.`;
  }
  if (/(tuyen|line|metro)/.test(t)) {
    return lines
      .map(
        (l) => `• ${l.code}: ${l.name} — ${l.status === "ACTIVE" ? "đang khai thác" : "quy hoạch"}`,
      )
      .join("\n");
  }
  if (/(bus|buyt)/.test(t)) {
    return `Hệ thống có ${busRoutes.length} tuyến buýt kết nối qua ${busStops.length} trạm gần ga. Hỏi ví dụ: "tuyến 19" hoặc "buýt gần ga Thủ Đức".`;
  }
  if (/(chao|hello|hi\b)/.test(t))
    return "Xin chào! Mình là trợ lý Metro. Bạn có thể hỏi về ga, tuyến, xe buýt kết nối hoặc lưu lượng.";
  return 'Mình chưa hiểu câu hỏi. Thử: "Buýt gần ga Bến Thành", "Tuyến 19 đi đâu?", "Ga nào đông nhất?"';
}
