import { StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { approvalLabel, type Approval } from "@/mocks/admin";
import { ApprovalChangesTable } from "@/pages/approvals/components/ApprovalChangesTable";

export function ApprovalDetailSheet({
  approval,
  onClose,
  onApprove,
  onReject,
}: {
  approval: Approval | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <Sheet open={!!approval} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-lg">
        {approval && (
          <>
            <SheetHeader>
              <SheetTitle>{approval.title}</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 px-4 text-sm">
              <p className="text-muted-foreground">
                {approvalLabel[approval.type]} · gửi bởi {approval.by} lúc {approval.at}
              </p>
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
              {approval.status === "PENDING" && (
                <div className="flex gap-2">
                  <Button onClick={onApprove}>Phê duyệt</Button>
                  <Button variant="destructive" onClick={onReject}>
                    Từ chối
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
