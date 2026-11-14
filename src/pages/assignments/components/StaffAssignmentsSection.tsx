import { X } from "lucide-react";
import { DataTable, Section, StatusBadge } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import type { StaffAssignment } from "@/lib/api";
import type { StaffRow } from "@/pages/assignments/hooks/useAssignments";

export function StaffAssignmentsSection({
  staff,
  canManage,
  pending,
  onUnassign,
}: {
  staff: StaffRow[];
  canManage: boolean;
  pending: boolean;
  onUnassign: (assignment: StaffAssignment) => void;
}) {
  return (
    <Section title="Nhân viên ga">
      <DataTable
        rows={staff}
        rowKey={(user) => user.id}
        cols={[
          {
            h: "Nhân viên",
            c: (user) => (
              <div>
                <p className="font-medium">{user.fullName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            ),
          },
          { h: "Trạng thái", c: (user) => <StatusBadge s={user.status} /> },
          {
            h: "Ga phụ trách",
            c: (user) =>
              user.assignments.length ? (
                <span className="flex flex-wrap gap-1.5">
                  {user.assignments.map((a) => (
                    <Badge key={a.stationId} variant="secondary" className="gap-1 font-normal">
                      {a.stationName}
                      {canManage && (
                        <button
                          type="button"
                          disabled={pending}
                          className="rounded-sm hover:text-destructive disabled:opacity-50"
                          aria-label={`Gỡ ${user.fullName} khỏi ga ${a.stationName}`}
                          onClick={() => onUnassign(a)}
                        >
                          <X className="h-3 w-3" aria-hidden />
                        </button>
                      )}
                    </Badge>
                  ))}
                </span>
              ) : (
                <span className="text-muted-foreground">Chưa phân công</span>
              ),
          },
        ]}
      />
    </Section>
  );
}
