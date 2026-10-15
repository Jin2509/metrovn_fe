import { DataTable, Section, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import type { User } from "@/mocks/admin";
import type { Station } from "@/mocks/metro";

export function StaffAssignmentsSection({
  staff,
  stations,
  onUnassign,
}: {
  staff: User[];
  stations: Station[];
  onUnassign: (userId: string) => void;
}) {
  return (
    <Section title="Nhân viên ga">
      <DataTable
        rows={staff}
        cols={[
          { h: "Nhân viên", c: (user) => user.name },
          { h: "Trạng thái", c: (user) => <StatusBadge s={user.status} /> },
          {
            h: "Ga phụ trách",
            c: (user) =>
              stations.find((station) => station.id === user.stationId)?.name ?? (
                <span className="text-muted-foreground">Chưa phân công</span>
              ),
          },
          {
            h: "",
            c: (user) =>
              user.stationId && (
                <Button size="sm" variant="ghost" onClick={() => onUnassign(user.id)}>
                  Gỡ
                </Button>
              ),
          },
        ]}
      />
    </Section>
  );
}
