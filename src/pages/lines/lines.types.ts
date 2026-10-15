import type { Station } from "@/mocks/metro";

export type StationOrder = Pick<Station, "id" | "name"> & { no: number };
