// Dữ liệu giả cho Metro TP.HCM — thay bằng API thật qua tầng service sau này.
export type Station = {
  id: string;
  name: string;
  lineIds: string[];
  lat: number;
  lng: number;
  order: number;
  interchange: boolean;
  status: "ACTIVE" | "INACTIVE";
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
    name,
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
    name,
    lineIds: ["L2"],
    lat,
    lng,
    order: i + 2,
    interchange: false,
    status: "INACTIVE" as const,
    dailyFlow: 0,
  })),
];

export function lineStations(lineId: string) {
  const list = stations.filter((s) => s.lineIds.includes(lineId));
  if (lineId === "L2") {
    const bt = stations.find((s) => s.id === "S1-1")!;
    return [bt, ...list.filter((s) => s.id !== "S1-1")];
  }
  return list.sort((a, b) => a.order - b.order);
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
