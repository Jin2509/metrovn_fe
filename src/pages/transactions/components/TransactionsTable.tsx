import { DataTable, money, StatusBadge, type Col } from "@/components/shared";
import { Checkbox } from "@/components/ui/checkbox";
import type { Txn } from "@/mocks/admin";

export function TransactionsTable({
  rows,
  onSelect,
  selection,
}: {
  rows: Txn[];
  onSelect: (transaction: Txn) => void;
  /** Có giá trị khi vai trò được đối soát: thêm cột tick ở các dòng đối soát được. */
  selection?: {
    canPick: (transaction: Txn) => boolean;
    isPicked: (id: string) => boolean;
    toggle: (id: string) => void;
  };
}) {
  const pickCol: Col<Txn>[] = selection
    ? [
        {
          h: "Chọn",
          className: "w-14",
          c: (transaction) =>
            selection.canPick(transaction) && (
              // Bấm vào dòng là mở chi tiết nên ô tick không được để sự kiện lan ra dòng.
              <div onClick={(event) => event.stopPropagation()}>
                <Checkbox
                  aria-label={`Chọn đối soát ${transaction.id}`}
                  checked={selection.isPicked(transaction.id)}
                  onCheckedChange={() => selection.toggle(transaction.id)}
                />
              </div>
            ),
        },
      ]
    : [];
  return (
    <DataTable
      rows={rows}
      onRow={onSelect}
      pageSize={12}
      cols={[
        ...pickCol,
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
