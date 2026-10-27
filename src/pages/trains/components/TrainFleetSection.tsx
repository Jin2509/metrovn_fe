import { DataTable, Section } from "@/components/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TRAIN_STATUS_LABELS } from "@/lib/operations";
import { lineCode } from "@/lib/network";
import type { Train, TrainStatus } from "@/mocks/operations";

export function TrainFleetSection({
  trains,
  onStatusChange,
}: {
  trains: Train[];
  onStatusChange: (t: Train, s: TrainStatus) => void;
}) {
  return (
    <Section
      title="Đoàn tàu"
      description="Chỉ tàu Sẵn sàng và Đang chạy được tính vào số tàu khả dụng khi kiểm tra cấu hình vận hành"
    >
      <DataTable
        rows={trains}
        pageSize={9}
        cols={[
          { h: "Mã tàu", c: (t) => <span className="font-medium">{t.code}</span> },
          { h: "Tên", c: (t) => t.name },
          { h: "Tuyến", c: (t) => lineCode(t.lineId) },
          {
            h: "Sức chứa",
            className: "text-right",
            c: (t) => `${t.capacity.toLocaleString("vi-VN")} khách`,
          },
          { h: "Năm sản xuất", className: "text-right", c: (t) => t.manufactureYear },
          {
            h: "Trạng thái",
            c: (t) => (
              <Select value={t.status} onValueChange={(v) => onStatusChange(t, v as TrainStatus)}>
                <SelectTrigger className="h-8 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TRAIN_STATUS_LABELS) as TrainStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {TRAIN_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ),
          },
        ]}
      />
    </Section>
  );
}
