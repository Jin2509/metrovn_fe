import { CatalogSection } from "@/components/catalog/CatalogSection";
import { Badge } from "@/components/ui/badge";
import { trainCatalog } from "@/lib/catalogs";
import { lineCode } from "@/lib/network";
import { TRAIN_STATUS_LABELS } from "@/lib/operations";
import type { Train } from "@/mocks/operations";

export function TrainFleetSection() {
  return (
    <CatalogSection<Train>
      catalog={trainCatalog}
      title="Đoàn tàu"
      description="Chỉ tàu Sẵn sàng và Đang chạy được tính vào số tàu khả dụng khi kiểm tra cấu hình vận hành. Mọi thay đổi, kể cả trạng thái, đều chờ Manager duyệt."
      pageSize={9}
      columns={[
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
          c: (t) => <Badge variant="secondary">{TRAIN_STATUS_LABELS[t.status]}</Badge>,
        },
      ]}
    />
  );
}
