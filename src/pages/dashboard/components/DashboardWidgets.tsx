import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { lazy, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ChartBoundary } from "@/components/chart-boundary";
import { Section } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ProtectedPath } from "@/lib/auth";
import { chainage, stationName } from "@/lib/network";
import { cn } from "@/lib/utils";
import { incidentsStore } from "@/mocks/incidents";
import { lines, lineStationRows, lineStationsStore, stationsStore } from "@/mocks/metro";
import {
  INCIDENT_SEVERITY_LABEL,
  INCIDENT_TYPE_LABEL,
} from "@/pages/incidents/incidents.constants";
import {
  isOpen,
  publishIncident,
  sortIncidents,
  updateIncidentStatus,
} from "@/pages/incidents/incidents.service";
import { Line3DView } from "@/pages/lines/components/Line3DView";
import { buildLine3DModel } from "@/pages/lines/lines.service";

const RevenueLines = lazy(() => import("@/pages/dashboard/components/DashboardCharts"));

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

export function RevenueChart() {
  return (
    <Section title="Doanh thu 7 ngày" description="Đơn vị: triệu VND">
      <ChartBoundary className="h-64">
        <RevenueLines />
      </ChartBoundary>
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

/** Sự cố đang mở: đổi trạng thái và đăng cho hành khách ngay tại đây. */
export function IncidentQuickList() {
  const incidents = incidentsStore.use();
  const open = sortIncidents(incidents.filter(isOpen));
  const act = (error: string | null, done: string) =>
    error ? toast.error(error) : toast.success(done);

  return (
    <Section
      title={`Sự cố đang mở (${open.length})`}
      action={<SeeAll to="/incidents">Xem tất cả</SeeAll>}
    >
      {open.length ? (
        <ul className="-my-3 divide-y">
          {open.slice(0, SHOWN_INCIDENTS).map((incident) => (
            <li key={incident.id} className="py-3">
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                {INCIDENT_TYPE_LABEL[incident.type]}, ga {stationName(incident.stationId)}
                {incident.severity === "EMERGENCY" && (
                  <Badge variant="destructive">{INCIDENT_SEVERITY_LABEL.EMERGENCY}</Badge>
                )}
              </p>
              <p className="line-clamp-1 text-xs text-muted-foreground">{incident.description}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {incident.status === "OPEN" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      act(
                        updateIncidentStatus(incident.id, "IN_PROGRESS"),
                        "Đã chuyển sang đang xử lý",
                      )
                    }
                  >
                    Nhận xử lý
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      act(updateIncidentStatus(incident.id, "RESOLVED"), "Đã đánh dấu đã xử lý")
                    }
                  >
                    Đã xử lý xong
                  </Button>
                )}
                {incident.publication === "PENDING" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      act(publishIncident(incident.id), "Đã đăng thông báo cho hành khách")
                    }
                  >
                    Đăng cho hành khách
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Không có sự cố nào đang mở.</p>
      )}
    </Section>
  );
}

/** Mô hình 3D các ga theo tuyến. Thứ tự và lý trình lấy từ dữ liệu đang áp dụng, chỉ để xem. */
export function NetworkModel({ className }: { className?: string }) {
  const stations = stationsStore.use();
  const rows = lineStationsStore.use();
  const [lineId, setLineId] = useState(lines[0].id);
  const [showProfile, setShowProfile] = useState(false);
  const line = lines.find((item) => item.id === lineId) ?? lines[0];
  const model = useMemo(
    () => buildLine3DModel(chainage(lineStationRows(lineId, rows)), stations, lineId),
    [lineId, rows, stations],
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
