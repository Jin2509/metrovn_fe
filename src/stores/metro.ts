import { createStore } from "@/lib/store";

// Kho mạng lưới Metro phía client. Không còn dữ liệu mẫu: tuyến, ga, tuyến–ga lấy từ
// `linesApi`, `stationsApi`, `mapApi`; xe buýt lấy từ `busApi` (xem `@/lib/api`).
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
  description: string;
};

/** Mảng dùng chung cho các chỗ chỉ đọc; nạp dữ liệu bằng `replaceLines`. */
export const lines: MetroLine[] = [];
/** Bản phản ứng của `lines`, dùng khi component cần vẽ lại lúc tải xong. */
export const linesStore = createStore<MetroLine[]>([]);

export function replaceLines(next: MetroLine[]) {
  lines.splice(0, lines.length, ...next);
  linesStore.set(() => [...next]);
}

/** Mảng dùng chung cho các chỗ chỉ đọc; nạp dữ liệu bằng `replaceStations`. */
export const stations: Station[] = [];

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

export const lineStationsStore = createStore<LineStation[]>([]);

/** Các dòng tuyến – ga của một tuyến, theo thứ tự ga. */
export const lineStationRows = (lineId: string, rows = lineStationsStore.get()) =>
  rows.filter((r) => r.lineId === lineId).sort((a, b) => a.order - b.order);

/** Ga của một tuyến theo thứ tự trong bảng `line_station`. */
export function lineStations(lineId: string): Station[] {
  return lineStationRows(lineId)
    .map((r) => stations.find((s) => s.id === r.stationId))
    .filter((s): s is Station => !!s);
}

export const busRoutes: BusRoute[] = [];
export const busStops: BusStop[] = [];
/** Tăng mỗi lần nạp lại `busRoutes`/`busStops` để component đang đọc hai mảng trên vẽ lại. */
export const busVersionStore = createStore(0);

export function replaceBusData(routes: BusRoute[], stops: BusStop[]) {
  busRoutes.splice(0, busRoutes.length, ...routes);
  busStops.splice(0, busStops.length, ...stops);
  busVersionStore.set((v) => v + 1);
}

export const stopsForStation = (id: string) => busStops.filter((b) => b.stationId === id);
export const stationsForRoute = (code: string) =>
  stations.filter((s) => busStops.some((b) => b.stationId === s.id && b.routes.includes(code)));
