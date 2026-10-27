import {
  approvalsStore,
  distancePricesStore,
  parkingPricesStore,
  ticketTypesStore,
  tiersStore,
} from "@/mocks/admin";
import { operationConfigsStore } from "@/mocks/operations";

export function usePolicies() {
  const prices = distancePricesStore.use();
  const ticketTypes = ticketTypesStore.use();
  const parkingPrices = parkingPricesStore.use();
  const tiers = tiersStore.use();
  const activeOperation = operationConfigsStore.use().find((config) => config.status === "ACTIVE");
  const history = approvalsStore.use().filter((approval) => approval.status !== "PENDING");

  return { prices, ticketTypes, parkingPrices, tiers, activeOperation, history };
}
