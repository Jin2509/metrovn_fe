import { Building2, Route } from "lucide-react";
import { AppShell, PageTabs } from "@/components/app-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LinesPanel } from "@/pages/lines";
import { ConfirmDialog } from "@/pages/stations/components/ConfirmDialog";
import { StationDetail } from "@/pages/stations/components/StationDetail";
import { StationFormDialog } from "@/pages/stations/components/StationFormDialog";
import { StationTable } from "@/pages/stations/components/StationTable";
import { useStations } from "@/pages/stations/hooks/useStations";

function StationListPanel() {
  const s = useStations();
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_440px]">
      {s.loadError && (
        <Alert variant="destructive" className="xl:col-span-2">
          <AlertDescription className="flex items-center justify-between gap-3">
            {s.loadError}
            <Button size="sm" variant="outline" onClick={() => void s.reload()}>
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <StationTable
        rows={s.rows}
        total={s.total}
        loading={s.loading}
        query={s.query}
        onQueryChange={s.setQuery}
        status={s.status}
        onStatusChange={s.setStatus}
        selectedId={s.selected?.id}
        onSelect={s.select}
        onCreate={s.canManage ? s.openCreate : undefined}
      />
      {s.selected && (
        <StationDetail
          station={s.selected}
          allLines={s.lines}
          network={s.mapNetwork}
          onEdit={s.canManage ? () => s.openEdit(s.selected!) : undefined}
          onDelete={s.canManage ? () => s.openDelete(s.selected!) : undefined}
          onSelectStation={s.select}
        />
      )}
      <StationFormDialog
        form={s.form}
        errors={s.errors}
        pending={s.pending}
        network={s.mapNetwork}
        onChange={(draft) => s.setForm((f) => (f ? { ...f, draft } : f))}
        onClose={() => s.setForm(null)}
        onSubmit={() => void s.submit()}
      />
      <ConfirmDialog
        open={!!s.deleteTarget}
        title={`Xoá ga ${s.deleteTarget?.nameStation ?? ""}?`}
        description={
          <>
            <p>Thao tác này không thể hoàn tác.</p>
            <p>
              Chỉ xoá được ga không còn thuộc tuyến nào. Nếu ga chỉ tạm ngừng, hãy sửa trạng thái
              sang <b>Tạm ngừng</b> hoặc <b>Bảo trì</b> thay vì xoá.
            </p>
          </>
        }
        pending={s.pending}
        onClose={s.closeDelete}
        onConfirm={() => void s.confirmDelete()}
      />
    </div>
  );
}

export function StationsPage() {
  return (
    <AppShell title="Ga & tuyến">
      <PageTabs
        tabs={[
          {
            value: "stations",
            label: "Danh sách ga",
            icon: Building2,
            content: <StationListPanel />,
          },
          { value: "lines", label: "Tuyến & thứ tự ga", icon: Route, content: <LinesPanel /> },
        ]}
      />
    </AppShell>
  );
}
