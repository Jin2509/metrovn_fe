import { hasPendingApproval, submitApproval, approvalsStore } from "@/mocks/admin";
import { systemParamsStore, type SystemParam } from "@/mocks/system-params";

export type ParamValues = Record<string, number>;

const label = (param: SystemParam, value: number) =>
  `${value.toLocaleString("vi-VN")} ${param.unit}`;

export const toValues = (params: SystemParam[]): ParamValues =>
  Object.fromEntries(params.map((param) => [param.key, param.value]));

export function validateParams(params: SystemParam[], values: ParamValues): string[] {
  const errors = params.flatMap((param) => {
    const value = values[param.key];
    if (!Number.isFinite(value)) return [`${param.label}: vui lòng nhập số`];
    if (value < param.min || value > param.max)
      return [`${param.label} phải từ ${param.min} đến ${param.max} ${param.unit}`];
    return [];
  });
  if (values["student.minReadablePercent"] >= values["student.autoApprovePercent"])
    errors.push("Ngưỡng tự duyệt phải cao hơn ngưỡng coi là đọc được.");
  return errors;
}

export function diffParams(params: SystemParam[], values: ParamValues) {
  return params
    .filter((param) => values[param.key] !== param.value)
    .map((param) => ({
      field: param.label,
      old: label(param, param.value),
      new: label(param, values[param.key]),
    }));
}

export const PARAM_APPROVAL_TITLE = "Thay đổi tham số hệ thống";

export function submitParams(values: ParamValues): string | null {
  const params = systemParamsStore.get();
  if (hasPendingApproval("SYSTEM_PARAM", () => true))
    return "Đang có một yêu cầu thay đổi tham số chờ Manager duyệt.";
  const errors = validateParams(params, values);
  if (errors.length) return errors[0];
  const changes = diffParams(params, values);
  if (!changes.length) return "Chưa có tham số nào thay đổi.";
  submitApproval("SYSTEM_PARAM", PARAM_APPROVAL_TITLE, changes, values);
  return null;
}

/** Áp dụng khi Manager duyệt; lưu người đề xuất và thời điểm để tra cứu về sau. */
export function applyParams(values: ParamValues, requestedBy: string, at = new Date()) {
  systemParamsStore.set((params) =>
    params.map((param) =>
      param.key in values && values[param.key] !== param.value
        ? {
            ...param,
            value: values[param.key],
            updatedBy: requestedBy,
            updatedAt: at.toLocaleString("vi-VN"),
          }
        : param,
    ),
  );
}

export const latestParamApproval = (approvals = approvalsStore.get()) =>
  approvals.find((approval) => approval.type === "SYSTEM_PARAM");
