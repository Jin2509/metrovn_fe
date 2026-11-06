import type { Role } from "@/lib/auth";
import { getActorName } from "@/lib/auth";
import { approvalsStore, logAction, type Approval } from "@/mocks/admin";
import {
  activeWorkRequestStore,
  appendThreadMessage,
  nextId,
  nowLabel,
  threadsStore,
  workRequestsStore,
  type Attachment,
  type WorkCategory,
  type WorkPriority,
  type WorkRequest,
  type WorkStatus,
} from "@/mocks/requests";
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MAX_FILES,
} from "@/pages/approvals/work-requests.constants";

/**
 * Luồng yêu cầu Manager → Admin. Mọi hàm trả về thông báo lỗi (string) hoặc null khi thành công.
 * Chuyển trạng thái nào cũng ghi một dòng hệ thống vào luồng trao đổi để giữ lịch sử.
 *
 *   OPEN ──nhận──▶ IN_PROGRESS ──báo xong──▶ RESOLVED ──Manager xác nhận──▶ DONE
 *                    │  ▲                       └──Manager mở lại──▶ IN_PROGRESS
 *          cần bổ sung│  │Manager trả lời
 *                    ▼  │
 *                 NEEDS_INFO
 *   Đề xuất gắn kèm được duyệt ⇒ DONE ngay (Manager đã xem đúng thay đổi khi duyệt).
 *   OPEN / IN_PROGRESS / NEEDS_INFO ──không thực hiện──▶ DECLINED ──Manager mở lại──▶ OPEN/IN_PROGRESS
 *
 * Quyền theo vai trò được chặn ở UI (ACTION_ACCESS); backend thật phải kiểm tra lại.
 */

export const isClosed = (status: WorkStatus) => status === "DONE" || status === "DECLINED";

export const linkedChanges = (id: string, approvals: Approval[]) =>
  approvals.filter((approval) => approval.workRequestId === id);

const hasPendingChange = (id: string, approvals: Approval[]) =>
  linkedChanges(id, approvals).some((approval) => approval.status === "PENDING");

/** Bước tiếp theo đang chờ vai trò nào. Đang chờ Manager duyệt đề xuất gắn kèm cũng tính là chờ Manager. */
export function waitingOn(request: WorkRequest, approvals: Approval[]): Role | null {
  switch (request.status) {
    case "OPEN":
      return "ADMIN";
    case "IN_PROGRESS":
      return hasPendingChange(request.id, approvals) ? "MANAGER" : "ADMIN";
    case "NEEDS_INFO":
    case "RESOLVED":
      return "MANAGER";
    default:
      return null;
  }
}

/** Số việc hiện ở huy hiệu menu "Hộp yêu cầu" của từng vai trò. */
export function inboxCount(role: Role, requests: WorkRequest[], approvals: Approval[]): number {
  if (role === "ADMIN") return requests.filter((r) => waitingOn(r, approvals) === "ADMIN").length;
  if (role !== "MANAGER") return 0;
  // Đề xuất chờ duyệt đã được đếm riêng, nên ở đây chỉ đếm yêu cầu chờ Manager trả lời/xác nhận.
  const pendingChanges = approvals.filter((a) => a.status === "PENDING").length;
  const toAnswer = requests.filter((r) => r.status === "NEEDS_INFO" || r.status === "RESOLVED");
  return pendingChanges + toAnswer.length;
}

export function isOverdue(request: WorkRequest, today = new Date().toISOString().slice(0, 10)) {
  return !!request.dueDate && !isClosed(request.status) && request.dueDate < today;
}

/** Chuyển File của trình duyệt thành tệp đính kèm, kiểm tra số lượng, dung lượng và đuôi file. */
export function toAttachments(files: File[]): { attachments: Attachment[]; error: string | null } {
  if (files.length > ATTACHMENT_MAX_FILES)
    return { attachments: [], error: `Tối đa ${ATTACHMENT_MAX_FILES} tệp mỗi lần gửi` };
  const allowed = ATTACHMENT_ACCEPT.split(",");
  for (const file of files) {
    const extension = "." + (file.name.split(".").pop() ?? "").toLowerCase();
    if (!allowed.includes(extension))
      return { attachments: [], error: `Không nhận loại tệp ${extension} (${file.name})` };
    if (file.size > ATTACHMENT_MAX_BYTES)
      return { attachments: [], error: `${file.name} vượt quá 20MB` };
  }
  return {
    attachments: files.map((file) => ({
      id: nextId("F"),
      name: file.name,
      size: file.size,
      type: file.type,
      url: typeof URL.createObjectURL === "function" ? URL.createObjectURL(file) : undefined,
    })),
    error: null,
  };
}

