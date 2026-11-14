import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  apiErrorMessage,
  staffAssignmentsApi,
  type AdminUser,
  type StaffAssignment,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { stationsStore } from "@/stores/metro";
import { fetchAllUsers } from "@/pages/users/users.service";

const USERS_KEY = ["admin", "users"];
const ASSIGNMENTS_KEY = ["assignments"] as const;
const STAFF_ROLE = "STAFF";
const STATION_MANAGE = "STATION_MANAGE";

export type StaffRow = AdminUser & { assignments: StaffAssignment[] };

/** Nhân viên ga (vai trò STAFF) và các ga họ phụ trách, lấy theo từng ga. */
export function useAssignments() {
  const queryClient = useQueryClient();
  const canManage = useAuth().hasPermission(STATION_MANAGE);
  const stations = stationsStore.use();
  const usersQuery = useQuery({ queryKey: USERS_KEY, queryFn: fetchAllUsers, retry: false });
  const assignmentQueries = useQueries({
    queries: stations.map((station) => ({
      queryKey: [...ASSIGNMENTS_KEY, station.id],
      queryFn: () => staffAssignmentsApi.byStation(Number(station.id)),
      retry: false,
    })),
  });
  const assignments = assignmentQueries.flatMap((q) => q.data ?? []);
  const staff: StaffRow[] = (usersQuery.data ?? [])
    .filter((user) => user.roles.includes(STAFF_ROLE))
    .map((user) => ({ ...user, assignments: assignments.filter((a) => a.userId === user.id) }));
  const activeStations = stations.filter((station) => station.status === "ACTIVE");
  const [userId, setUserId] = useState("");
  const [stationId, setStationId] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const loadError = usersQuery.error ?? assignmentQueries.find((q) => q.error)?.error;

  const reload = (station?: string) =>
    queryClient.invalidateQueries({
      queryKey: station ? [...ASSIGNMENTS_KEY, station] : ASSIGNMENTS_KEY,
    });

  const assign = async () => {
    if (pending) return;
    if (!userId || !stationId) return setError("Vui lòng chọn nhân viên và ga");
    const user = staff.find((s) => s.id === userId);
    if (user?.status !== "ACTIVE") return setError("Tài khoản chưa kích hoạt hoặc đang bị khóa");
    if (user.assignments.some((a) => String(a.stationId) === stationId))
      return setError("Nhân viên đã phụ trách ga này");
    setError("");
    setPending(true);
    try {
      const saved = await staffAssignmentsApi.assign(Number(stationId), userId);
      toast.success(`Đã phân công ${saved.fullName} phụ trách ga ${saved.stationName}`);
      setStationId("");
      await reload(stationId);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setPending(false);
    }
  };

  const unassign = async (a: StaffAssignment) => {
    if (pending) return;
    setPending(true);
    try {
      await staffAssignmentsApi.unassign(a.stationId, a.userId);
      toast.success(`Đã gỡ ${a.fullName} khỏi ga ${a.stationName}`);
      await reload(String(a.stationId));
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setPending(false);
    }
  };

  return {
    canManage,
    loading: usersQuery.isPending,
    loadError: loadError ? apiErrorMessage(loadError) : "",
    reload: () => Promise.all([reload(), queryClient.invalidateQueries({ queryKey: USERS_KEY })]),
    staff,
    activeStations,
    userId,
    setUserId,
    stationId,
    setStationId,
    error,
    pending,
    assign,
    unassign,
  };
}
