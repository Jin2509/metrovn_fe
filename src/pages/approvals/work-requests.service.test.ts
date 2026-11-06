import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Role } from "@/lib/auth";
import { authStore } from "@/lib/auth/session.store";
import { approvalsStore, submitApproval } from "@/mocks/admin";
import { activeWorkRequestStore, threadsStore, workRequestsStore } from "@/mocks/requests";
import { applyApprovalDecision } from "@/pages/approvals/approvals.service";
import {
  askForInfo,
  beginWorkOnScreen,
  confirmWork,
  createWorkRequest,
  declineWork,
  inboxCount,
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
  const startOnScreen = () => {
    const id = newRequest();
    asAdmin();
    startWork(id);
    expect(beginWorkOnScreen(id)).toBeNull();
    const approvalId = submitApproval("PARKING_PRICE", "Giá xe máy / lượt", [
      { field: "Giá", old: "5.000 VND", new: "6.000 VND" },
    ]);
    return {
      id,
      approvalId,
      approval: () => approvalsStore.get().find((a) => a.id === approvalId)!,
    };
  };

  it("đề xuất gửi khi đang xử lý tự gắn vào yêu cầu; chờ duyệt thì yêu cầu chờ Manager", () => {
    const { id, approval } = startOnScreen();
    expect(approval().workRequestId).toBe(id);
    expect(threadOf(id).at(-1)?.text).toMatch(/đã gửi đề xuất “Giá xe máy \/ lượt”/);
    expect(waitingOn(find(id), approvalsStore.get())).toBe("MANAGER");
    expect(resolveWork(id, "xong")).toMatch(/tự hoàn tất/);
  });

  it("Manager duyệt đề xuất ⇒ yêu cầu hoàn tất và thôi gắn", () => {
    const { id, approval } = startOnScreen();
    asManager();
    expect(applyApprovalDecision(approval(), "APPROVED")).toBeNull();
    expect(find(id).status).toBe("DONE");
    expect(activeWorkRequestStore.get()).toBeNull();
  });

  it("Manager từ chối đề xuất ⇒ yêu cầu quay lại Admin", () => {
    const { id, approval } = startOnScreen();
    asManager();
    applyApprovalDecision(approval(), "REJECTED", "Giá quá cao");
    expect(find(id).status).toBe("IN_PROGRESS");
    expect(waitingOn(find(id), approvalsStore.get())).toBe("ADMIN");
    expect(threadOf(id).at(-1)?.text).toMatch(/bị từ chối: Giá quá cao/);
  });

  it("không ai tự duyệt đề xuất của mình, và không quyết định lại đề xuất đã xong", () => {
    const { approval } = startOnScreen();
    expect(applyApprovalDecision(approval(), "APPROVED")).toMatch(/chính mình/);
    asManager();
    const stale = approval();
    applyApprovalDecision(stale, "APPROVED");
    expect(applyApprovalDecision(stale, "REJECTED", "đổi ý")).toMatch(/quyết định trước đó/);
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
