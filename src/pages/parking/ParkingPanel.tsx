import { CatalogSection } from "@/components/catalog/CatalogSection";
import { money, StatusBadge } from "@/components/shared";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth";
import { parkingLotCatalog, parkingPriceCatalog } from "@/lib/catalogs";
import { VEHICLE_LABEL, type ParkingLotRow, type ParkingPriceRow } from "@/stores/admin";
import { stationsStore } from "@/stores/metro";

const PARKING_MANAGE = "PARKING_MANAGE";

/** Tab "Gửi xe" trong trang Giá vé & gửi xe: bãi xe, rồi sức chứa và giá theo loại xe của từng bãi. */
export function ParkingPanel() {
  const stations = stationsStore.use();
  const canManage = useAuth().hasPermission(PARKING_MANAGE);
  return (
    <>
      <CatalogSection<ParkingLotRow>
        catalog={parkingLotCatalog}
        title="Bãi xe"
        description="Sức chứa và giá khai báo theo từng loại xe ở bảng bên dưới"
        canEdit={canManage}
        columns={[
          { h: "Bãi", c: (lot) => <b>{lot.name}</b> },
          { h: "Ga", c: (lot) => stations.find((s) => s.id === lot.stationId)?.name ?? "—" },
          { h: "Giờ mở cửa", c: (lot) => `${lot.openTime} – ${lot.closeTime}` },
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
        title="Sức chứa & giá gửi xe"
        canEdit={canManage}
        columns={[
          { h: "Bãi", c: (p) => p.lotName },
          { h: "Loại xe", c: (p) => VEHICLE_LABEL[p.vehicleType] },
          { h: "Đang gửi", c: (p) => `${p.occupied}/${p.capacity}`, className: "text-right" },
          { h: "Lượt ban ngày", c: (p) => money(p.dayPrice) },
          { h: "Qua đêm", c: (p) => money(p.overnightPrice) },
          { h: "Vé tháng", c: (p) => money(p.monthlyPrice) },
          {
            h: "Giảm khi đi Metro",
            c: (p) => (p.parkAndRideDiscountPercent ? `${p.parkAndRideDiscountPercent}%` : "—"),
          },
        ]}
      />
    </>
  );
}
