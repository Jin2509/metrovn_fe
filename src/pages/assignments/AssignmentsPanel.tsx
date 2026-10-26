import { AssignmentForm } from "@/pages/assignments/components/AssignmentForm";
import { StaffAssignmentsSection } from "@/pages/assignments/components/StaffAssignmentsSection";
import { useAssignments } from "@/pages/assignments/hooks/useAssignments";

/** Tab "Phân công ga" trong trang Tài khoản & phân công. */
export function AssignmentsPanel() {
  const {
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
  } = useAssignments();

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[400px_1fr]">
      <AssignmentForm
        staff={staff}
        stations={activeStations}
        userId={userId}
        onUserIdChange={setUserId}
        stationId={stationId}
        onStationIdChange={setStationId}
        error={error}
        onAssign={assign}
      />
      <StaffAssignmentsSection staff={staff} stations={stations} onUnassign={unassign} />
    </div>
  );
}
