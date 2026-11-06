import type { LineResponse, StationApiStatus, StationResponse } from "@/lib/api";

/** Một dòng trong danh sách ga: ga + các tuyến đi qua (suy ra từ danh sách ga của từng tuyến). */
export type StationListRow = StationResponse & { lines: LineResponse[] };
export type StationStatusFilter = "ALL" | StationApiStatus;

/** Dữ liệu form thêm/sửa ga. Ô số giữ dạng chuỗi để người dùng xoá trắng được khi đang nhập. */
export type StationDraft = {
  code: string;
  name: string;
  address: string;
  district: string;
  imageUrl: string;
  lat: string;
  lng: string;
  interchange: boolean;
  status: StationApiStatus;
};
export type StationErrors = Partial<Record<keyof StationDraft, string>>;
