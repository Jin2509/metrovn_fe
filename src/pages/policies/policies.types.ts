import {
  distancePricesStore,
  operationConfigsStore,
  parkingPricesStore,
  ticketTypesStore,
  tiersStore,
} from "@/mocks/admin";

export type DistancePrice = ReturnType<typeof distancePricesStore.use>[number];
export type TicketType = ReturnType<typeof ticketTypesStore.use>[number];
export type ParkingPrice = ReturnType<typeof parkingPricesStore.use>[number];
export type MembershipTier = ReturnType<typeof tiersStore.use>[number];
export type OperationConfig = ReturnType<typeof operationConfigsStore.use>[number];
