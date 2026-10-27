import { Link } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import { Section, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { STATION_STATUS_LABELS, lineCode } from "@/lib/network";
import { SEVERITY_LABELS } from "@/pages/notifications/notifications.constants";
import type { useMap } from "@/pages/map/hooks/useMap";

type Selected = NonNullable<ReturnType<typeof useMap>["selected"]>;

export function SelectedStationCard({
  selected,
  onAnnounce,
}: {
  selected: Selected | null;
  onAnnounce: (lineId: string, stationId: string) => void;
}) {
  if (!selected)
    return (
      <Section title="Ga đang chọn">
        <p className="text-sm text-muted-foreground">
          Bấm vào một ga trên bản đồ để xem thông tin và thao tác nhanh.
        </p>
      </Section>
    );
  const { station: s, announcements, busStops } = selected;
  return (
    <Section
      title={`Ga ${s.name}`}
      description={`${s.code} · ${s.district} · ${s.lineIds.map(lineCode).join(", ")}${s.interchange ? " · ga chuyển tuyến" : ""}`}
      action={<StatusBadge s={s.status} label={STATION_STATUS_LABELS[s.status]} />}
    >
      <div className="space-y-3 text-sm">
        {s.status === "ACTIVE" && (
          <p className="text-muted-foreground">
            {s.dailyFlow.toLocaleString("vi-VN")} lượt vào/ngày · {busStops.length} trạm buýt kết
            nối
          </p>
        )}
        {announcements.map((a) => (
          <div key={a.id} className="rounded-md border p-2.5">
            <p className="text-xs text-muted-foreground">{SEVERITY_LABELS[a.severity]}</p>
            <p className="font-medium">{a.title}</p>
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button asChild variant="outline" size="sm">
            <Link to="/stations" search={{ station: s.id }}>
              Quản lý ga
            </Link>
          </Button>
          <Button size="sm" onClick={() => onAnnounce(s.lineIds[0], s.id)}>
            <Megaphone className="h-4 w-4" />
            Tạo thông báo
          </Button>
        </div>
      </div>
    </Section>
  );
}
