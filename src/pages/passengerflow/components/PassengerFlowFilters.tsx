import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PASSENGER_FLOW_TIME_SLOTS } from "@/pages/passengerflow/passengerflow.constants";
import type { PassengerFlowTimeSlot } from "@/pages/passengerflow/passengerflow.types";
import type { Station } from "@/mocks/metro";

export function PassengerFlowFilters({
  activeStations,
  stationId,
  onStationChange,
  timeSlot,
  onTimeSlotChange,
}: {
  activeStations: Station[];
  stationId: string;
  onStationChange: (stationId: string) => void;
  timeSlot: PassengerFlowTimeSlot;
  onTimeSlotChange: (timeSlot: PassengerFlowTimeSlot) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Select value={stationId} onValueChange={onStationChange}>
        <SelectTrigger className="w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Toàn Tuyến 1</SelectItem>
          {activeStations.map((station) => (
            <SelectItem key={station.id} value={station.id}>
              {station.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={timeSlot}
        onValueChange={(value) => onTimeSlotChange(value as PassengerFlowTimeSlot)}
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PASSENGER_FLOW_TIME_SLOTS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
