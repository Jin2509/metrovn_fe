import { useNavigate } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ReasonDialog, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { navGroups } from "@/components/layout/nav.config";
import type { Approval } from "@/mocks/admin";
import { activeWorkRequestStore, type WorkRequest } from "@/mocks/requests";
import { NoteDialog } from "@/pages/approvals/components/NoteDialog";
import { AttachmentList } from "@/pages/approvals/components/RequestAttachments";
import { RequestThread } from "@/pages/approvals/components/RequestThread";
import {
  WorkPriorityBadge,
  WorkStatusBadge,
} from "@/pages/approvals/components/WorkRequestListSection";
import {
  WORK_CATEGORY_LABELS,
  WORK_CATEGORY_ROUTE,
} from "@/pages/approvals/work-requests.constants";
import {
  askForInfo,
  beginWorkOnScreen,
  confirmWork,
  declineWork,
  isOverdue,
  linkedChanges,
  reopenWork,
  resolveWork,
  startWork,
  stopActiveWork,
} from "@/pages/approvals/work-requests.service";

type Pending = "ask" | "resolve" | "decline" | "reopen" | null;

const screenLabel = (to: string) =>
  navGroups.flatMap((group) => group.items).find((item) => item.to === to)?.label ?? to;

function report(error: string | null, success: string) {
  if (error) {
    toast.error(error);
    return error;
  }
  toast.success(success);
  return null;
}