export type WorkRequestInput = {
  category: WorkCategory;
  title: string;
  description: string;
  priority: WorkPriority;
  dueDate?: string;
  attachments: Attachment[];
};

export function validateWorkRequest(input: WorkRequestInput) {
  const errors: Partial<Record<keyof WorkRequestInput, string>> = {};
  if (!input.title.trim()) errors.title = "Vui lòng nhập tiêu đề";
  else if (input.title.trim().length > 120) errors.title = "Tiêu đề tối đa 120 ký tự";
  if (!input.description.trim()) errors.description = "Vui lòng mô tả việc cần làm";
  if (input.dueDate && input.dueDate < new Date().toISOString().slice(0, 10))
    errors.dueDate = "Hạn xử lý không được ở quá khứ";
  return errors;
}

/** Manager gửi yêu cầu cho Admin. Trả về mã yêu cầu. */
export function createWorkRequest(input: WorkRequestInput): string {
  const id = nextId("W");
  workRequestsStore.set((list) => [
    {
      id,
      category: input.category,
      title: input.title.trim(),
      description: input.description.trim(),
      priority: input.priority,
      dueDate: input.dueDate || undefined,
      by: getActorName(),
      at: nowLabel(),
      status: "OPEN",
      attachments: input.attachments,
    },
    ...list,
  ]);
  logAction("Gửi yêu cầu cho Admin", input.title.trim());
  return id;
}

function update(
  id: string,
  allowed: WorkStatus[],
  patch: (request: WorkRequest) => Partial<WorkRequest>,
): WorkRequest | string {
  const request = workRequestsStore.get().find((r) => r.id === id);
  if (!request) return "Không tìm thấy yêu cầu";
  if (!allowed.includes(request.status)) return "Yêu cầu đã đổi trạng thái, hãy tải lại";
  const next = { ...request, ...patch(request) };
  workRequestsStore.set((list) => list.map((r) => (r.id === id ? next : r)));
  if (isClosed(next.status) && activeWorkRequestStore.get() === id)
    activeWorkRequestStore.set(() => null);
  return next;
}

const done = (result: WorkRequest | string) => (typeof result === "string" ? result : null);

/** Admin nhận việc. */
export function startWork(id: string) {
  const result = update(id, ["OPEN"], () => ({ status: "IN_PROGRESS", handledBy: getActorName() }));
  if (typeof result === "string") return result;
  appendThreadMessage(id, `${getActorName()} đã nhận xử lý.`, { system: true });
  logAction("Nhận yêu cầu", result.title);
  return null;
}

/** Admin hỏi lại Manager. Câu hỏi là bắt buộc để Manager biết cần bổ sung gì. */
export function askForInfo(id: string, question: string, attachments: Attachment[] = []) {
  if (!question.trim()) return "Vui lòng nhập nội dung cần bổ sung";
  const result = update(id, ["IN_PROGRESS"], () => ({ status: "NEEDS_INFO" }));
  if (typeof result === "string") return result;
  appendThreadMessage(id, question.trim(), { attachments });
  appendThreadMessage(id, "Chuyển sang chờ Manager bổ sung.", { system: true });
  return null;
}

/** Admin báo hoàn thành (việc không cần đổi dữ liệu, hoặc đã xong ngoài hệ thống). */
export function resolveWork(id: string, note: string, attachments: Attachment[] = []) {
  if (!note.trim()) return "Vui lòng ghi kết quả xử lý";
  if (hasPendingChange(id, approvalsStore.get()))
    return "Còn đề xuất gắn kèm đang chờ Manager duyệt, yêu cầu sẽ tự hoàn tất khi được duyệt";
  const result = update(id, ["IN_PROGRESS"], () => ({
    status: "RESOLVED",
    resolution: note.trim(),
  }));
  if (typeof result === "string") return result;
  appendThreadMessage(id, note.trim(), { attachments });
  appendThreadMessage(id, "Báo hoàn thành, chờ Manager xác nhận.", { system: true });
  logAction("Báo hoàn thành yêu cầu", result.title);
  return null;
}

/** Admin không thực hiện, kèm lý do. */
export function declineWork(id: string, reason: string) {
  if (!reason.trim()) return "Vui lòng nhập lý do";
  const result = update(id, ["OPEN", "IN_PROGRESS", "NEEDS_INFO"], (r) => ({
    status: "DECLINED",
    resolution: reason.trim(),
    handledBy: r.handledBy ?? getActorName(),
  }));
  if (typeof result === "string") return result;
  appendThreadMessage(id, `Không thực hiện. Lý do: ${reason.trim()}`, { system: true });
  logAction("Từ chối yêu cầu", result.title);
  return null;
}

