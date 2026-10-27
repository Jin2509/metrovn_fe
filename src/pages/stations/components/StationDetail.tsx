import { Link, useNavigate } from "@tanstack/react-router";
import { Megaphone, Pencil, Trash2 } from "lucide-react";
import { LazyMap } from "@/components/lazy-map";
import { Section, StatusBadge } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STATION_STATUS_LABELS } from "@/lib/network";
import { usersStore } from "@/mocks/admin";
import { announcementsStore } from "@/mocks/announcements";
import { stopsForStation } from "@/mocks/metro";
import { SEVERITY_LABELS } from "@/pages/notifications/notifications.constants";
import {
  activeForPassengers,
  draftPrefillStore,
} from "@/pages/notifications/notifications.service";
import type { StationListRow } from "@/pages/stations/stations.types";

export function StationDetail({
  station: s,
  onEdit,
  onDelete,
  onSelectStation,
}: {
  station: StationListRow;
  onEdit: () => void;
  onDelete: () => void;
  onSelectStation: (id: string) => void;
}) {
  const navigate = useNavigate();
  const staff = usersStore.use().filter((u) => u.role === "STAFF" && u.stationId === s.id);
  const notices = activeForPassengers(announcementsStore.use()).filter((a) => a.stationId === s.id);
  const stops = stopsForStation(s.id);

  return (
    <Section
      className="xl:sticky xl:top-28"
      title={`Ga ${s.name}`}
      description={`${s.code} · ${s.address} · ${s.district}`}
      action={<StatusBadge s={s.status} label={STATION_STATUS_LABELS[s.status]} />}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Pencil className="h-4 w-4" /> Sửa thông tin
        </Button>
        <Button size="sm" variant="outline" className="text-destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4" /> Xóa ga
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            draftPrefillStore.set(() => ({
              draft: { lineId: s.lineIds[0], stationId: s.id, severity: "WARNING" },
            }));
            navigate({ to: "/notifications" });
          }}
        >
          <Megaphone className="h-4 w-4" /> Tạo thông báo cho ga
        </Button>
      </div>
      <Tabs defaultValue="info" key={s.id}>
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="info" className="flex-1">
            Vị trí
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex-1">
            Nhân viên ({staff.length})
          </TabsTrigger>
          <TabsTrigger value="bus" className="flex-1">
            Xe buýt ({stops.length})
          </TabsTrigger>
          <TabsTrigger value="notices" className="flex-1">
            Thông báo ({notices.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="space-y-3">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Tọa độ</dt>
              <dd className="tabular-nums">
                {s.lat.toFixed(5)}, {s.lng.toFixed(5)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Tuyến</dt>
              <dd className="flex flex-wrap gap-1">
                {s.lines.map((l) => (
                  <Badge key={l.id} variant="outline" style={{ borderColor: l.colorHex }}>
                    {l.code}
                  </Badge>
                ))}
                {s.interchange && <Badge variant="secondary">Chuyển tuyến</Badge>}
              </dd>
            </div>
            {s.status === "ACTIVE" && (
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">Lượt vào trung bình</dt>
                <dd>{s.dailyFlow.toLocaleString("vi-VN")} lượt/ngày (từ lịch sử quét vé)</dd>
              </div>
            )}
          </dl>
          <LazyMap
            height={260}
            focusStationId={s.id}
            onSelectStation={onSelectStation}
            showBus={false}
          />
        </TabsContent>
        <TabsContent value="staff" className="space-y-2">
          {staff.length ? (
            staff.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-lg border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <StatusBadge s={u.status} />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Chưa có nhân viên được phân công.</p>
          )}
          <Button asChild size="sm" variant="link" className="px-0">
            <Link to="/users" search={{ tab: "assignments" }}>
              Phân công nhân viên ga
            </Link>
          </Button>
        </TabsContent>
        <TabsContent value="bus" className="space-y-2">
          {stops.length === 0 && (
            <p className="text-sm text-muted-foreground">Chưa có trạm buýt kết nối.</p>
          )}
          {stops.map((stop) => (
            <div key={stop.id} className="rounded-lg border p-3 text-sm">
              <p className="font-medium">{stop.name}</p>
              <p className="text-xs text-muted-foreground">Đi bộ ~{stop.walkMinutes} phút</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {stop.routes.map((route) => (
                  <Badge key={route} className="bg-bus text-primary-foreground">
                    {route}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="notices" className="space-y-2">
          {notices.length ? (
            notices.map((a) => (
              <div key={a.id} className="rounded-lg border p-3 text-sm">
                <p className="text-xs text-muted-foreground">
                  {SEVERITY_LABELS[a.severity]} · {a.startsAt} → {a.endsAt ?? "không thời hạn"}
                </p>
                <p className="font-medium">{a.title}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Không có thông báo đang hiệu lực cho ga này.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </Section>
  );
}