export function WorkRequestDetailSheet({
  request,
  approvals,
  onClose,
  onOpenApproval,
}: {
  request: WorkRequest | null;
  approvals: Approval[];
  onClose: () => void;
  /** Mở đề xuất gắn kèm (ở tab đề xuất của vai trò hiện tại). */
  onOpenApproval: (approval: Approval) => void;
}) {
  const { can } = useAuth();
  const navigate = useNavigate();
  const active = activeWorkRequestStore.use();
  const [pending, setPending] = useState<Pending>(null);
  const handler = can("workRequest.handle");
  const requester = can("workRequest.create");

  const id = request?.id ?? "";
  const status = request?.status;
  const changes = request ? linkedChanges(request.id, approvals) : [];
  const screen = request && WORK_CATEGORY_ROUTE[request.category];

  const goToScreen = () => {
    if (!screen) return;
    const error = beginWorkOnScreen(id);
    if (error) return toast.error(error);
    navigate({ to: screen.to, search: screen.tab ? { tab: screen.tab } : {} } as never);
  };

  return (
    <>
      <Sheet open={!!request} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="overflow-y-auto sm:max-w-xl">
          {request && (
            <>
              <SheetHeader>
                <SheetTitle>{request.title}</SheetTitle>
                <SheetDescription>
                  {request.id} · {WORK_CATEGORY_LABELS[request.category]} · {request.by} gửi lúc{" "}
                  {request.at}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-5 py-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <WorkStatusBadge status={request.status} />
                  <WorkPriorityBadge priority={request.priority} />
                  {request.dueDate && (
                    <span
                      className={isOverdue(request) ? "text-destructive" : "text-muted-foreground"}
                    >
                      Hạn {request.dueDate}
                      {isOverdue(request) && " (quá hạn)"}
                    </span>
                  )}
                  {request.handledBy && (
                    <span className="text-muted-foreground">· Xử lý: {request.handledBy}</span>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="whitespace-pre-wrap">{request.description}</p>
                  <AttachmentList attachments={request.attachments} />
                </div>

                {request.resolution && (
                  <p className="rounded-lg border bg-muted/40 p-3">
                    <span className="font-medium">
                      {status === "DECLINED" ? "Lý do không thực hiện: " : "Kết quả: "}
                    </span>
                    {request.resolution}
                  </p>
                )}

                {changes.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-semibold">Đề xuất thay đổi gắn kèm</p>
                    <ul className="divide-y rounded-lg border">
                      {changes.map((approval) => (
                        <li key={approval.id}>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-muted/50"
                            onClick={() => onOpenApproval(approval)}
                          >
                            <span className="min-w-0">
                              <span className="block truncate font-medium">{approval.title}</span>
                              <span className="text-xs text-muted-foreground">
                                {approval.by} · {approval.at}
                              </span>
                            </span>
                            <StatusBadge s={approval.status} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {handler && status === "IN_PROGRESS" && screen && (
                  <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                    <p>
                      Việc này cần sửa dữ liệu ở <b>{screenLabel(screen.to)}</b>. Đề xuất bạn gửi
                      duyệt khi đang xử lý sẽ tự gắn vào yêu cầu, Manager duyệt xong thì yêu cầu tự
                      hoàn tất.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={goToScreen}>
                        <ExternalLink className="h-4 w-4" />
                        Mở {screenLabel(screen.to)}
                      </Button>
                      {active === id && (
                        <Button size="sm" variant="outline" onClick={stopActiveWork}>
                          Ngừng gắn đề xuất
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {handler && status === "OPEN" && (
                    <Button onClick={() => report(startWork(id), "Đã nhận xử lý")}>
                      Nhận xử lý
                    </Button>
                  )}
                  {handler && status === "IN_PROGRESS" && (
                    <>
                      <Button onClick={() => setPending("resolve")}>Báo hoàn thành</Button>
                      <Button variant="outline" onClick={() => setPending("ask")}>
                        Cần Manager bổ sung
                      </Button>
                    </>
                  )}
                  {handler &&
                    (status === "OPEN" || status === "IN_PROGRESS" || status === "NEEDS_INFO") && (
                      <Button
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => setPending("decline")}
                      >
                        Không thực hiện
                      </Button>
                    )}
                  {requester && status === "RESOLVED" && (
                    <>
                      <Button onClick={() => report(confirmWork(id), "Đã xác nhận hoàn thành")}>
                        Xác nhận hoàn thành
                      </Button>
                      <Button variant="outline" onClick={() => setPending("reopen")}>
                        Chưa đạt, mở lại
                      </Button>
                    </>
                  )}
                  {requester && status === "DECLINED" && (
                    <Button variant="outline" onClick={() => setPending("reopen")}>
                      Mở lại yêu cầu
                    </Button>
                  )}
                </div>
                {requester && status === "NEEDS_INFO" && (
                  <p className="rounded-lg border border-accent/40 bg-accent/10 p-3">
                    Admin đang chờ bạn bổ sung thông tin. Trả lời ở phần trao đổi bên dưới, yêu cầu
                    sẽ tự chuyển lại cho Admin.
                  </p>
                )}

                <RequestThread
                  requestId={id}
                  canPost={status !== "DONE"}
                  placeholder={
                    requester
                      ? "Bổ sung thông tin, gửi thêm tệp cho Admin…"
                      : "Hỏi hoặc cập nhật cho Manager…"
                  }
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <NoteDialog
        open={pending === "ask"}
        title="Cần Manager bổ sung"
        description="Yêu cầu chuyển sang chờ Manager. Khi Manager trả lời, yêu cầu tự quay lại cho bạn."
        placeholder="Cần thêm thông tin gì?"
        confirmLabel="Gửi câu hỏi"
        withAttachments
        onClose={() => setPending(null)}
        onConfirm={(note, files) =>
          report(askForInfo(id, note, files), "Đã gửi câu hỏi cho Manager")
        }
      />
      <NoteDialog
        open={pending === "resolve"}
        title="Báo hoàn thành"
        description="Dùng cho việc không cần đề xuất thay đổi dữ liệu. Manager sẽ xác nhận hoặc mở lại."
        placeholder="Đã làm gì, kết quả ra sao…"
        confirmLabel="Báo hoàn thành"
        withAttachments
        onClose={() => setPending(null)}
        onConfirm={(note, files) => report(resolveWork(id, note, files), "Đã báo hoàn thành")}
      />
      <ReasonDialog
        open={pending === "decline"}
        title="Không thực hiện yêu cầu"
        confirmLabel="Xác nhận"
        onClose={() => setPending(null)}
        onConfirm={(reason) => {
          if (!report(declineWork(id, reason), "Đã cập nhật yêu cầu")) setPending(null);
        }}
      />
      <ReasonDialog
        open={pending === "reopen"}
        title="Mở lại yêu cầu"
        confirmLabel="Mở lại"
        onClose={() => setPending(null)}
        onConfirm={(reason) => {
          if (!report(reopenWork(id, reason), "Đã mở lại yêu cầu")) setPending(null);
        }}
      />
    </>
  );
}
