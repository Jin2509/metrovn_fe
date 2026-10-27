import { haversine } from "@/lib/geo";
import { createStore } from "@/lib/store";

// Dữ liệu giả cho Metro TP.HCM — thay bằng API thật qua tầng service sau này.
// Tên trường bám theo bảng `station`, `metro_line`, `line_station` trong báo cáo (mục 3.3.2).

/** Trạng thái ga theo bảng `station`: ACTIVE · INACTIVE (chưa/ngừng khai thác) · MAINTENANCE (bảo trì). */
export type StationStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

export type Station = {
  id: string;
  code: string;
  name: string;
  address: string;
  district: string;
  lineIds: string[];
  lat: number;
  lng: number;
  order: number;
  interchange: boolean;
  status: StationStatus;
  /** Lượt vào ga trung bình/ngày — tổng hợp từ bảng ticket_usage_history (event_type = ENTRY). */
  dailyFlow: number;
};
export type MetroLine = {
  id: string;
  code: string;
  name: string;
  colorHex: string;
  status: "ACTIVE" | "PLANNED";
};
export type BusStop = {
  id: string;
  name: string;
  stationId: string;
  lat: number;
  lng: number;
  walkMinutes: number;
  routes: string[];
};
export type BusRoute = {
  code: string;
  name: string;
  operator: string;
  headwayMin: number;
  hours: string;
  fare: number;
};

export const lines: MetroLine[] = [
  {
    id: "L1",
    code: "Tuyến 1",
    name: "Bến Thành – Suối Tiên",
    colorHex: "#E2231A",
    status: "ACTIVE",
  },
  {
    id: "L2",
    code: "Tuyến 2",
    name: "Bến Thành – Tham Lương",
    colorHex: "#F7A800",
    status: "PLANNED",
  },
];

const l1: [string, number, number, boolean][] = [
  ["Bến Thành", 10.7721, 106.6983, true],
  ["Nhà hát Thành phố", 10.7766, 106.7031, false],
  ["Ba Son", 10.7853, 106.7072, false],
  ["Văn Thánh", 10.7966, 106.7151, false],
  ["Tân Cảng", 10.7986, 106.7228, false],
  ["Thảo Điền", 10.8015, 106.7337, false],
  ["An Phú", 10.8019, 106.7432, false],
  ["Rạch Chiếc", 10.8087, 106.7552, false],
  ["Phước Long", 10.8213, 106.7584, false],
  ["Bình Thái", 10.8326, 106.7638, false],
  ["Thủ Đức", 10.8462, 106.7716, false],
  ["Khu Công nghệ cao", 10.8589, 106.7888, false],
  ["Đại học Quốc gia", 10.8665, 106.8013, false],
  ["Suối Tiên", 10.8794, 106.8143, false],
];
const L1_DISTRICTS = [
  "Quận 1",
  "Quận 1",
  "Quận 1",
  "Bình Thạnh",
  "Bình Thạnh",
  "TP. Thủ Đức",
  "TP. Thủ Đức",
  "TP. Thủ Đức",
  "TP. Thủ Đức",
  "TP. Thủ Đức",
  "TP. Thủ Đức",
  "TP. Thủ Đức",
  "TP. Thủ Đức",
  "TP. Thủ Đức",
];

const l2: [string, number, number][] = [
  ["Tao Đàn", 10.7746, 106.6919],
  ["Dân Chủ", 10.7781, 106.6812],
  ["Hòa Hưng", 10.7856, 106.6743],
  ["Lê Thị Riêng", 10.7869, 106.6649],
  ["Phạm Văn Hai", 10.7929, 106.6589],
  ["Bảy Hiền", 10.7926, 106.6527],
  ["Nguyễn Hồng Đào", 10.7992, 106.6438],
  ["Bà Quẹo", 10.8063, 106.6371],
  ["Phạm Văn Bạch", 10.8154, 106.6316],
  ["Tham Lương", 10.8247, 106.6262],
];

