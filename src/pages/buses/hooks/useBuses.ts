import { useState } from "react";
import { busRoutes, stationsForRoute, vnd } from "@/mocks/metro";

export function useBuses() {
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const routes = busRoutes.map((route) => ({
    ...route,
    stations: stationsForRoute(route.code),
    formattedFare: vnd(route.fare),
  }));

  return {
    selectedRoute,
    setSelectedRoute,
    routes,
    totalRouteCount: busRoutes.length,
  };
}
