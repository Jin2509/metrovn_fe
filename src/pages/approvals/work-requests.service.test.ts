import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ticketPricesApi, type TicketPriceResponse } from "@/lib/api";
import type { Role } from "@/lib/auth";
import { authStore } from "@/lib/auth/session.store";
import { approvalsStore, type Approval } from "@/stores/admin";
import {
  activeWorkRequestStore,
  approvalLinksStore,
  threadsStore,
  workRequestsStore,
} from "@/stores/requests";
import { applyApprovalDecision } from "@/pages/approvals/approvals.service";
import {
  askForInfo,
  beginWorkOnScreen,
  confirmWork,
  createWorkRequest,
  declineWork,
  inboxCount,
  linkToActiveWork,
  postMessage,
  reopenWork,
  resolveWork,
  startWork,
  threadOf,
  toAttachments,
  waitingOn,
} from "@/pages/approvals/work-requests.service";

const seed = {
  approvals: [...approvalsStore.get()],
  requests: [...workRequestsStore.get()],
  threads: { ...threadsStore.get() },
};

const actAs = (role: Role, name: string) =>
  authStore.set(() => ({
    status: "authenticated",
    user: { id: name, name, email: `${role.toLowerCase()}@metro.vn`, role, permissions: [] },
  }));
const asManager = () => actAs("MANAGER", "Quản lý Demo");
const asAdmin = () => actAs("ADMIN", "Nguyễn Văn An");

const find = (id: string) => workRequestsStore.get().find((r) => r.id === id)!;
const newRequest = () =>
  createWorkRequest({
    category: "PARKING_PRICE",
    title: "Cập nhật giá gửi xe",
    description: "Theo bảng giá đính kèm",
    priority: "HIGH",
    attachments: [],
  });

beforeEach(asManager);
afterEach(() => {
  approvalsStore.set(() => seed.approvals);
  workRequestsStore.set(() => seed.requests);
  threadsStore.set(() => seed.threads);
  activeWorkRequestStore.set(() => null);
  approvalLinksStore.set(() => ({}));
  vi.restoreAllMocks();
  authStore.set(() => ({ status: "anonymous", user: null }) as never);
});

describe("Manager gửi, Admin xử lý", () => {
  it("yêu cầu mới chờ Admin và được đếm ở hộp của Admin", () => {
    const id = newRequest();
    expect(find(id)).toMatchObject({ status: "OPEN", by: "Quản lý Demo" });
    expect(waitingOn(find(id), approvalsStore.get())).toBe("ADMIN");
    const before = inboxCount("ADMIN", seed.requests, approvalsStore.get());
    expect(inboxCount("ADMIN", workRequestsStore.get(), approvalsStore.get())).toBe(before + 1);
  });

  it("hỏi lại → Manager trả lời trong luồng → quay về Admin", () => {
    const id = newRequest();
    asAdmin();
    expect(startWork(id)).toBeNull();
    expect(find(id)).toMatchObject({ status: "IN_PROGRESS", handledBy: "Nguyễn Văn An" });
    expect(askForInfo(id, "")).toMatch(/nhập nội dung/);
    expect(askForInfo(id, "Áp dụng từ ngày nào?")).toBeNull();
    expect(find(id).status).toBe("NEEDS_INFO");

    asManager();
    expect(postMessage(id, "Từ 01/12", [], "MANAGER")).toBeNull();
    expect(find(id).status).toBe("IN_PROGRESS");
    expect(threadOf(id).map((m) => m.role)).toEqual([
      "SYSTEM",
      "ADMIN",
      "SYSTEM",
      "MANAGER",
      "SYSTEM",
    ]);
  });

  it("báo hoàn thành → Manager mở lại hoặc xác nhận", () => {
    const id = newRequest();
    asAdmin();
    startWork(id);
    expect(resolveWork(id, "Đã cập nhật")).toBeNull();
    expect(find(id).status).toBe("RESOLVED");
    expect(waitingOn(find(id), approvalsStore.get())).toBe("MANAGER");

    asManager();
    expect(reopenWork(id, "Thiếu giá theo tháng")).toBeNull();
    expect(find(id)).toMatchObject({ status: "IN_PROGRESS", resolution: undefined });

    asAdmin();
    resolveWork(id, "Đã bổ sung giá tháng");
    asManager();
    expect(confirmWork(id)).toBeNull();
    expect(find(id).status).toBe("DONE");
    expect(postMessage(id, "Cảm ơn")).toMatch(/đã hoàn thành/);
  });

  it("không thực hiện có lý do; Manager mở lại khi chưa ai nhận thì về OPEN", () => {
    const id = newRequest();
    asAdmin();
    expect(declineWork(id, "Ngoài phạm vi hệ thống")).toBeNull();
    expect(find(id)).toMatchObject({ status: "DECLINED", resolution: "Ngoài phạm vi hệ thống" });
    asManager();
    // Người từ chối được ghi là người xử lý, nên mở lại thì quay về đúng người đó.
    expect(reopenWork(id, "Đề nghị xem lại")).toBeNull();
    expect(find(id).status).toBe("IN_PROGRESS");
  });

  it("chặn chuyển trạng thái sai thứ tự", () => {
    const id = newRequest();
    expect(confirmWork(id)).toMatch(/đổi trạng thái/);
    expect(resolveWork(id, "xong")).toMatch(/đổi trạng thái/);
    expect(beginWorkOnScreen(id)).toMatch(/đang xử lý/);
  });
});

