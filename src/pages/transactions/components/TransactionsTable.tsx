import { DataTable, money, StatusBadge } from "@/components/shared";
import type { PaymentView } from "@/lib/api";
import { fmtInstant } from "@/lib/query-sync";
import {
  PAYMENT_METHOD_LABEL,
  PAYMENT_PURPOSE_LABEL,
  PAYMENT_STATUS_BADGE,
  PAYMENT_STATUS_LABEL,
} from "@/pages/transactions/transactions.constants";

export function TransactionsTable({
  rows,
  onSelect,
}: {
  rows: PaymentView[];
  onSelect: (transaction: PaymentView) => void;
}) {
  return (
    <DataTable
      rows={rows}
      rowKey={(t) => t.id}
      rowActionLabel={(t) => `Xem giao dịch ${t.providerRef ?? t.id.slice(0, 8)}`}
      onRow={onSelect}
      // Backend đã phân trang: hiện hết các dòng của trang này.
      pageSize={Math.max(rows.length, 1)}
      cols={[
        { h: "Thời gian", c: (t) => fmtInstant(t.createdAt) },
        { h: "Dịch vụ", c: (t) => PAYMENT_PURPOSE_LABEL[t.purpose] },
        { h: "Số tiền", c: (t) => money(t.amountVnd), className: "text-right" },
        { h: "Phương thức", c: (t) => PAYMENT_METHOD_LABEL[t.method] },
        {
          h: "Mã cổng",
          c: (t) => <span className="font-mono text-xs">{t.providerRef ?? "—"}</span>,
        },
        {
          h: "Trạng thái",
          c: (t) => (
            <StatusBadge
              s={PAYMENT_STATUS_BADGE[t.status]}
              label={PAYMENT_STATUS_LABEL[t.status]}
            />
          ),
        },
      ]}
    />
  );
}
