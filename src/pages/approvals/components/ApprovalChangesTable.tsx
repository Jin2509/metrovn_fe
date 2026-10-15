import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Approval } from "@/mocks/admin";

export function ApprovalChangesTable({ changes }: { changes: Approval["changes"] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Trường</TableHead>
          <TableHead>Giá trị cũ</TableHead>
          <TableHead>Giá trị mới</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {changes.map((change) => (
          <TableRow key={change.field}>
            <TableCell>{change.field}</TableCell>
            <TableCell className="text-muted-foreground line-through">{change.old}</TableCell>
            <TableCell className="font-semibold text-primary">{change.new}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
