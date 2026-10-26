import { AppShell } from "@/components/app-shell";
import { OperationConfigTable } from "@/pages/trains/components/OperationConfigTable";
import { TrainFleetTable } from "@/pages/trains/components/TrainFleetTable";
import { useTrains } from "@/pages/trains/hooks/useTrains";

export function TrainsPage() {
  const { trains, configs, sendConfig } = useTrains();

  return (
    <AppShell title="Tàu & cấu hình vận hành">
      <TrainFleetTable trains={trains} />
      <OperationConfigTable configs={configs} onSend={sendConfig} />
    </AppShell>
  );
}
