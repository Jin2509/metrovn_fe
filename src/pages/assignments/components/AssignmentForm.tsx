import { FieldError } from "@/components/form-field";
import { Section } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StaffRow } from "@/pages/assignments/hooks/useAssignments";
import type { Station } from "@/stores/metro";

export function AssignmentForm({
  staff,
  stations,
  userId,
  onUserIdChange,
  stationId,
  onStationIdChange,
  error,
  pending,
  onAssign,
}: {
  staff: StaffRow[];
  stations: Station[];
  userId: string;
  onUserIdChange: (userId: string) => void;
  stationId: string;
  onStationIdChange: (stationId: string) => void;
  error: string;
  pending: boolean;
  onAssign: () => void;
}) {
  return (
    <Section title="Phân công mới">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="assign-user">Nhân viên</Label>
          <Select value={userId} onValueChange={onUserIdChange}>
            <SelectTrigger
              id="assign-user"
              className="w-64"
              aria-invalid={!!error && !userId}
              aria-describedby={error ? "assign-error" : undefined}
            >
              <SelectValue placeholder="Chọn nhân viên" />
            </SelectTrigger>
            <SelectContent>
              {staff.map((user) => (
                <SelectItem key={user.id} value={user.id} disabled={user.status !== "ACTIVE"}>
                  {user.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="assign-station">Ga phụ trách</Label>
          <Select value={stationId} onValueChange={onStationIdChange}>
            <SelectTrigger
              id="assign-station"
              className="w-56"
              aria-invalid={!!error && !stationId}
              aria-describedby={error ? "assign-error" : undefined}
            >
              <SelectValue placeholder="Chọn ga" />
            </SelectTrigger>
            <SelectContent>
              {stations.map((station) => (
                <SelectItem key={station.id} value={station.id}>
                  {station.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={onAssign} disabled={pending}>
          Phân công
        </Button>
      </div>
      <div className="mt-2">
        <FieldError fieldId="assign">{error}</FieldError>
      </div>
    </Section>
  );
}
