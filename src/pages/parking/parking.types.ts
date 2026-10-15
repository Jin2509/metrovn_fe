import { parkingLots, parkingPricesStore } from "@/mocks/admin";

export type ParkingLot = (typeof parkingLots)[number];
export type ParkingPrice = ReturnType<typeof parkingPricesStore.use>[number];
