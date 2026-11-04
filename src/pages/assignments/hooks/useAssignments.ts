import { useState } from "react";
import { toast } from "sonner";
import { assignmentCatalog } from "@/lib/catalogs";
import { pendingRequests, type CatalogPayload } from "@/lib/change-requests";
import { approvalsStore, usersStore } from "@/mocks/admin";
import { stations } from "@/mocks/metro";
import {
  assignStaffToStation,
  unassignStaffFromStation,
} from "@/pages/assignments/assignments.service";

export function useAssignments() {
  const users = usersStore.use();
  const staff = users.filter((user) => user.role === "STAFF");
  const activeStations = stations.filter((station) => station.status === "ACTIVE");
  const [userId, setUserId] = useState("");
  const [stationId, setStationId] = useState("");
  const [error, setError] = useState("");
  const pendingIds = pendingRequests(assignmentCatalog.key, approvalsStore.use()).map(
    (approval) => (approval.payload as CatalogPayload).id,
  );

  const assign = () => {
    const assignmentError = assignStaffToStation(userId, stationId);
    if (assignmentError) return setError(assignmentError);
    toast.success("Đã gửi Manager duyệt");
    setError("");
  };

  const unassign = (id: string) => {
    const unassignError = unassignStaffFromStation(id);
    if (unassignError) return toast.error(unassignError);
    toast.success("Đã gửi Manager duyệt");
  };

  return {
    staff,
    stations,
    activeStations,
    userId,
    setUserId,
    stationId,
    setStationId,
    error,
    assign,
    unassign,
    pendingIds,
  };
}
