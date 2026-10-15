import { money, StatusBadge } from "@/components/shared";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Txn } from "@/mocks/admin";

export function TransactionDetailSheet({
  transaction,
  onClose,
}: {
  transaction: Txn | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!transaction} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        {transaction && (
          <>
            <SheetHeader>
              <SheetTitle>Giao dịch {transaction.id}</SheetTitle>
            </SheetHeader>
            <dl className="grid grid-cols-2 gap-3 px-4 text-sm">
              {(
                [
                  ["Đơn hàng", transaction.orderId],
                  ["Thời gian", transaction.at],
                  ["Dịch vụ", transaction.service],
                  ["Số tiền", money(transaction.amount)],
                  ["Hoàn tiền", money(transaction.refund)],
                  ["Phương thức", transaction.method],
                  ["Cổng", transaction.gateway],
                  ["Mã cổng", `${transaction.gateway.toUpperCase()}-${transaction.id.slice(2)}`],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
              <div>
                <dt className="text-muted-foreground">Trạng thái</dt>
                <dd>
                  <StatusBadge s={transaction.status} />
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Đối soát</dt>
                <dd>
                  <StatusBadge s={transaction.reconciled ? "RECONCILED" : "UNRECONCILED"} />
                  {transaction.reconciledBy && (
                    <p className="text-xs">{transaction.reconciledBy}</p>
                  )}
                </dd>
              </div>
            </dl>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
