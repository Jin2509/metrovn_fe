import { createStore } from "@/lib/store";

// Sự cố tại ga (`station_incident`, GIẢ LẬP): backend chưa có API. Mã và trạng thái khớp entity
// `StationIncident` của app mobile, nơi nhân viên ga gửi báo cáo.

export type IncidentType =
  "GATE" | "LIFT" | "EQUIPMENT" | "HYGIENE" | "SECURITY" | "MEDICAL" | "PARKING" | "OTHER";
export type IncidentLocation =
  "ENTRY_GATE" | "EXIT_GATE" | "CONCOURSE" | "PLATFORM" | "PARKING" | "OTHER";
export type IncidentSeverity = "MINOR" | "OPERATIONS" | "EMERGENCY";
export type IncidentStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";
/** Nhân viên chỉ đề xuất báo hành khách, quản trị mới được đăng. */
export type IncidentPublication = "NONE" | "PENDING" | "PUBLISHED";

export type IncidentEvent = {
  kind: "STATUS" | "PUBLISHED" | "PUBLISH_DECLINED";
  status?: IncidentStatus;
  actorName: string;
  at: string;
  note?: string;
};

export type StationIncident = {
  id: string;
  stationId: string;
  type: IncidentType;
  location: IncidentLocation;
  severity: IncidentSeverity;
  status: IncidentStatus;
  publication: IncidentPublication;
  reporterName: string;
  createdAt: string;
  description: string;
  photoUrls: string[];
  history: IncidentEvent[];
  /** Thông báo đang hiện cho hành khách; sự cố xử lý xong thì gỡ. */
  announcementId?: string;
};

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

export const incidentsStore = createStore<StationIncident[]>([
  {
    id: "SC-1006",
    stationId: "S1-1",
    type: "MEDICAL",
    location: "PLATFORM",
    severity: "EMERGENCY",
    status: "OPEN",
    publication: "PENDING",
    reporterName: "Nguyễn Hoài Phương",
    createdAt: minutesAgo(9),
    description: "Hành khách ngất ở đầu sân ga hướng Suối Tiên, đã gọi cấp cứu.",
    photoUrls: [],
    history: [],
  },
  {
    id: "SC-1005",
    stationId: "S1-5",
    type: "GATE",
    location: "ENTRY_GATE",
    severity: "OPERATIONS",
    status: "OPEN",
    publication: "PENDING",
    reporterName: "Đặng Hữu Phúc",
    createdAt: minutesAgo(35),
    description: "Hai cổng soát vé cửa A không nhận mã QR, khách đang xếp hàng dài.",
    photoUrls: [],
    history: [],
  },
  {
    id: "SC-1004",
    stationId: "S1-9",
    type: "LIFT",
    location: "CONCOURSE",
    severity: "OPERATIONS",
    status: "IN_PROGRESS",
    publication: "NONE",
    reporterName: "Võ Thành Long",
    createdAt: minutesAgo(130),
    description: "Thang máy sảnh dừng giữa chừng, đã khóa không cho khách dùng.",
    photoUrls: [],
    history: [
      { kind: "STATUS", status: "IN_PROGRESS", actorName: "Võ Thành Long", at: minutesAgo(100) },
    ],
  },
  {
    id: "SC-1003",
    stationId: "S1-11",
    type: "PARKING",
    location: "PARKING",
    severity: "MINOR",
    status: "OPEN",
    publication: "NONE",
    reporterName: "Lý Mỹ Linh",
    createdAt: minutesAgo(210),
    description: "Barie làn xe máy số 2 chậm mở.",
    photoUrls: [],
    history: [],
  },
  {
    id: "SC-1002",
    stationId: "S1-3",
    type: "LIFT",
    location: "CONCOURSE",
    severity: "MINOR",
    status: "IN_PROGRESS",
    publication: "NONE",
    reporterName: "Trần Minh",
    createdAt: minutesAgo(320),
    description: "Thang cuốn phía cửa B phát tiếng ồn lớn.",
    photoUrls: [],
    history: [
      { kind: "STATUS", status: "IN_PROGRESS", actorName: "Trần Minh", at: minutesAgo(260) },
    ],
  },
  {
    id: "SC-1001",
    stationId: "S1-3",
    type: "HYGIENE",
    location: "PLATFORM",
    severity: "MINOR",
    status: "RESOLVED",
    publication: "NONE",
    reporterName: "Lê Hà",
    createdAt: minutesAgo(1500),
    description: "Sàn ướt gần đầu sân ga.",
    photoUrls: [],
    history: [{ kind: "STATUS", status: "RESOLVED", actorName: "Lê Hà", at: minutesAgo(1440) }],
  },
]);
