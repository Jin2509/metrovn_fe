import { parkingPricesStore, ticketTypesStore } from "@/stores/admin";
import { operationConfigsStore } from "@/stores/operations";

export type TicketType = ReturnType<typeof ticketTypesStore.use>[number];
export type ParkingPrice = ReturnType<typeof parkingPricesStore.use>[number];
export type OperationConfig = ReturnType<typeof operationConfigsStore.use>[number];
