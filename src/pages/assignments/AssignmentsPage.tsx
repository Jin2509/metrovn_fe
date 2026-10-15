import { AppShell } from "@/components/app-shell";
import { AssignmentForm } from "@/pages/assignments/components/AssignmentForm";
import { StaffAssignmentsSection } from "@/pages/assignments/components/StaffAssignmentsSection";
import { useAssignments } from "@/pages/assignments/hooks/useAssignments";

export function AssignmentsPage() {
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
    <AppShell title="Phân công ga" roles={["ADMIN"]}>
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
    </AppShell>
  );
}
