import { periodsStore } from "@/stores/admin";

export type Period = ReturnType<typeof periodsStore.use>[number];
