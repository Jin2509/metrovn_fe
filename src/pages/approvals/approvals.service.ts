import { useQueries } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  announcementsApi,
  apiErrorMessage,
  operationConfigsApi,
  ticketPricesApi,
  ticketProductsApi,
  type AnnouncementResponse,
  type OperationConfigResponse,
  type TicketPriceResponse,
  type TicketProductResponse,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { lineCode } from "@/lib/network";
import { operationsKeys } from "@/lib/operations.queries";
import { fmtInstant } from "@/lib/query-sync";
import { ticketKeys } from "@/lib/catalogs";
import { approvalsStore, type Approval, type ApprovalType } from "@/stores/admin";
import { linesStore } from "@/stores/metro";
import { approvalLinksStore } from "@/stores/requests";
import {
  ANNOUNCEMENTS_KEY,
  scopeLabel,
  toAnnouncement,
} from "@/pages/notifications/notifications.service";
import { SEVERITY_LABELS } from "@/pages/notifications/notifications.constants";
import type { ApprovalDecisionStatus } from "@/pages/approvals/approvals.types";
import { syncAfterChangeDecision } from "@/pages/approvals/work-requests.service";

// Hộp phê duyệt gom các mục backend có luồng duyệt riêng: cấu hình vận hành, giá vé, thông báo.
// Bản nháp không hiện ở đây; quyết định gọi đúng API duyệt/từ chối của từng loại.

export const approvalId = (type: ApprovalType, sourceId: number | string) => `${type}:${sourceId}`;

const status = (s: string): Approval["status"] | null => {
  if (s === "PENDING_APPROVAL") return "PENDING";
  if (s === "REJECTED") return "REJECTED";
  if (s === "DRAFT") return null;
  return "APPROVED";
};

const money = (n: number) => `${n.toLocaleString("vi-VN")} VND`;
const hours = (c: Pick<OperationConfigResponse, "startTime" | "endTime">) =>
  `${c.startTime.slice(0, 5)} – ${c.endTime.slice(0, 5)}`;
const dmy = (d: string | null) => (d ? d.split("-").reverse().join("/") : "không thời hạn");

function fromConfig(c: OperationConfigResponse, all: OperationConfigResponse[]): Approval | null {
  const s = status(c.status);
  if (!s) return null;
  // So với bản đang áp dụng của tuyến để Manager thấy thay đổi gì.
  const current = all.find((x) => x.lineId === c.lineId && x.status === "ACTIVE" && x.id !== c.id);
  const row = (field: string, f: (x: OperationConfigResponse) => string) => ({
    field,
    old: current ? f(current) : "—",
    new: f(c),
  });
  return {
    id: approvalId("OPERATION", c.id),
    type: "OPERATION",
    sourceId: c.id,
    title: `Cấu hình vận hành ${lineCode(String(c.lineId))} v${c.version}`,
    by: c.createdBy,
    at: c.submittedAt ?? c.createdAt,
    status: s,
    reason: c.rejectionReason ?? undefined,
    decidedBy: c.approvedBy,
    changes: [
      row("Giờ vận hành", hours),
      row("Giãn cách", (x) => `${x.headwayMinutes} phút`),
      row("Số đoàn tàu", (x) => String(x.numberOfTrains)),
      row(
        "Thời gian chạy / quay đầu",
        (x) => `${x.runningTimeMinutes} / ${x.turnaroundTimeMinutes ?? 0} phút`,
      ),
      row("Hiệu lực", (x) => `${dmy(x.effectiveFrom)} → ${dmy(x.effectiveTo)}`),
    ],
  };
}

function fromPrice(p: TicketPriceResponse, products: TicketProductResponse[]): Approval | null {
  const s = status(p.status);
  if (!s) return null;
  const product = products.find((x) => x.id === p.productId);
  return {
    id: approvalId("TICKET_PRICE", p.id),
    type: "TICKET_PRICE",
    sourceId: p.id,
    title: `Giá vé ${product?.name ?? p.productCode}`,
    by: p.createdBy,
    at: p.submittedAt ?? p.effectiveFrom,
    status: s,
    reason: p.rejectionReason ?? undefined,
    decidedBy: p.approvedBy,
    changes: [
      { field: "Giá", old: product ? money(product.priceVnd) : "—", new: money(p.priceVnd) },
      { field: "Áp dụng từ", old: "—", new: fmtInstant(p.effectiveFrom) },
    ],
  };
}

