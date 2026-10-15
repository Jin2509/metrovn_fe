import type { MetroLine, Station } from "@/mocks/metro";

export type StationListRow = Station & {
  connectedBusStopCount: number;
  lines: MetroLine[];
};
