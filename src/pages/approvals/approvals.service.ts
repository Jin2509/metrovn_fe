import { CATALOGS } from "@/lib/catalogs";
import { applyCatalogChange, checkCatalogChange, isCatalogPayload } from "@/lib/change-requests";
import { getActorName } from "@/lib/auth/session.store";
import {
  applyLineOrderApproval,
  applyStationApproval,
  type LineApprovalPayload,
  type StationApprovalPayload,
} from "@/lib/network";
import { approvalsStore, logAction, type Approval } from "@/mocks/admin";
import type { ApprovalDecisionStatus } from "@/pages/approvals/approvals.types";
import { applyGreenConfig } from "@/pages/green/green.service";
import { applyParams, type ParamValues } from "@/pages/systemparams/systemparams.service";
import { applyOperationDecision } from "@/pages/trains/trains.service";

/**
 * Manager quyết định một yêu cầu. Dữ liệu chỉ được ghi ở đây, khi chọn "Phê duyệt".
 * Trả về thông báo lỗi nếu yêu cầu không còn áp dụng được; khi đó yêu cầu vẫn ở trạng thái chờ.
 */
export function applyApprovalDecision(
  approval: Approval,
  status: ApprovalDecisionStatus,
  reason?: string,
): string | null {
  const { payload } = approval;
  const catalog = isCatalogPayload(payload) ? CATALOGS[payload.catalog] : undefined;
  if (status === "APPROVED" && catalog) {
    const conflict = checkCatalogChange(catalog, payload as never);
    if (conflict) return `Không áp dụng được: ${conflict}. Hãy từ chối yêu cầu này.`;
  }

  approvalsStore.set((approvals) =>
    approvals.map((currentApproval) =>
      currentApproval.id === approval.id
        ? { ...currentApproval, status, reason, decidedBy: getActorName() }
        : currentApproval,
    ),
  );

  if (approval.type === "OPERATION") applyOperationDecision(status === "APPROVED", getActorName());

  if (status === "APPROVED") {
    if (catalog) applyCatalogChange(catalog, payload as never);
    if (approval.type === "STATION") applyStationApproval(payload as StationApprovalPayload);
    if (approval.type === "LINE") applyLineOrderApproval(payload as LineApprovalPayload);
    if (approval.type === "GREEN_POLICY") applyGreenConfig(payload);
    if (approval.type === "SYSTEM_PARAM") applyParams(payload as ParamValues, approval.by);
  }

  logAction(status === "APPROVED" ? "Phê duyệt" : "Từ chối", approval.title);
  return null;
}
