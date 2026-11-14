import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { lazy, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ChartBoundary } from "@/components/chart-boundary";
import { LoadState, ReasonDialog, Section } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { apiErrorMessage, incidentsApi } from "@/lib/api";
import { useAuth, type ProtectedPath } from "@/lib/auth";
import type { ReportRow } from "@/lib/api";
import { chainage } from "@/lib/network";
import { cn } from "@/lib/utils";
import { incidentsStore, type StationIncident } from "@/stores/incidents";
import { lineStationRows, lineStationsStore, linesStore, stationsStore } from "@/stores/metro";
import {
  INCIDENT_SEVERITY_LABEL,
  INCIDENT_TYPE_LABEL,
} from "@/pages/incidents/incidents.constants";
import {
  INCIDENTS_KEY,
  isOpen,
  isUrgent,
  sortIncidents,
  useIncidentsData,
} from "@/pages/incidents/incidents.service";
import { Line3DView } from "@/pages/lines/components/Line3DView";
import { buildLine3DModel } from "@/pages/lines/lines.service";

const RevenueBars = lazy(() => import("@/pages/dashboard/components/DashboardCharts"));

/** Dải số chính của trang: gộp một khung, đọc một lượt, không trang trí. */
export function KpiStrip({
  items,
}: {
  items: { label: string; value: ReactNode; hint?: string }[];
}) {
  return (
    <dl className="grid divide-y rounded-xl border bg-card sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4 xl:divide-x">
      {items.map((item) => (
        <div key={item.label} className="px-5 py-4">
          <dt className="text-sm text-muted-foreground">{item.label}</dt>
          <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{item.value}</dd>
          {item.hint && <p className="mt-0.5 text-xs text-muted-foreground">{item.hint}</p>}
        </div>
      ))}
    </dl>
  );
}

export function RevenueChart({
  rows,
  loading,
  error,
}: {
  rows: ReportRow[];
  loading?: boolean;
  error?: string;
}) {
  return (
    <Section title="Doanh thu 7 ngày" action={<SeeAll to="/reports">Xem báo cáo</SeeAll>}>
      <LoadState loading={loading} error={error} />
      {!loading && !error && (
        <ChartBoundary className="h-64">
          <RevenueBars rows={rows} />
        </ChartBoundary>
      )}
    </Section>
  );
}

export function SeeAll({ to, children }: { to: ProtectedPath; children: ReactNode }) {
  return (
    <Link to={to} className="text-sm text-primary hover:underline">
      {children}
    </Link>
  );
}

export type DashboardTask = {
  label: string;
  count: number;
  to: ProtectedPath;
  tab?: string;
};

/** Việc còn tồn: chỉ hiện dòng có số, hết việc thì không chiếm chỗ. */
export function TaskList({
  tasks,
  title = "Việc còn tồn",
}: {
  tasks: DashboardTask[];
  title?: string;
}) {
  const open = tasks.filter((task) => task.count > 0);
  if (!open.length) return null;
  return (
    <Section title={title}>
      <ul className="-my-2 divide-y">
        {open.map((task) => (
          <li key={task.label}>
            <Link
              to={task.to}
              search={(task.tab ? { tab: task.tab } : {}) as never}
              className="group flex items-center gap-3 py-2.5 text-sm hover:text-primary"
            >
              <span className="min-w-0 flex-1">{task.label}</span>
              <span className="font-semibold tabular-nums">{task.count}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

const SHOWN_INCIDENTS = 4;

/** Sự cố đang mở: nhận xử lý và báo xử lý xong ngay tại đây. */
export function IncidentQuickList() {
  const queryClient = useQueryClient();
  const canManage = useAuth().hasPermission("INCIDENT_MANAGE");
  const data = useIncidentsData(canManage);
  const incidents = incidentsStore.use();
  const open = sortIncidents(incidents.filter(isOpen));
  const [resolving, setResolving] = useState<StationIncident | null>(null);
  const [pending, setPending] = useState(false);

  const run = async (task: () => Promise<unknown>, done: string) => {
    if (pending) return false;
    setPending(true);
    try {
      await task();
      toast.success(done);
      await queryClient.invalidateQueries({ queryKey: INCIDENTS_KEY });
      return true;
    } catch (error) {
      toast.error(apiErrorMessage(error));
      return false;
    } finally {
      setPending(false);
    }
  };

  if (!canManage) return null;

  return (
    <Section
      title={`Sự cố đang mở (${open.length})`}
      action={<SeeAll to="/incidents">Xem tất cả</SeeAll>}
    >
      <LoadState loading={data.loading} error={data.loadError} />
      {open.length ? (
        <ul className="-my-3 divide-y">
          {open.slice(0, SHOWN_INCIDENTS).map((incident) => (
            <li key={incident.id} className="py-3">
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                {INCIDENT_TYPE_LABEL[incident.type]}, ga {incident.stationName}
                {isUrgent(incident) && (
                  <Badge variant="destructive">{INCIDENT_SEVERITY_LABEL[incident.severity]}</Badge>
                )}
              </p>
              <p className="line-clamp-1 text-xs text-muted-foreground">{incident.description}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {incident.status === "NEW" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      void run(() => incidentsApi.accept(Number(incident.id)), "Đã nhận xử lý")
                    }
                  >
                    Nhận xử lý
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => setResolving(incident)}
                  >
                    Đã xử lý xong
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !data.loading && (
          <p className="text-sm text-muted-foreground">Không có sự cố nào đang mở.</p>
        )
      )}
      <ReasonDialog
        open={!!resolving}
        title={resolving ? `Đã xử lý sự cố #${resolving.id}` : ""}
        fieldLabel="Kết quả xử lý"
        onClose={() => setResolving(null)}
        onConfirm={(resolution) => {
          if (!resolving) return;
          const id = Number(resolving.id);
          void run(() => incidentsApi.resolve(id, resolution), "Đã ghi nhận xử lý xong").then(
            (ok) => ok && setResolving(null),
          );
        }}
      />
    </Section>
  );
}

/** Mô hình 3D các ga theo tuyến. Thứ tự và lý trình lấy từ dữ liệu đang áp dụng, chỉ để xem. */
export function NetworkModel({ className }: { className?: string }) {
  const stations = stationsStore.use();
  const rows = lineStationsStore.use();
  const lines = linesStore.use();
  const [chosen, setLineId] = useState("");
  const lineId = chosen || lines[0]?.id || "";
  const [showProfile, setShowProfile] = useState(false);
  const line = lines.find((item) => item.id === lineId) ?? lines[0];
  const model = useMemo(
    () => buildLine3DModel(chainage(lineStationRows(lineId, rows)), stations, lineId),
    [lineId, rows, stations],
  );

  if (!line)
    return (
      <Section className={cn("min-w-0", className)} title="Mô hình 3D các ga">
        <p className="py-8 text-center text-sm text-muted-foreground">Chưa có dữ liệu tuyến.</p>
      </Section>
    );

  return (
    <Section
      className={cn("min-w-0", className)}
      title="Mô hình 3D các ga"
      action={
        <>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch checked={showProfile} onCheckedChange={setShowProfile} />
            Trắc dọc
          </label>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={lineId}
            onValueChange={(value) => value && setLineId(value)}
          >
            {lines.map((item) => (
              <ToggleGroupItem key={item.id} value={item.id} className="px-3">
                {item.code}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </>
      }
    >
      <Line3DView key={line.id} model={model} color={line.colorHex} showProfile={showProfile} />
    </Section>
  );
}
