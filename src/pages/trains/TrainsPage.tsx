import { CalendarCog, TrainFront, Wrench } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { LoadState, ReasonDialog, StatCard } from "@/components/shared";
import { ConfigEditorDialog } from "@/pages/trains/components/ConfigEditorDialog";
import { OperationConfigSection } from "@/pages/trains/components/OperationConfigSection";
import { TrainFleetSection } from "@/pages/trains/components/TrainFleetSection";
import { useTrains } from "@/pages/trains/hooks/useTrains";

export function TrainsPage() {
  const t = useTrains();
  const count = (s: string) => t.trains.filter((x) => x.status === s).length;

  return (
    <AppShell title="Tàu & vận hành">
      <LoadState loading={t.loading} error={t.loadError} onRetry={() => void t.reload()} />
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
        lines={t.lines}
        lineId={t.lineId}
        lineLabel={t.line ? `${t.line.code} · ${t.line.name}` : "—"}
        onLineChange={t.setLineId}
        configs={t.configs}
        canManage={t.canManage}
        canApprove={t.canApprove}
        pending={t.pending}
        onCreate={t.openCreate}
        onEdit={t.openEdit}
        onAction={t.act}
        onReject={t.setRejecting}
      />
      <TrainFleetSection canEdit={t.canManage} />
      <ReasonDialog
        open={!!t.rejecting}
        title={t.rejecting ? `Từ chối cấu hình v${t.rejecting.version}` : ""}
        confirmLabel="Từ chối"
        onClose={() => t.setRejecting(null)}
        onConfirm={(reason) => void t.reject(reason)}
      />
      <ConfigEditorDialog
        editor={t.editor}
        onChange={(draft) => t.setEditor((e) => (e ? { ...e, draft } : e))}
        lineLabel={t.line?.code ?? ""}
        pending={t.pending}
        onClose={() => t.setEditor(null)}
        onSave={() => void t.saveEditor()}
      />
    </AppShell>
  );
}