function fromAnnouncement(raw: AnnouncementResponse): Approval | null {
  const s = status(raw.status);
  if (!s) return null;
  const a = toAnnouncement(raw);
  const added = (field: string, value: string) => ({ field, old: "—", new: value });
  return {
    id: approvalId("ANNOUNCEMENT", raw.id),
    type: "ANNOUNCEMENT",
    sourceId: raw.id,
    title: `Thông báo: ${a.title}`,
    by: a.createdBy,
    at: a.updatedAt,
    status: s,
    reason: a.rejectionReason ?? undefined,
    decidedBy: a.approvedBy,
    changes: [
      added("Nội dung", a.content),
      added("Mức độ", SEVERITY_LABELS[a.severity]),
      added("Phạm vi", scopeLabel(a)),
      added(
        "Hiệu lực",
        `${fmtInstant(a.startsAt)} → ${a.endsAt ? fmtInstant(a.endsAt) : "không thời hạn"}`,
      ),
    ],
  };
}

const PRICE_PAGE = 100;

/**
 * Tải các mục duyệt mà người dùng được xem, gộp thành `Approval[]` và đẩy vào `approvalsStore`
 * (để menu và trang tổng quan đếm số việc chờ). Mỗi nguồn chỉ tải khi có quyền tương ứng.
 */
export function useApprovalsData() {
  const { hasPermission } = useAuth();
  const canOps = hasPermission("OPERATION_APPROVE") || hasPermission("OPERATION_MANAGE");
  const canFare = hasPermission("FARE_APPROVE") || hasPermission("FARE_MANAGE");
  const canAnnounce = hasPermission("ANNOUNCEMENT_APPROVE") || hasPermission("ANNOUNCEMENT_MANAGE");
  const [configs, prices, products, announcements] = useQueries({
    queries: [
      {
        queryKey: operationsKeys.configs,
        queryFn: () => operationConfigsApi.list(),
        enabled: canOps,
        retry: false,
      },
      {
        queryKey: [...ticketKeys.prices, "approvals"],
        queryFn: () => ticketPricesApi.list({ size: PRICE_PAGE }),
        enabled: canFare,
        retry: false,
      },
      {
        queryKey: ticketKeys.products,
        queryFn: ticketProductsApi.all,
        enabled: canFare,
        retry: false,
      },
      {
        queryKey: ANNOUNCEMENTS_KEY,
        queryFn: () => announcementsApi.list(),
        enabled: canAnnounce,
        retry: false,
      },
    ],
  });
  const links = approvalLinksStore.use();
  // Tiêu đề cấu hình vận hành dùng mã tuyến: dựng lại khi dữ liệu tuyến tải xong.
  const lines = linesStore.use();
  const key = [configs, prices, products, announcements].map((q) => q.dataUpdatedAt).join(",");

  useEffect(() => {
    const list = [
      ...(configs.data ?? []).map((c) => fromConfig(c, configs.data ?? [])),
      ...(prices.data?.content ?? []).map((p) => fromPrice(p, products.data ?? [])),
      ...(announcements.data ?? []).map(fromAnnouncement),
    ]
      .filter((a): a is Approval => !!a)
      .map((a) => ({ ...a, workRequestId: links[a.id] }))
      .sort((a, b) => b.at.localeCompare(a.at));
    approvalsStore.set(() => list);
    // `key` đổi khi một trong các nguồn có dữ liệu mới.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, links, lines]);

  const error = [configs, prices, announcements].find((q) => q.error)?.error;
  return {
    loading: [configs, prices, announcements].some((q) => q.isPending && q.fetchStatus !== "idle"),
    loadError: error ? apiErrorMessage(error) : "",
    canDecide: {
      OPERATION: hasPermission("OPERATION_APPROVE"),
      TICKET_PRICE: hasPermission("FARE_APPROVE"),
      ANNOUNCEMENT: hasPermission("ANNOUNCEMENT_APPROVE"),
    } satisfies Record<ApprovalType, boolean>,
  };
}

/** Khoá query cần tải lại sau khi quyết định một mục. */
export const sourceKey = (type: ApprovalType) =>
  type === "OPERATION"
    ? operationsKeys.configs
    : type === "TICKET_PRICE"
      ? ticketKeys.prices
      : ANNOUNCEMENTS_KEY;

/** Manager quyết định một mục: gọi API của đúng loại rồi cập nhật yêu cầu công việc gắn kèm. */
export async function applyApprovalDecision(
  approval: Approval,
  decision: ApprovalDecisionStatus,
  reason?: string,
) {
  const id = approval.sourceId;
  const approved = decision === "APPROVED";
  if (approval.type === "OPERATION")
    await (approved ? operationConfigsApi.approve(id) : operationConfigsApi.reject(id, reason!));
  else if (approval.type === "TICKET_PRICE")
    await (approved ? ticketPricesApi.approve(id) : ticketPricesApi.reject(id, reason!));
  else await (approved ? announcementsApi.approve(id) : announcementsApi.reject(id, reason!));
  syncAfterChangeDecision(approval, approved, reason);
}
