import { CircleAlert, CircleCheck, Inbox, Siren } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  DataTable,
  LoadState,
  ReasonDialog,
  Section,
  StatCard,
  StatusBadge,
} from "@/components/shared";
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
import { incidentsStore, type IncidentSeverity } from "@/stores/incidents";
import { stationsStore } from "@/stores/metro";
import { IncidentDetailSheet } from "@/pages/incidents/components/IncidentDetailSheet";
import { useIncidents } from "@/pages/incidents/hooks";
import {
  INCIDENT_SEVERITY_LABEL,
  INCIDENT_TYPE_LABEL,
} from "@/pages/incidents/incidents.constants";
import {
  filterIncidents,
  incidentStats,
  isUrgent,
  sortIncidents,
  type IncidentFilter,
} from "@/pages/incidents/incidents.service";
import { formatDateTime } from "@/pages/studentverification/components/format";

/** Sự cố nhân viên ga báo từ app: Admin và Manager theo dõi và xử lý. */
export function IncidentsPage() {
  const data = useIncidents();
  const incidents = incidentsStore.use();
  const stations = stationsStore.use();
  const [filter, setFilter] = useState<IncidentFilter>({
    tab: "OPEN",
    severity: "ALL",
    stationId: "ALL",
    search: "",
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  const stats = incidentStats(incidents);
  const rows = useMemo(
    () => sortIncidents(filterIncidents(incidents, filter)),
    [incidents, filter],
  );
  const selected = incidents.find((incident) => incident.id === selectedId) ?? null;
  const edit = (patch: Partial<IncidentFilter>) => setFilter((f) => ({ ...f, ...patch }));

  if (!data.canManage)
    return (
      <AppShell title="Sự cố tại ga">
        <p className="text-sm text-muted-foreground">
          Tài khoản chưa có quyền xử lý sự cố (INCIDENT_MANAGE).
        </p>
      </AppShell>
    );

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
          label="Chưa ai nhận"
          value={stats.fresh}
          icon={Inbox}
          tone={stats.fresh ? "accent" : "muted"}
        />
        <StatCard
          label="Mức cao / khẩn cấp"
          value={stats.urgent}
          icon={Siren}
          tone={stats.urgent ? "destructive" : "muted"}
        />
        <StatCard label="Đã xử lý" value={stats.resolved} icon={CircleCheck} tone="muted" />
      </div>

      <Section
        title="Danh sách sự cố"
        description="Mức nặng xếp trước. App chỉ ghi nhận sự cố; nguy hiểm thực tế vẫn phải gọi cứu hộ, an ninh."
      >
        <LoadState loading={data.loading} error={data.loadError} onRetry={data.reload} />
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
            placeholder="Tìm mã, mô tả, tên ga"
            className="w-full sm:w-64"
            value={filter.search}
            onChange={(event) => edit({ search: event.target.value })}
          />
        </div>
        <DataTable
          rows={rows}
          empty="Không có sự cố nào"
          rowKey={(incident) => incident.id}
          rowActionLabel={(incident) => `Xem sự cố ${incident.id}`}
          onRow={(incident) => setSelectedId(incident.id)}
          cols={[
            { h: "Mã", c: (incident) => <b>#{incident.id}</b> },
            {
              h: "Sự cố",
              c: (incident) => (
                <>
                  <p className="font-medium">{INCIDENT_TYPE_LABEL[incident.type]}</p>
                  <p className="text-xs text-muted-foreground">Ga {incident.stationName}</p>
                </>
              ),
            },
            {
              h: "Mức độ",
              c: (incident) => (
                <Badge variant={isUrgent(incident) ? "destructive" : "secondary"}>
                  {INCIDENT_SEVERITY_LABEL[incident.severity]}
                </Badge>
              ),
            },
            { h: "Trạng thái", c: (incident) => <StatusBadge s={incident.status} /> },
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
        canManage={data.canManage}
        canAnnounce={data.canAnnounce}
        pending={data.pending}
        onClose={() => setSelectedId(null)}
        onAccept={() => selected && void data.accept(selected)}
        onResolve={() => setResolving(true)}
        onAnnounce={() => selected && void data.announce(selected)}
      />
      <ReasonDialog
        open={resolving}
        title={selected ? `Đã xử lý sự cố #${selected.id}` : ""}
        fieldLabel="Kết quả xử lý"
        confirmLabel="Xác nhận"
        onClose={() => setResolving(false)}
        onConfirm={(resolution) => {
          if (!selected) return;
          void data.resolve(selected, resolution).then((ok) => ok && setResolving(false));
        }}
      />
    </AppShell>
  );
}
