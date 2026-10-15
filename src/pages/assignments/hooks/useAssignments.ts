import { useState } from "react";
import { toast } from "sonner";
import { usersStore } from "@/mocks/admin";
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

  const assign = () => {
    const assignmentError = assignStaffToStation(staff, userId, stationId);
    if (assignmentError) return setError(assignmentError);
    toast.success("Đã phân công");
    setError("");
  };

  const unassign = (id: string) => {
    unassignStaffFromStation(id);
    toast.success("Đã gỡ phân công");
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
  };
}
