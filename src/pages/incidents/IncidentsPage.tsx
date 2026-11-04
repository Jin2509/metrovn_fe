import { CircleAlert, Megaphone, Radio, Siren } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { DataTable, ReasonDialog, Section, StatCard, StatusBadge } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { stationName } from "@/lib/network";
import { incidentsStore, type IncidentSeverity, type IncidentStatus } from "@/mocks/incidents";
import { stationsStore } from "@/mocks/metro";
import { IncidentDetailSheet } from "@/pages/incidents/components/IncidentDetailSheet";
import {
  INCIDENT_LOCATION_LABEL,
  INCIDENT_SEVERITY_LABEL,
  INCIDENT_TYPE_LABEL,
} from "@/pages/incidents/incidents.constants";
import {
  declinePublication,
  filterIncidents,
  incidentStats,
  publishIncident,
  sortIncidents,
  updateIncidentStatus,
  type IncidentFilter,
} from "@/pages/incidents/incidents.service";
import { formatDateTime } from "@/pages/studentverification/components/format";

const reportResult = (error: string | null, success: string) =>
  error ? toast.error(error) : toast.success(success);

/** Sự cố nhân viên ga báo từ app: Admin và Manager theo dõi, xử lý và quyết định báo hành khách. */
export function IncidentsPage() {
  const incidents = incidentsStore.use();
  const stations = stationsStore.use();
  const [filter, setFilter] = useState<IncidentFilter>({
    tab: "OPEN",
    severity: "ALL",
    stationId: "ALL",
    search: "",
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [declining, setDeclining] = useState(false);

  const stats = incidentStats(incidents);
  const rows = useMemo(
    () => sortIncidents(filterIncidents(incidents, filter)),
    [incidents, filter],
  );
  const selected = incidents.find((incident) => incident.id === selectedId) ?? null;
  const edit = (patch: Partial<IncidentFilter>) => setFilter((f) => ({ ...f, ...patch }));

  return (
    <AppShell title="Sự cố tại ga">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Đang mở"
          value={stats.open}
          icon={CircleAlert}
          tone={stats.open ? "accent" : "muted"}
        />
        <StatCard
          label="Khẩn cấp"
          value={stats.emergency}
          icon={Siren}
          tone={stats.emergency ? "destructive" : "muted"}
        />
        <StatCard
          label="Đề xuất chờ duyệt"
          value={stats.pendingPublication}
          hint="Nhân viên đề nghị báo hành khách"
          icon={Megaphone}
          tone={stats.pendingPublication ? "accent" : "muted"}
        />
        <StatCard
          label="Đang hiện cho hành khách"
          value={stats.published}
          hint="Tự gỡ khi sự cố xử lý xong"
          icon={Radio}
          tone="muted"
        />
      </div>

      <Section
        title="Danh sách sự cố"
        description="Khẩn cấp xếp trước. App chỉ ghi nhận sự cố; nguy hiểm thực tế vẫn phải gọi cứu hộ, an ninh."
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Tabs
            value={filter.tab}
            onValueChange={(tab) => edit({ tab: tab as IncidentFilter["tab"] })}
          >
            <TabsList>
              <TabsTrigger value="OPEN">Đang mở</TabsTrigger>
              <TabsTrigger value="RESOLVED">Đã xử lý</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select
            value={filter.severity}
            onValueChange={(severity) => edit({ severity: severity as IncidentFilter["severity"] })}
          >
            <SelectTrigger className="w-48" aria-label="Lọc theo mức độ">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Mọi mức độ</SelectItem>
              {(Object.keys(INCIDENT_SEVERITY_LABEL) as IncidentSeverity[]).map((severity) => (
                <SelectItem key={severity} value={severity}>
                  {INCIDENT_SEVERITY_LABEL[severity]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filter.stationId} onValueChange={(stationId) => edit({ stationId })}>
            <SelectTrigger className="w-52" aria-label="Lọc theo ga">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Mọi ga</SelectItem>
              {stations.map((station) => (
                <SelectItem key={station.id} value={station.id}>
                  {station.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            aria-label="Tìm sự cố"
            placeholder="Tìm mã, mô tả, người báo"
            className="w-full sm:w-64"
            value={filter.search}
            onChange={(event) => edit({ search: event.target.value })}
          />
        </div>
        <DataTable
          rows={rows}
          empty="Không có sự cố nào"
          onRow={(incident) => setSelectedId(incident.id)}
          cols={[
            { h: "Mã", c: (incident) => <b>{incident.id}</b> },
            {
              h: "Sự cố",
              c: (incident) => (
                <>
                  <p className="font-medium">{INCIDENT_TYPE_LABEL[incident.type]}</p>
                  <p className="text-xs text-muted-foreground">
                    Ga {stationName(incident.stationId)} ·{" "}
                    {INCIDENT_LOCATION_LABEL[incident.location]}
                  </p>
                </>
              ),
            },
            {
              h: "Mức độ",
              c: (incident) => (
                <Badge variant={incident.severity === "EMERGENCY" ? "destructive" : "secondary"}>
                  {INCIDENT_SEVERITY_LABEL[incident.severity]}
                </Badge>
              ),
            },
            { h: "Trạng thái", c: (incident) => <StatusBadge s={incident.status} /> },
            {
              h: "Báo hành khách",
              c: (incident) =>
                incident.publication === "NONE" ? (
                  "—"
                ) : (
                  <StatusBadge
                    s={incident.publication}
                    label={incident.publication === "PENDING" ? "Chờ duyệt" : "Đang hiện"}
                  />
                ),
            },
            { h: "Người báo", c: (incident) => incident.reporterName },
            {
              h: "Lúc báo",
              c: (incident) => (
                <span className="whitespace-nowrap">{formatDateTime(incident.createdAt)}</span>
              ),
            },
          ]}
        />
      </Section>

      <IncidentDetailSheet
        incident={selected}
        onClose={() => setSelectedId(null)}
        onStatus={(status: IncidentStatus) =>
          selected &&
          reportResult(updateIncidentStatus(selected.id, status), "Đã cập nhật trạng thái")
        }
        onPublish={() =>
          selected && reportResult(publishIncident(selected.id), "Đã đăng thông báo cho hành khách")
        }
        onDecline={() => setDeclining(true)}
      />
      <ReasonDialog
        open={declining}
        title="Không báo hành khách"
        confirmLabel="Xác nhận"
        onClose={() => setDeclining(false)}
        onConfirm={(reason) => {
          if (selected) declinePublication(selected.id, reason);
          toast.success("Đã ghi lại lý do");
          setDeclining(false);
        }}
      />
    </AppShell>
  );
}
