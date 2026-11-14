import { LoadState } from "@/components/shared";
import { AssignmentForm } from "@/pages/assignments/components/AssignmentForm";
import { StaffAssignmentsSection } from "@/pages/assignments/components/StaffAssignmentsSection";
import { useAssignments } from "@/pages/assignments/hooks/useAssignments";

/** Tab "Phân công ga" trong trang Tài khoản & phân công. */
export function AssignmentsPanel() {
  const a = useAssignments();
  return (
    <div className="space-y-4">
      <LoadState loading={a.loading} error={a.loadError} onRetry={() => void a.reload()} />
      <div
        className={
          a.canManage ? "grid items-start gap-6 xl:grid-cols-[400px_1fr]" : "grid items-start gap-6"
        }
      >
        {a.canManage && (
          <AssignmentForm
            staff={a.staff}
            stations={a.activeStations}
            userId={a.userId}
            onUserIdChange={a.setUserId}
            stationId={a.stationId}
            onStationIdChange={a.setStationId}
            error={a.error}
            pending={a.pending}
            onAssign={() => void a.assign()}
          />
        )}
        <StaffAssignmentsSection
          staff={a.staff}
          canManage={a.canManage}
          pending={a.pending}
          onUnassign={(x) => void a.unassign(x)}
        />
      </div>
    </div>
  );
}
