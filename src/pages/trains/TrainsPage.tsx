import { CalendarCog, TrainFront, Wrench } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/shared";
import { ConfigEditorDialog } from "@/pages/trains/components/ConfigEditorDialog";
import { OperationConfigSection } from "@/pages/trains/components/OperationConfigSection";
import { TrainFleetSection } from "@/pages/trains/components/TrainFleetSection";
import { useTrains } from "@/pages/trains/hooks/useTrains";

export function TrainsPage() {
  const t = useTrains();
  const count = (s: string) => t.trains.filter((x) => x.status === s).length;

  return (
    <AppShell title="Tàu & vận hành">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Đang chạy"
          value={count("IN_OPERATION")}
          hint={`${count("READY")} đoàn sẵn sàng dự phòng`}
          icon={TrainFront}
        />
        <StatCard
          label="Khả dụng"
          value={`${t.available}/${t.trains.length}`}
          hint="Đang chạy + sẵn sàng"
          icon={TrainFront}
          tone="success"
        />
        <StatCard
          label="Bảo dưỡng / ngừng"
          value={count("MAINTENANCE") + count("OUT_OF_SERVICE")}
          hint={`${count("MAINTENANCE")} bảo dưỡng · ${count("OUT_OF_SERVICE")} ngừng sử dụng`}
          icon={Wrench}
          tone="muted"
        />
        <StatCard
          label="Cấu hình đang áp dụng"
          value={t.active ? `v${t.active.version}` : "—"}
          hint={
            t.active
              ? `${t.active.numberOfTrains} đoàn · giãn cách ${t.active.headwayMinutes} phút`
              : undefined
          }
          icon={CalendarCog}
          tone="accent"
        />
      </div>
      <OperationConfigSection
        configs={t.configs}
        onCreate={t.openCreate}
        onEdit={t.openEdit}
        onSend={t.send}
      />
      <TrainFleetSection trains={t.trains} onStatusChange={t.changeStatus} />
      <ConfigEditorDialog
        editor={t.editor}
        onChange={(draft) => t.setEditor((e) => (e ? { ...e, draft } : e))}
        onClose={() => t.setEditor(null)}
        onSave={t.saveEditor}
      />
    </AppShell>
  );
}