export const stations: Station[] = [
  ...l1.map(([name, lat, lng, ic], i) => ({
    id: `S1-${i + 1}`,
    code: `L1-${String(i + 1).padStart(2, "0")}`,
    name,
    address: `Ga ${name}`,
    district: L1_DISTRICTS[i],
    lineIds: ic ? ["L1", "L2"] : ["L1"],
    lat,
    lng,
    order: i + 1,
    interchange: ic,
    status: "ACTIVE" as const,
    dailyFlow: Math.round(3000 + ((i * 7919) % 9000)),
  })),
  ...l2.map(([name, lat, lng], i) => ({
    id: `S2-${i + 1}`,
    code: `L2-${String(i + 2).padStart(2, "0")}`,
    name,
    address: `Ga ${name} (quy hoạch)`,
    district: i < 3 ? "Quận 3" : i < 6 ? "Quận 10" : "Tân Bình",
    lineIds: ["L2"],
    lat,
    lng,
    order: i + 2,
    interchange: false,
    status: "INACTIVE" as const,
    dailyFlow: 0,
  })),
];

/** Kho ga dùng cho màn hình quản lý ga; mảng `stations` được đồng bộ theo để các chỗ chỉ đọc vẫn đúng. */
export const stationsStore = createStore<Station[]>([...stations]);

export function replaceStations(next: Station[]) {
  stations.splice(0, stations.length, ...next);
  stationsStore.set(() => [...next]);
}

/** Một dòng của bảng `line_station`. */
export type LineStation = {
  lineId: string;
  stationId: string;
  order: number;
  /** Khoảng cách từ ga trước (km) theo lý trình đường ray; null với ga đầu tuyến. */
  distanceFromPrevKm: number | null;
  /** Thời gian chạy từ ga trước (giây); null với ga đầu tuyến. */
  travelTimeFromPrevSec: number | null;
  /** Thời gian tàu dừng tại ga (giây), mặc định 30. */
  dwellSec: number;
};

// Lý trình mẫu: khoảng cách đường chim bay × 1,065 (đường ray dài hơn) để tổng Tuyến 1 ≈ 19,7 km,
// thời gian chạy theo tốc độ trung bình 45 km/h giữa hai ga.
function seedLineStations(lineId: string, ordered: Station[]): LineStation[] {
  return ordered.map((s, i) => {
    const km =
      i === 0 ? null : Math.round((haversine(ordered[i - 1], s) / 1000) * 1.065 * 100) / 100;
    return {
      lineId,
      stationId: s.id,
      order: i + 1,
      distanceFromPrevKm: km,
      travelTimeFromPrevSec: km === null ? null : Math.round((km / 45) * 3600),
      dwellSec: 30,
    };
  });
}

const l1Ordered = stations
  .filter((s) => s.lineIds.includes("L1"))
  .sort((a, b) => a.order - b.order);
const l2Ordered = [
  stations.find((s) => s.id === "S1-1")!,
  ...stations.filter((s) => s.id.startsWith("S2-")),
];

export const lineStationsStore = createStore<LineStation[]>([
  ...seedLineStations("L1", l1Ordered),
  ...seedLineStations("L2", l2Ordered),
]);

/** Các dòng tuyến – ga của một tuyến, theo thứ tự ga. */
export const lineStationRows = (lineId: string, rows = lineStationsStore.get()) =>
  rows.filter((r) => r.lineId === lineId).sort((a, b) => a.order - b.order);

/** Ga của một tuyến theo thứ tự trong bảng `line_station`. */
export function lineStations(lineId: string): Station[] {
  return lineStationRows(lineId)
    .map((r) => stations.find((s) => s.id === r.stationId))
    .filter((s): s is Station => !!s);
}

