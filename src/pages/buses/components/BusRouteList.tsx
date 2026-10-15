import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BusRouteListItem } from "@/pages/buses/buses.types";

export function BusRouteList({
  routes,
  selectedRoute,
  totalRouteCount,
  onSelectRoute,
}: {
  routes: BusRouteListItem[];
  selectedRoute: string | null;
  totalRouteCount: number;
  onSelectRoute: (routeCode: string | null) => void;
}) {
  return (
    <div className="space-y-2">
      <button
        onClick={() => onSelectRoute(null)}
        className={cn(
          "w-full rounded-lg border bg-card p-3 text-left text-sm",
          !selectedRoute && "ring-2 ring-ring",
        )}
      >
        Tất cả tuyến ({totalRouteCount})
      </button>
      {routes.map((route) => (
        <button
          key={route.code}
          onClick={() => onSelectRoute(route.code)}
          className={cn(
            "w-full rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted",
            selectedRoute === route.code && "ring-2 ring-ring",
          )}
        >
          <div className="flex items-center gap-2">
            <Badge className="bg-bus text-primary-foreground">{route.code}</Badge>
            <span className="text-sm font-medium">{route.name}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {route.operator} · {route.hours} · {route.headwayMin}′/chuyến · {route.formattedFare}
          </p>
          <p className="mt-1 text-xs">
            Kết nối {route.stations.length} ga:{" "}
            {route.stations.map((station) => station.name).join(", ")}
          </p>
        </button>
      ))}
    </div>
  );
}