describe("Gắn đề xuất thay đổi vào yêu cầu", () => {
  /** Admin gửi duyệt một giá vé trên backend khi đang làm yêu cầu; Hộp phê duyệt tải lại mục đó. */
  const startOnScreen = () => {
    const id = newRequest();
    asAdmin();
    startWork(id);
    expect(beginWorkOnScreen(id)).toBeNull();
    const approvalId = "TICKET_PRICE:5";
    linkToActiveWork(approvalId, "Giá vé Vé ngày");
    const approval: Approval = {
      id: approvalId,
      type: "TICKET_PRICE",
      sourceId: 5,
      title: "Giá vé Vé ngày",
      by: "Nguyễn Văn An",
      at: "2026-11-10T02:00:00Z",
      status: "PENDING",
      changes: [{ field: "Giá", old: "40.000 VND", new: "45.000 VND" }],
      workRequestId: approvalLinksStore.get()[approvalId],
    };
    approvalsStore.set((list) => [approval, ...list]);
    return { id, approval };
  };
  const price = {} as TicketPriceResponse;

  it("đề xuất gửi khi đang xử lý tự gắn vào yêu cầu; chờ duyệt thì yêu cầu chờ Manager", () => {
    const { id, approval } = startOnScreen();
    expect(approval.workRequestId).toBe(id);
    expect(threadOf(id).at(-1)?.text).toMatch(/đã gửi đề xuất “Giá vé Vé ngày”/);
    expect(waitingOn(find(id), approvalsStore.get())).toBe("MANAGER");
    expect(resolveWork(id, "xong")).toMatch(/tự hoàn tất/);
  });

  it("Manager duyệt đề xuất ⇒ gọi API duyệt giá, yêu cầu hoàn tất và thôi gắn", async () => {
    const approve = vi.spyOn(ticketPricesApi, "approve").mockResolvedValue(price);
    const { id, approval } = startOnScreen();
    asManager();
    await applyApprovalDecision(approval, "APPROVED");
    expect(approve).toHaveBeenCalledWith(5);
    expect(find(id).status).toBe("DONE");
    expect(activeWorkRequestStore.get()).toBeNull();
  });

  it("Manager từ chối đề xuất ⇒ gửi lý do lên backend, yêu cầu quay lại Admin", async () => {
    const reject = vi.spyOn(ticketPricesApi, "reject").mockResolvedValue(price);
    const { id, approval } = startOnScreen();
    asManager();
    await applyApprovalDecision(approval, "REJECTED", "Giá quá cao");
    expect(reject).toHaveBeenCalledWith(5, "Giá quá cao");
    approvalsStore.set((list) =>
      list.map((a) => (a.id === approval.id ? { ...a, status: "REJECTED" } : a)),
    );
    expect(find(id).status).toBe("IN_PROGRESS");
    expect(waitingOn(find(id), approvalsStore.get())).toBe("ADMIN");
    expect(threadOf(id).at(-1)?.text).toMatch(/bị từ chối: Giá quá cao/);
  });

  it("backend từ chối thao tác thì yêu cầu giữ nguyên", async () => {
    vi.spyOn(ticketPricesApi, "approve").mockRejectedValue(new Error("403"));
    const { id, approval } = startOnScreen();
    asManager();
    await expect(applyApprovalDecision(approval, "APPROVED")).rejects.toThrow();
    expect(find(id).status).toBe("IN_PROGRESS");
  });
});

describe("tệp đính kèm", () => {
  const file = (name: string, size = 10) => new File([new Uint8Array(size)], name);

  it("nhận văn bản, bảng tính, ảnh; chặn đuôi lạ, quá 20MB và quá 5 tệp", () => {
    expect(toAttachments([file("bang-gia.xlsx"), file("anh.PNG")]).error).toBeNull();
    expect(toAttachments([file("script.exe")]).error).toMatch(/\.exe/);
    expect(toAttachments([file("lon.pdf", 21 * 1024 * 1024)]).error).toMatch(/20MB/);
    expect(toAttachments(Array.from({ length: 6 }, (_, i) => file(`${i}.pdf`))).error).toMatch(
      /Tối đa 5/,
    );
  });
});