export const busRoutes: BusRoute[] = [
  {
    code: "01",
    name: "Bến Thành – BX Chợ Lớn",
    operator: "HTX 19/5",
    headwayMin: 10,
    hours: "05:00–20:15",
    fare: 5000,
  },
  {
    code: "03",
    name: "Bến Thành – Thạnh Lộc",
    operator: "Saigonbus",
    headwayMin: 8,
    hours: "04:30–21:00",
    fare: 6000,
  },
  {
    code: "19",
    name: "Bến Thành – KCX Linh Trung – ĐHQG",
    operator: "Saigonbus",
    headwayMin: 8,
    hours: "05:00–19:00",
    fare: 7000,
  },
  {
    code: "30",
    name: "Chợ Tân Hương – ĐH Quốc tế",
    operator: "HTX 19/5",
    headwayMin: 12,
    hours: "05:15–19:00",
    fare: 7000,
  },
  {
    code: "50",
    name: "ĐH Bách khoa – ĐHQG",
    operator: "Saigonbus",
    headwayMin: 10,
    hours: "05:00–19:30",
    fare: 7000,
  },
  {
    code: "52",
    name: "Bến Thành – ĐH Quốc tế",
    operator: "Saigonbus",
    headwayMin: 10,
    hours: "05:00–19:00",
    fare: 7000,
  },
  {
    code: "56",
    name: "Chợ Lớn – ĐH GTVT",
    operator: "HTX 19/5",
    headwayMin: 12,
    hours: "05:00–20:00",
    fare: 6000,
  },
  {
    code: "93",
    name: "Bến Thành – ĐH Nông Lâm",
    operator: "Saigonbus",
    headwayMin: 10,
    hours: "05:00–19:00",
    fare: 6000,
  },
  {
    code: "99",
    name: "Chợ Thạnh Mỹ Lợi – ĐHQG",
    operator: "HTX 19/5",
    headwayMin: 15,
    hours: "05:00–19:00",
    fare: 7000,
  },
  {
    code: "150",
    name: "BX Chợ Lớn – Ngã 3 Tân Vạn",
    operator: "Saigonbus",
    headwayMin: 8,
    hours: "04:40–20:30",
    fare: 7000,
  },
  {
    code: "D1",
    name: "Buýt điện Vinhomes – Bến Thành",
    operator: "VinBus",
    headwayMin: 15,
    hours: "05:30–21:00",
    fare: 7000,
  },
];

const stopDefs: [string, string, number, number, string[]][] = [
  ["S1-1", "Trạm Bến Thành (Hàm Nghi)", 0.0012, -0.0015, ["01", "03", "19", "52", "93"]],
  ["S1-1", "Công trường Quách Thị Trang", -0.0008, 0.0012, ["D1", "56"]],
  ["S1-2", "Nhà hát TP (Lê Lợi)", 0.0006, -0.0009, ["03", "19", "56"]],
  ["S1-3", "Bến Bạch Đằng", -0.001, 0.0011, ["D1"]],
  ["S1-4", "Cầu Sài Gòn", 0.0009, 0.001, ["19", "52", "93"]],
  ["S1-5", "Chợ Tân Cảng", -0.0007, 0.0008, ["52", "D1"]],
  ["S1-6", "Xa lộ Hà Nội – Thảo Điền", 0.0007, -0.0006, ["19", "52", "93"]],
  ["S1-7", "Trạm An Phú", 0.001, 0.0005, ["19", "56", "99"]],
  ["S1-8", "Trạm Rạch Chiếc", -0.0009, 0.0007, ["19", "93", "99"]],
  ["S1-9", "Chợ Phước Long", 0.0011, -0.0004, ["99", "150"]],
  ["S1-10", "Ngã tư Bình Thái", 0.0008, 0.0009, ["19", "50", "150"]],
  ["S1-11", "Chợ Thủ Đức", -0.0012, 0.0006, ["19", "30", "50", "93"]],
  ["S1-12", "Khu Công nghệ cao", 0.0007, -0.001, ["19", "50", "99"]],
  ["S1-13", "Đại học Quốc gia", 0.0013, 0.0008, ["19", "30", "50", "52", "99"]],
  ["S1-14", "Suối Tiên – BX Miền Đông mới", -0.001, 0.0009, ["19", "30", "93", "150"]],
];

export const busStops: BusStop[] = stopDefs.map(([sid, name, dLat, dLng, routes], i) => {
  const s = stations.find((x) => x.id === sid)!;
  const walkMinutes = Math.max(2, Math.round((Math.hypot(dLat, dLng) * 111000) / 75));
  return {
    id: `B${i + 1}`,
    name,
    stationId: sid,
    lat: s.lat + dLat,
    lng: s.lng + dLng,
    walkMinutes,
    routes,
  };
});

export const stopsForStation = (id: string) => busStops.filter((b) => b.stationId === id);
export const stationsForRoute = (code: string) =>
  stations.filter((s) => busStops.some((b) => b.stationId === s.id && b.routes.includes(code)));

export const revenue7d = ["T5", "T6", "T7", "CN", "T2", "T3", "T4"].map((d, i) => ({
  day: d,
  ve: 380 + ((i * 53) % 140),
  guiXe: 40 + ((i * 17) % 30),
}));
export const hourlyFlow = Array.from({ length: 18 }, (_, i) => {
  const h = i + 5;
  const peak = h === 7 || h === 8 || h === 17 || h === 18;
  return { hour: `${h}h`, luot: peak ? 9000 + i * 120 : 2500 + ((i * 431) % 2500) };
});

export const vnd = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
