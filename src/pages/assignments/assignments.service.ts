import { logAction, usersStore, type User } from "@/mocks/admin";
import { stations } from "@/mocks/metro";

export function assignStaffToStation(
  staff: User[],
  userId: string,
  stationId: string,
): string | undefined {
  const user = staff.find((staffMember) => staffMember.id === userId);
  if (!user || !stationId) return "Vui lòng chọn nhân viên và ga";
  if (user.status !== "ACTIVE") return "Nhân viên đã nghỉ hoặc bị khóa, không thể phân công";
  if (user.stationId && user.stationId !== stationId)
    return `Nhân viên đã được phân công ga ${stations.find((station) => station.id === user.stationId)?.name}. Hãy gỡ phân công trước.`;

  usersStore.set((users) =>
    users.map((currentUser) =>
      currentUser.id === userId ? { ...currentUser, stationId } : currentUser,
    ),
  );
  logAction(
    "Phân công ga",
    `${user.name} → ${stations.find((station) => station.id === stationId)?.name}`,
  );
}

export function unassignStaffFromStation(userId: string) {
  usersStore.set((users) =>
    users.map((user) => (user.id === userId ? { ...user, stationId: null } : user)),
  );
}
