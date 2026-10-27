import type { MetroLine, Station, StationStatus } from "@/mocks/metro";

export type StationListRow = Station & { lines: MetroLine[]; staffCount: number };
export type StationStatusFilter = "ALL" | StationStatus;
