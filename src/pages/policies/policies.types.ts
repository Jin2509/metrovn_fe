import { parkingPricesStore, ticketTypesStore } from "@/mocks/admin";
import { operationConfigsStore } from "@/mocks/operations";

export type TicketType = ReturnType<typeof ticketTypesStore.use>[number];
export type ParkingPrice = ReturnType<typeof parkingPricesStore.use>[number];
export type OperationConfig = ReturnType<typeof operationConfigsStore.use>[number];
