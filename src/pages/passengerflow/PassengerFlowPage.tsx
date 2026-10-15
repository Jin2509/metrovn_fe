import { AppShell } from "@/components/app-shell";
import { PassengerFlowChart } from "@/pages/passengerflow/components/PassengerFlowChart";
import { PassengerFlowFilters } from "@/pages/passengerflow/components/PassengerFlowFilters";
import { PassengerFlowStats } from "@/pages/passengerflow/components/PassengerFlowStats";
import { PassengerFlowStationTable } from "@/pages/passengerflow/components/PassengerFlowStationTable";
import { usePassengerFlow } from "@/pages/passengerflow/hooks/usePassengerFlow";

export function PassengerFlowPage() {
  const {
    activeStations,
    stationId,
    setStationId,
    timeSlot,
    setTimeSlot,
    data,
    max,
    total,
    peakHour,
    peakVolume,
    sortedStations,
  } = usePassengerFlow();

  return (
    <AppShell title="Thống kê lưu lượng" roles={["ADMIN"]}>
      <PassengerFlowFilters
        activeStations={activeStations}
        stationId={stationId}
        onStationChange={setStationId}
        timeSlot={timeSlot}
        onTimeSlotChange={setTimeSlot}
      />
      <PassengerFlowStats total={total} peakHour={peakHour} peakVolume={peakVolume} />
      <PassengerFlowChart data={data} max={max} />
      <PassengerFlowStationTable stations={sortedStations} />
    </AppShell>
  );
}
