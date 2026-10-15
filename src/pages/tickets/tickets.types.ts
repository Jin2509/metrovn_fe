import { distancePricesStore, ticketTypesStore } from "@/mocks/admin";

export type TicketType = ReturnType<typeof ticketTypesStore.use>[number];
export type DistancePrice = ReturnType<typeof distancePricesStore.use>[number];
export type TicketPriceEdit = Record<string, string>;
