import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Pencil, Trash2 } from "lucide-react";
import { LazyMap } from "@/components/lazy-map";
import type { MapNetwork } from "@/components/metro-map";
import { Section, StatusBadge } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiErrorMessage, stationsApi, type LineResponse } from "@/lib/api";
import { lineColor, networkKeys } from "@/pages/stations/hooks/useNetwork";
import { STATION_STATUS_LABELS } from "@/pages/stations/stations.service";
import type { StationListRow } from "@/pages/stations/stations.types";

/** Chi tiết ga: gọi song song /stations/{id}/lines và /stations/{id}/connections. */
export function StationDetail({
  station: s,
  allLines,
  network,
  onEdit,
  onDelete,
  onSelectStation,
}: {
  station: StationListRow;
  allLines: LineResponse[];
  network: MapNetwork;
  /** Bỏ trống khi người dùng không có quyền STATION_MANAGE. */
  onEdit?: () => void;
  onDelete?: () => void;
  onSelectStation: (id: number) => void;
}) {
  const linesQuery = useQuery({
    queryKey: networkKeys.stationLines(s.id),
    queryFn: () => stationsApi.lines(s.id),
    retry: false,
  });
  const connectionsQuery = useQuery({
    queryKey: networkKeys.stationConnections(s.id),
    queryFn: () => stationsApi.connections(s.id),
    retry: false,
  });
  const lines = linesQuery.data ?? s.lines;
  const connections = connectionsQuery.data ?? [];
  const lineById = new Map(allLines.map((l) => [l.id, l]));
  const lineLabel = (id: number) => lineById.get(id)?.code ?? `#${id}`;

  return (
    <Section
      className="xl:sticky xl:top-28"
      title={`Ga ${s.nameStation}`}
      description={[s.code, s.address, s.district].filter(Boolean).join(" · ")}
      action={<StatusBadge s={s.status} label={STATION_STATUS_LABELS[s.status]} />}
    >
      {(onEdit || onDelete) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {onEdit && (
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Pencil className="h-4 w-4" /> Sửa thông tin
            </Button>
          )}
          {onDelete && (
            <Button size="sm" variant="outline" className="text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" /> Xoá ga
            </Button>
          )}
        </div>
      )}
      <Tabs defaultValue="info" key={s.id}>
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="info" className="flex-1">
            Vị trí
          </TabsTrigger>
          <TabsTrigger value="lines" className="flex-1">
            Tuyến & chuyển tuyến ({connections.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="space-y-3">
          {s.imageUrl && (
            <img
              src={s.imageUrl}
              alt={`Ga ${s.nameStation}`}
              className="h-40 w-full rounded-lg object-cover"
            />
          )}
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Tọa độ</dt>
              <dd className="tabular-nums">
                {s.latitude.toFixed(5)}, {s.longitude.toFixed(5)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Tuyến</dt>
              <dd className="flex flex-wrap gap-1">
                {lines.map((l) => (
                  <Badge key={l.id} variant="outline" style={{ borderColor: lineColor(l) }}>
                    {l.code}
                  </Badge>
                ))}
                {!lines.length && <span className="text-muted-foreground">Chưa gắn tuyến</span>}
                {s.isInterchange && <Badge variant="secondary">Chuyển tuyến</Badge>}
              </dd>
            </div>
          </dl>
          <LazyMap
            height={260}
            network={network}
            focusStationId={String(s.id)}
            onSelectStation={(id) => onSelectStation(Number(id))}
            showBus={false}
          />
        </TabsContent>
        <TabsContent value="lines" className="space-y-3">
          {linesQuery.isError && (
            <p className="text-sm text-destructive">{apiErrorMessage(linesQuery.error)}</p>
          )}
          <div className="space-y-2">
            {lines.map((l) => (
              <div key={l.id} className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                <span className="h-3 w-3 rounded-full" style={{ background: lineColor(l) }} />
                <span className="font-medium">{l.code}</span>
                <span className="text-muted-foreground">{l.nameLine}</span>
              </div>
            ))}
          </div>
          <p className="pt-2 text-xs font-semibold uppercase text-muted-foreground">
            Điểm chuyển tuyến tại ga
          </p>
          {connectionsQuery.isError && (
            <p className="text-sm text-destructive">{apiErrorMessage(connectionsQuery.error)}</p>
          )}
          {connectionsQuery.isSuccess && !connections.length && (
            <p className="text-sm text-muted-foreground">
              Chưa cấu hình chuyển tuyến. Thêm ở tab "Tuyến & thứ tự ga".
            </p>
          )}
          {connections.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border p-3 text-sm"
            >
              <span className="flex items-center gap-1.5 font-medium">
                {lineLabel(c.fromLineId)} <ArrowRight className="h-3.5 w-3.5" />{" "}
                {lineLabel(c.toLineId)}
              </span>
              <span className="flex items-center gap-2 text-muted-foreground">
                {c.transferTimeMinutes} phút
                <StatusBadge s={c.status} label={c.status === "ACTIVE" ? "Hoạt động" : "Tắt"} />
              </span>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </Section>
  );
}
