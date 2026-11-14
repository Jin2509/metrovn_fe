import { apiRequest } from "./client";
import { V1, seg } from "./path";
import type {
  CreateOperationConfigBody,
  CreateTrainBody,
  OperationConfigResponse,
  OperationConfigStatus,
  Page,
  TrainListQuery,
  TrainResponse,
  TrainStatus,
  UpdateOperationConfigBody,
  UpdateTrainBody,
} from "./types";

// Đoàn tàu. GET cần đăng nhập; thay đổi cần TRAIN_MANAGE.
export const trainsApi = {
  list: (query: TrainListQuery = {}) => apiRequest<Page<TrainResponse>>(`${V1}/trains`, { query }),
  /** Không phân trang. */
  all: () => apiRequest<TrainResponse[]>(`${V1}/trains/all`),
  get: (trainId: number) => apiRequest<TrainResponse>(`${V1}/trains/${seg(trainId)}`),
  byLine: (lineId: number) => apiRequest<TrainResponse[]>(`${V1}/lines/${seg(lineId)}/trains`),
  create: (body: CreateTrainBody) =>
    apiRequest<TrainResponse>(`${V1}/trains`, { method: "POST", body }),
  update: (trainId: number, body: UpdateTrainBody) =>
    apiRequest<TrainResponse>(`${V1}/trains/${seg(trainId)}`, { method: "PUT", body }),
  /** Body là chuỗi trạng thái trần, ví dụ `"MAINTENANCE"`. */
  setStatus: (trainId: number, status: TrainStatus) =>
    apiRequest<TrainResponse>(`${V1}/trains/${seg(trainId)}/status`, {
      method: "PATCH",
      body: status,
    }),
  remove: (trainId: number) => apiRequest(`${V1}/trains/${seg(trainId)}`, { method: "DELETE" }),
};

// Cấu hình vận hành theo tuyến. Lập/sửa/gửi duyệt/kích hoạt cần OPERATION_MANAGE,
// duyệt/từ chối cần OPERATION_APPROVE. Chỉ sửa được khi còn DRAFT hoặc REJECTED.
const config = (id: number, action?: string) =>
  `${V1}/operation-configs/${seg(id)}${action ? `/${action}` : ""}`;

export const operationConfigsApi = {
  list: (status?: OperationConfigStatus) =>
    apiRequest<OperationConfigResponse[]>(`${V1}/operation-configs`, { query: { status } }),
  byLine: (lineId: number) =>
    apiRequest<OperationConfigResponse[]>(`${V1}/lines/${seg(lineId)}/operation-configs`),
  get: (id: number) => apiRequest<OperationConfigResponse>(config(id)),
  create: (lineId: number, body: CreateOperationConfigBody) =>
    apiRequest<OperationConfigResponse>(`${V1}/lines/${seg(lineId)}/operation-configs`, {
      method: "POST",
      body,
    }),
  update: (id: number, body: UpdateOperationConfigBody) =>
    apiRequest<OperationConfigResponse>(config(id), { method: "PUT", body }),
  submit: (id: number) =>
    apiRequest<OperationConfigResponse>(config(id, "submit"), { method: "POST" }),
  approve: (id: number) =>
    apiRequest<OperationConfigResponse>(config(id, "approve"), { method: "POST" }),
  reject: (id: number, reason: string) =>
    apiRequest<OperationConfigResponse>(config(id, "reject"), {
      method: "POST",
      body: { reason },
    }),
  activate: (id: number) =>
    apiRequest<OperationConfigResponse>(config(id, "activate"), { method: "POST" }),
  deactivate: (id: number) =>
    apiRequest<OperationConfigResponse>(config(id, "deactivate"), { method: "POST" }),
};
