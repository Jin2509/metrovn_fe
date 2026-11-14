import { money, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { PaymentView } from "@/lib/api";
import { fmtInstant } from "@/lib/query-sync";
import {
  PAYMENT_METHOD_LABEL,
  PAYMENT_PURPOSE_LABEL,
  PAYMENT_STATUS_BADGE,
  PAYMENT_STATUS_LABEL,
} from "@/pages/transactions/transactions.constants";

export function TransactionDetailSheet({
  transaction,
  canManage,
  pending,
  onConfirmRefunded,
  onClose,
}: {
  transaction: PaymentView | null;
  canManage: boolean;
  pending: boolean;
  onConfirmRefunded: (transaction: PaymentView) => void;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!transaction} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        {transaction && (
          <>
            <SheetHeader>
              <SheetTitle>
                Giao dịch {transaction.providerRef ?? transaction.id.slice(0, 8)}
              </SheetTitle>
            </SheetHeader>
            <dl className="grid grid-cols-2 gap-3 px-4 text-sm">
              {(
                [
                  ["Mã giao dịch", transaction.id],
                  ["Thời gian", fmtInstant(transaction.createdAt)],
                  ["Dịch vụ", PAYMENT_PURPOSE_LABEL[transaction.purpose]],
                  ["Mã tham chiếu", transaction.referenceId ?? "—"],
                  ["Số tiền", money(transaction.amountVnd)],
                  ["Phương thức", PAYMENT_METHOD_LABEL[transaction.method]],
                  ["Mã cổng thanh toán", transaction.providerRef ?? "—"],
                  ["Hoàn tiền lúc", fmtInstant(transaction.refundedAt)],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="break-all font-medium">{value}</dd>
                </div>
              ))}
              <div>
                <dt className="text-muted-foreground">Trạng thái</dt>
                <dd>
                  <StatusBadge
                    s={PAYMENT_STATUS_BADGE[transaction.status]}
                    label={PAYMENT_STATUS_LABEL[transaction.status]}
                  />
                </dd>
              </div>
            </dl>
            {canManage && transaction.status === "REFUND_PENDING" && (
              <div className="px-4 pt-4">
                <Button disabled={pending} onClick={() => onConfirmRefunded(transaction)}>
                  Xác nhận đã chuyển hoàn tiền
                </Button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
