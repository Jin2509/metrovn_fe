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
import type { User } from "@/mocks/admin";
import type { Station } from "@/mocks/metro";

export function AssignmentForm({
  staff,
  stations,
  userId,
  onUserIdChange,
  stationId,
  onStationIdChange,
  error,
  onAssign,
}: {
  staff: User[];
  stations: Station[];
  userId: string;
  onUserIdChange: (userId: string) => void;
  stationId: string;
  onStationIdChange: (stationId: string) => void;
  error: string;
  onAssign: () => void;
}) {
  return (
    <Section title="Phân công mới">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label>Nhân viên</Label>
          <Select value={userId} onValueChange={onUserIdChange}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Chọn nhân viên" />
            </SelectTrigger>
            <SelectContent>
              {staff.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Ga phụ trách</Label>
          <Select value={stationId} onValueChange={onStationIdChange}>
            <SelectTrigger className="w-56">
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
        <Button onClick={onAssign}>Phân công</Button>
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </Section>
  );
}
