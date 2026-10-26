import { ParkingCapacityTable } from "@/pages/parking/components/ParkingCapacityTable";
import { ParkingLotsTable } from "@/pages/parking/components/ParkingLotsTable";
import { ParkingPriceTable } from "@/pages/parking/components/ParkingPriceTable";
import { useParking } from "@/pages/parking/hooks/useParking";

/** Tab "Gửi xe" trong trang Giá vé & gửi xe: bãi xe, sức chứa và bảng giá trên cùng một màn hình. */
export function ParkingPanel() {
  const { lots, stations, prices, edits, setEdit, submit } = useParking();

  return (
    <>
      <div className="grid items-start gap-6 xl:grid-cols-[3fr_2fr]">
        <ParkingLotsTable lots={lots} stations={stations} />
        <ParkingCapacityTable lots={lots} />
      </div>
      <ParkingPriceTable prices={prices} edits={edits} onEdit={setEdit} onSubmit={submit} />
    </>
  );
}
