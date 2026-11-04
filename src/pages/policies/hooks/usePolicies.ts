import {
  approvalsStore,
  distancePricesStore,
  parkingPricesStore,
  ticketTypesStore,
} from "@/mocks/admin";
import { greenConfigStore } from "@/mocks/green";
import { operationConfigsStore } from "@/mocks/operations";

export function usePolicies() {
  const prices = distancePricesStore.use();
  const ticketTypes = ticketTypesStore.use();
  const parkingPrices = parkingPricesStore.use();
  const green = greenConfigStore.use();
  const activeOperation = operationConfigsStore.use().find((config) => config.status === "ACTIVE");
  const history = approvalsStore.use().filter((approval) => approval.status !== "PENDING");

  return { prices, ticketTypes, parkingPrices, green, activeOperation, history };
}
