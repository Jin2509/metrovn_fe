import { Link2 } from "lucide-react";
import { StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useUserNames } from "@/hooks/use-user-names";
import { useAuth } from "@/lib/auth";
import { fmtInstant } from "@/lib/query-sync";
import { approvalLabel, type Approval } from "@/stores/admin";
import { workRequestsStore } from "@/stores/requests";
import { ApprovalChangesTable } from "@/pages/approvals/components/ApprovalChangesTable";
import { RequestThread } from "@/pages/approvals/components/RequestThread";

export function ApprovalDetailSheet({
  approval,
  canDecide: allowed,
  pending,
  onClose,
  onApprove,
  onReject,
  onOpenWorkRequest,
}: {
  approval: Approval | null;
  /** Có quyền duyệt loại mục này trên backend. */
  canDecide: boolean;
  pending: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onOpenWorkRequest: (id: string) => void;
}) {
  const { user } = useAuth();
  const nameOf = useUserNames();
  const workRequest = workRequestsStore
    .use()
    .find((request) => request.id === approval?.workRequestId);
  // Tách người đề xuất và người duyệt: không tự duyệt mục do chính mình gửi.
  const ownProposal = !!approval && !!user && approval.by === user.id;
  const canDecide = allowed && !ownProposal;

  return (
    <Sheet open={!!approval} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        {approval && (
          <>
            <SheetHeader>
              <SheetTitle>{approval.title}</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 py-4 text-sm">
              <p className="text-muted-foreground">
                {approvalLabel[approval.type]} · gửi bởi {nameOf(approval.by)} lúc{" "}
                {fmtInstant(approval.at)}
              </p>
              {workRequest && (
                <button
                  type="button"
                  onClick={() => onOpenWorkRequest(workRequest.id)}
                  className="flex w-full items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-left hover:bg-primary/10"
                >
                  <Link2 className="h-4 w-4 shrink-0 text-primary" />
                  <span>
                    Thực hiện theo yêu cầu <b>{workRequest.id}</b> của {workRequest.by}:{" "}
                    {workRequest.title}
                  </span>
                </button>
              )}
              <ApprovalChangesTable changes={approval.changes} />
              <div className="flex items-center gap-2">
                <StatusBadge s={approval.status} />
                {approval.decidedBy && approval.status === "APPROVED" && (
                  <span className="text-muted-foreground">bởi {nameOf(approval.decidedBy)}</span>
                )}
              </div>
              {approval.reason && (
                <p className="text-destructive">Lý do từ chối: {approval.reason}</p>
              )}
              {approval.status === "PENDING" && canDecide && (
                <div className="flex gap-2">
                  <Button disabled={pending} onClick={onApprove}>
                    Phê duyệt
                  </Button>
                  <Button variant="destructive" disabled={pending} onClick={onReject}>
                    Từ chối
                  </Button>
                </div>
              )}
              {approval.status === "PENDING" && ownProposal && (
                <p className="text-muted-foreground">
                  Bạn là người gửi đề xuất này nên không thể tự duyệt.
                </p>
              )}
              <RequestThread
                requestId={approval.id}
                canPost={approval.status === "PENDING"}
                placeholder={
                  allowed
                    ? "Hỏi lại Admin trước khi quyết định…"
                    : "Giải thích hoặc bổ sung cho Manager…"
                }
              />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
