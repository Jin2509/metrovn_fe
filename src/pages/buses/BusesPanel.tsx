import { BusMapPanel } from "@/pages/buses/components/BusMapPanel";
import { BusRouteList } from "@/pages/buses/components/BusRouteList";
import { useBuses } from "@/pages/buses/hooks/useBuses";

/** Tab "Xe buýt kết nối" trong trang Bản đồ & xe buýt. */
export function BusesPanel() {
  const { selectedRoute, setSelectedRoute, routes, totalRouteCount } = useBuses();

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <BusRouteList
        routes={routes}
        selectedRoute={selectedRoute}
        totalRouteCount={totalRouteCount}
        onSelectRoute={setSelectedRoute}
      />
      <BusMapPanel selectedRoute={selectedRoute} />
    </div>
  );
}
