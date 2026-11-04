import { CatalogSection } from "@/components/catalog/CatalogSection";
import { money, StatusBadge } from "@/components/shared";
import { Progress } from "@/components/ui/progress";
import { parkingLotCatalog, parkingPriceCatalog, type ParkingPriceRow } from "@/lib/catalogs";
import type { ParkingLotRow } from "@/mocks/admin";
import { stationsStore } from "@/mocks/metro";

/** Tab "Gửi xe" trong trang Giá vé & gửi xe: bãi xe kèm sức chứa, và bảng giá. */
export function ParkingPanel() {
  const stations = stationsStore.use();
  return (
    <>
      <CatalogSection<ParkingLotRow>
        catalog={parkingLotCatalog}
        title="Bãi xe"
        description="Sức chứa tính theo chỗ cho từng loại xe"
        columns={[
          { h: "Bãi", c: (lot) => <b>{lot.name}</b> },
          { h: "Ga", c: (lot) => stations.find((s) => s.id === lot.stationId)?.name ?? "—" },
          { h: "Xe đạp", c: (lot) => lot.bike, className: "text-right" },
          { h: "Xe máy", c: (lot) => lot.moto, className: "text-right" },
          { h: "Ô tô", c: (lot) => lot.car, className: "text-right" },
          {
            h: "Lấp đầy",
            c: (lot) => (
              <div className="flex w-32 items-center gap-2">
                <Progress value={lot.used * 100} aria-label={`Lấp đầy ${lot.name}`} />
                <span className="text-xs">{Math.round(lot.used * 100)}%</span>
              </div>
            ),
          },
          { h: "Trạng thái", c: (lot) => <StatusBadge s={lot.status} /> },
        ]}
      />
      <CatalogSection<ParkingPriceRow>
        catalog={parkingPriceCatalog}
        title="Bảng giá gửi xe"
        columns={[
          { h: "Loại xe", c: (p) => p.vehicle },
          { h: "Đơn vị", c: (p) => p.unit },
          { h: "Giá", c: (p) => money(p.price) },
        ]}
      />
    </>
  );
}
