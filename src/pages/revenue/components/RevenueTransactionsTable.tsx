import { DataTable, money, Section } from "@/components/shared";
import type { Txn } from "@/mocks/admin";

export function RevenueTransactionsTable({ rows }: { rows: Txn[] }) {
  return (
    <Section title="Chi tiết">
      <DataTable
        rows={rows}
        cols={[
          { h: "Mã GD", c: (transaction) => transaction.id },
          { h: "Thời gian", c: (transaction) => transaction.at },
          { h: "Dịch vụ", c: (transaction) => transaction.service },
          { h: "Phương thức", c: (transaction) => transaction.method },
          { h: "Số tiền", c: (transaction) => money(transaction.amount) },
        ]}
      />
    </Section>
  );
}
