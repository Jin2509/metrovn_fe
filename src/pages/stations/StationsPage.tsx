import { Building2, Route } from "lucide-react";
import { AppShell, PageTabs } from "@/components/app-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ReasonDialog } from "@/components/shared";
import { LinesPanel } from "@/pages/lines";
import { StationDetail } from "@/pages/stations/components/StationDetail";
import { StationFormDialog } from "@/pages/stations/components/StationFormDialog";
import { StationTable } from "@/pages/stations/components/StationTable";
import { useStations } from "@/pages/stations/hooks/useStations";

function StationListPanel() {
  const s = useStations();
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_440px]">
      {s.pendingCount > 0 && (
        <Alert className="xl:col-span-2">
          <AlertDescription>
            Có <b>{s.pendingCount}</b> yêu cầu thêm/sửa/xóa ga đang chờ Manager phê duyệt. Thông tin
            ga chỉ thay đổi sau khi được duyệt.
          </AlertDescription>
        </Alert>
      )}
      <StationTable
        rows={s.rows}
        total={s.total}
        query={s.query}
        onQueryChange={s.setQuery}
        status={s.status}
        onStatusChange={s.setStatus}
        selectedId={s.selected?.id}
        onSelect={s.select}
        onCreate={s.openCreate}
      />
      {s.selected && (
        <StationDetail
          station={s.selected}
          onEdit={() => s.openEdit(s.selected!)}
          onDelete={() => s.openDelete(s.selected!)}
          onSelectStation={s.select}
        />
      )}
      <StationFormDialog
        form={s.form}
        errors={s.errors}
        onChange={(draft) => s.setForm((f) => (f ? { ...f, draft } : f))}
        onClose={() => s.setForm(null)}
        onSubmit={s.submit}
      />
      <ReasonDialog
        open={!!s.deleteTarget}
        title={`Xóa ga ${s.deleteTarget?.name ?? ""}? Yêu cầu sẽ được gửi tới Manager để phê duyệt trước khi ga bị xóa khỏi hệ thống.`}
        confirmLabel="Gửi yêu cầu xóa"
        onClose={s.closeDelete}
        onConfirm={s.confirmDelete}
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
