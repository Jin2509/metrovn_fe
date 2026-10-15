import { DataTable, money, StatusBadge } from "@/components/shared";
import type { Txn } from "@/mocks/admin";

export function TransactionsTable({
  rows,
  onSelect,
}: {
  rows: Txn[];
  onSelect: (transaction: Txn) => void;
}) {
  return (
    <DataTable
      rows={rows}
      onRow={onSelect}
      pageSize={12}
      cols={[
        { h: "Mã GD", c: (transaction) => transaction.id },
        { h: "Thời gian", c: (transaction) => transaction.at },
        { h: "Dịch vụ", c: (transaction) => transaction.service },
        {
          h: "Số tiền",
          c: (transaction) => money(transaction.amount),
          className: "text-right",
        },
        { h: "Phương thức", c: (transaction) => `${transaction.method} · ${transaction.gateway}` },
        { h: "Trạng thái", c: (transaction) => <StatusBadge s={transaction.status} /> },
        {
          h: "Đối soát",
          c: (transaction) => (
            <StatusBadge s={transaction.reconciled ? "RECONCILED" : "UNRECONCILED"} />
          ),
        },
      ]}
    />
  );
}
