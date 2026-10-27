import { useState } from "react";
import { Section, money } from "@/components/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { distancePricesStore } from "@/mocks/admin";
import { fareForDistance } from "@/pages/lines/lines.service";

const km = (n: number) =>
  n.toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Giá vé lượt từ một ga = bảng giá theo cự ly (ticket_price) áp lên lý trình (line_station). */
export function FareTable({
  points,
  nameOf,
}: {
  points: { stationId: string; km: number }[];
  nameOf: (id: string) => string;
}) {
  const prices = distancePricesStore.use();
  const [originId, setOriginId] = useState(points[0]?.stationId);
  const origin = points.find((p) => p.stationId === originId) ?? points[0];
  if (!origin) return null;

  return (
    <Section
      title="Giá vé lượt theo lý trình"
      description="Đúng giá hành khách thấy khi đặt vé và khi hỏi chatbot. Bảng giá sửa ở trang Giá vé & gửi xe."
      action={
        <Select value={origin.stationId} onValueChange={setOriginId}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {points.map((p) => (
              <SelectItem key={p.stationId} value={p.stationId}>
                Từ ga {nameOf(p.stationId)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/60">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-10 text-xs font-semibold uppercase">Đến ga</TableHead>
              <TableHead className="h-10 text-right text-xs font-semibold uppercase">
                Cự ly
              </TableHead>
              <TableHead className="h-10 text-xs font-semibold uppercase">Bậc giá</TableHead>
              <TableHead className="h-10 text-right text-xs font-semibold uppercase">
                Giá vé
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {points
              .filter((p) => p.stationId !== origin.stationId)
              .map((p) => {
                const d = Math.abs(p.km - origin.km);
                const b = fareForDistance(d, prices);
                return (
                  <TableRow key={p.stationId}>
                    <TableCell>{nameOf(p.stationId)}</TableCell>
                    <TableCell className="text-right tabular-nums">{km(d)} km</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {b.from}–{b.to} km
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {money(b.price)}
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>
    </Section>
  );
}
