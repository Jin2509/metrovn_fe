import { Section } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { busRoutes, stationsForRoute, vnd } from "@/mocks/metro";

/** Danh sách tuyến buýt kết nối, chỉ hiện khi đang bật lớp xe buýt. Chọn tuyến để lọc trạm trên bản đồ. */
export function BusRouteList({
  selectedRoute,
  onSelectRoute,
}: {
  selectedRoute: string | null;
  onSelectRoute: (routeCode: string | null) => void;
}) {
  const itemClass = "w-full rounded-lg border bg-card p-3 text-left text-sm hover:bg-muted";
  return (
    <Section title="Tuyến xe buýt kết nối" description="Chọn một tuyến để lọc trạm trên bản đồ">
      <div className="max-h-96 space-y-2 overflow-y-auto p-0.5">
        <button
          type="button"
          aria-pressed={!selectedRoute}
          onClick={() => onSelectRoute(null)}
          className={cn(itemClass, !selectedRoute && "ring-2 ring-ring")}
        >
          Tất cả tuyến ({busRoutes.length})
        </button>
        {busRoutes.map((route) => {
          const stations = stationsForRoute(route.code);
          const selected = selectedRoute === route.code;
          return (
            <button
              type="button"
              key={route.code}
              aria-pressed={selected}
              onClick={() => onSelectRoute(route.code)}
              className={cn(itemClass, selected && "ring-2 ring-ring")}
            >
              <span className="flex items-center gap-2">
                <Badge className="bg-bus text-primary-foreground">{route.code}</Badge>
                <span className="font-medium">{route.name}</span>
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {route.operator} · {route.hours} · {route.headwayMin}′/chuyến · {vnd(route.fare)}
              </span>
              <span className="mt-1 block text-xs">
                Kết nối {stations.length} ga: {stations.map((station) => station.name).join(", ")}
              </span>
            </button>
          );
        })}
      </div>
    </Section>
  );
}
