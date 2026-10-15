import type { BusRoute, Station } from "@/mocks/metro";

export type BusRouteListItem = BusRoute & {
  stations: Station[];
  formattedFare: string;
};