/** Manager xác nhận kết quả Admin báo. */
export function confirmWork(id: string) {
  const result = update(id, ["RESOLVED"], () => ({ status: "DONE" }));
  if (typeof result === "string") return result;
  appendThreadMessage(id, `${getActorName()} đã xác nhận hoàn thành.`, { system: true });
  logAction("Xác nhận hoàn thành yêu cầu", result.title);
  return null;
}

/** Manager mở lại khi kết quả chưa đạt hoặc không đồng ý lý do từ chối. */
export function reopenWork(id: string, reason: string) {
  if (!reason.trim()) return "Vui lòng nhập lý do mở lại";
  const result = update(id, ["RESOLVED", "DECLINED"], (r) => ({
    status: r.handledBy ? "IN_PROGRESS" : "OPEN",
    resolution: undefined,
  }));
  if (typeof result === "string") return result;
  appendThreadMessage(id, reason.trim());
  appendThreadMessage(id, `${getActorName()} đã mở lại yêu cầu.`, { system: true });
  logAction("Mở lại yêu cầu", result.title);
  return null;
}

/**
 * Gửi tin nhắn vào luồng trao đổi của một yêu cầu bất kỳ (W… hoặc A…).
 * Manager trả lời khi yêu cầu đang "Cần bổ sung" thì yêu cầu quay về cho Admin xử lý.
 */
export function postMessage(
  requestId: string,
  text: string,
  attachments: Attachment[] = [],
  role?: Role,
) {
  if (!text.trim() && attachments.length === 0) return "Nhập nội dung hoặc đính kèm tệp";
  const request = workRequestsStore.get().find((r) => r.id === requestId);
  if (request?.status === "DONE") return "Yêu cầu đã hoàn thành, không thể trao đổi thêm";
  appendThreadMessage(requestId, text.trim(), { attachments });
  if (request?.status === "NEEDS_INFO" && role === "MANAGER") {
    update(requestId, ["NEEDS_INFO"], () => ({ status: "IN_PROGRESS" }));
    appendThreadMessage(requestId, "Manager đã bổ sung, chuyển lại cho Admin.", { system: true });
  }
  return null;
}

/** Admin bắt đầu làm trên màn hình cấu hình: đề xuất gửi duyệt từ lúc này tự gắn vào yêu cầu. */
export function beginWorkOnScreen(id: string) {
  const request = workRequestsStore.get().find((r) => r.id === id);
  if (!request || request.status !== "IN_PROGRESS") return "Chỉ gắn đề xuất cho yêu cầu đang xử lý";
  activeWorkRequestStore.set(() => id);
  return null;
}

export function stopActiveWork() {
  activeWorkRequestStore.set(() => null);
}

/**
 * Gọi sau khi Manager quyết định một đề xuất. Đề xuất có gắn yêu cầu thì cập nhật yêu cầu đó:
 * duyệt (và không còn đề xuất nào khác đang chờ) ⇒ DONE; từ chối ⇒ yêu cầu quay về Admin.
 */
export function syncAfterChangeDecision(approval: Approval, approved: boolean, reason?: string) {
  const id = approval.workRequestId;
  const request = id && workRequestsStore.get().find((r) => r.id === id);
  if (!id || !request || isClosed(request.status)) return;
  if (approved) {
    appendThreadMessage(id, `Đề xuất “${approval.title}” đã được duyệt.`, { system: true });
    if (hasPendingChange(id, approvalsStore.get())) return;
    update(id, ["IN_PROGRESS", "NEEDS_INFO", "RESOLVED"], () => ({
      status: "DONE",
      resolution: `Hoàn tất qua đề xuất “${approval.title}”.`,
    }));
    appendThreadMessage(id, "Yêu cầu hoàn tất.", { system: true });
    return;
  }
  appendThreadMessage(
    id,
    `Đề xuất “${approval.title}” bị từ chối${reason ? `: ${reason}` : ""}. Yêu cầu quay lại cho Admin.`,
    { system: true },
  );
  if (request.status !== "IN_PROGRESS")
    update(id, ["NEEDS_INFO", "RESOLVED"], () => ({ status: "IN_PROGRESS" }));
}

/** Dùng trong test: số tin nhắn của một yêu cầu. */
export const threadOf = (id: string) => threadsStore.get()[id] ?? [];
