import { Link2 } from "lucide-react";
import { StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { approvalLabel, type Approval } from "@/mocks/admin";
import { workRequestsStore } from "@/mocks/requests";
import { ApprovalChangesTable } from "@/pages/approvals/components/ApprovalChangesTable";
import { RequestThread } from "@/pages/approvals/components/RequestThread";

export function ApprovalDetailSheet({
  approval,
  onClose,
  onApprove,
  onReject,
  onOpenWorkRequest,
}: {
  approval: Approval | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onOpenWorkRequest: (id: string) => void;
}) {
  const { can, user } = useAuth();
  const workRequest = workRequestsStore
    .use()
    .find((request) => request.id === approval?.workRequestId);
  const ownProposal = !!approval && approval.by === user?.name;
  const canDecide = can("approval.decide") && !ownProposal;

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
                {approvalLabel[approval.type]} · gửi bởi {approval.by} lúc {approval.at}
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
                {approval.decidedBy && (
                  <span className="text-muted-foreground">bởi {approval.decidedBy}</span>
                )}
              </div>
              {approval.reason && (
                <p className="text-destructive">Lý do từ chối: {approval.reason}</p>
              )}
              {approval.status === "PENDING" && canDecide && (
                <div className="flex gap-2">
                  <Button onClick={onApprove}>Phê duyệt</Button>
                  <Button variant="destructive" onClick={onReject}>
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
                  can("approval.decide")
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
