import { periodsStore } from "@/mocks/admin";

export type Period = ReturnType<typeof periodsStore.use>[number];
