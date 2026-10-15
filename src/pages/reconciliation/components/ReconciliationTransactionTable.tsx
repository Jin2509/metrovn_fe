import { money, StatusBadge } from "@/components/shared";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Txn } from "@/mocks/admin";

export function ReconciliationTransactionTable({
  rows,
  picked,
  onToggle,
}: {
  rows: Txn[];
  picked: Set<string>;
  onToggle: (transactionId: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10" />
          <TableHead>Mã GD</TableHead>
          <TableHead>Thời gian</TableHead>
          <TableHead>Cổng</TableHead>
          <TableHead className="text-right">Số tiền</TableHead>
          <TableHead>Trạng thái</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
              Không có dữ liệu
            </TableCell>
          </TableRow>
        )}
        {rows.map((transaction) => (
          <TableRow
            key={transaction.id}
            onClick={() => onToggle(transaction.id)}
            className="cursor-pointer"
          >
            <TableCell>
              <Checkbox checked={picked.has(transaction.id)} />
            </TableCell>
            <TableCell>{transaction.id}</TableCell>
            <TableCell>{transaction.at}</TableCell>
            <TableCell>{transaction.gateway}</TableCell>
            <TableCell className="text-right">{money(transaction.amount)}</TableCell>
            <TableCell>
              <StatusBadge s={transaction.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
