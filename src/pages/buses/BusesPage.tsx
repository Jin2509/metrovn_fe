import { AppShell } from "@/components/app-shell";
import { BusMapPanel } from "@/pages/buses/components/BusMapPanel";
import { BusRouteList } from "@/pages/buses/components/BusRouteList";
import { useBuses } from "@/pages/buses/hooks/useBuses";

export function BusesPage() {
  const { selectedRoute, setSelectedRoute, routes, totalRouteCount } = useBuses();

  return (
    <AppShell title="Liên kết xe buýt" roles={["ADMIN"]}>
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <BusRouteList
          routes={routes}
          selectedRoute={selectedRoute}
          totalRouteCount={totalRouteCount}
          onSelectRoute={setSelectedRoute}
        />
        <BusMapPanel selectedRoute={selectedRoute} />
      </div>
    </AppShell>
  );
}
