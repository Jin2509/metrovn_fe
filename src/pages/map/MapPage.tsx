import { Link, useNavigate } from "@tanstack/react-router";
import { Building2, Bus, Map as MapIcon, Megaphone, TrainFront, Wrench } from "lucide-react";
import { AppShell, PageTabs } from "@/components/app-shell";
import { LazyMap } from "@/components/lazy-map";
import { Section, StatCard } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { BusesPanel } from "@/pages/buses";
import { MapControls } from "@/pages/map/components/MapControls";
import { SelectedStationCard } from "@/pages/map/components/SelectedStationCard";
import { useMap } from "@/pages/map/hooks/useMap";
import { SEVERITY_LABELS } from "@/pages/notifications/notifications.constants";
import { draftPrefillStore, scopeLabel } from "@/pages/notifications/notifications.service";

function SystemMapPanel() {
  const m = useMap();
  const navigate = useNavigate();
  const announce = (lineId: string, stationId: string) => {
    draftPrefillStore.set(() => ({
      draft: { lineId, stationId, severity: "WARNING", audience: "PASSENGER" },
    }));
    navigate({ to: "/notifications" });
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ga đang hoạt động" value={m.kpis.activeStations} icon={Building2} />
        <StatCard
          label="Ga đang bảo trì"
          value={m.kpis.maintenance}
          icon={Wrench}
          tone={m.kpis.maintenance ? "accent" : "muted"}
        />
        <StatCard
          label="Thông báo đang hiệu lực"
          value={m.kpis.announcements}
          hint="Hành khách đang thấy trong ứng dụng"
          icon={Megaphone}
          tone={m.kpis.announcements ? "accent" : "muted"}
        />
        <StatCard
          label="Tàu đang chạy (mô phỏng)"
          value={m.kpis.trainsRunning}
          hint={
            !m.config
              ? "Chưa có cấu hình vận hành đang áp dụng"
              : m.kpis.trainsRunning
                ? `Theo cấu hình v${m.config.version}: ${m.config.headwayMinutes} phút/chuyến`
                : `Ngoài giờ vận hành (${m.config.startTime}–${m.config.endTime})`
          }
          icon={TrainFront}
          tone="success"
        />
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="min-w-0">
          <CardContent className="space-y-2 p-3">
            <LazyMap
              height={640}
              visibleLines={m.visibleLines}
              showBus={m.showBus}
              focusStationId={m.selectedStationId}
              onSelectStation={m.selectStation}
              stationStates={m.stationStates}
              trains={m.trains}
            />
            <p className="px-1 text-xs text-muted-foreground">
              Vị trí tàu là mô phỏng theo cấu hình vận hành đang áp dụng và thời gian chạy giữa các
              ga, cập nhật mỗi 5 giây; không phải định vị thực tế.
            </p>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <SelectedStationCard selected={m.selected} onAnnounce={announce} />
          <Section
            title="Thông báo vận hành đang hiệu lực"
            action={
              <Link
                to="/notifications"
                search={{ tab: "history" }}
                className="text-xs text-primary hover:underline"
              >
                Xem tất cả
              </Link>
            }
          >
            {m.active.length ? (
              <ul className="space-y-2">
                {m.active.map((a) => (
                  <li key={a.id} className="rounded-md border p-2.5 text-sm">
                    <p className="text-xs text-muted-foreground">
                      {SEVERITY_LABELS[a.severity]} · {scopeLabel(a)}
                    </p>
                    <p className="font-medium">{a.title}</p>
                    {a.endsAt && <p className="text-xs text-muted-foreground">Đến {a.endsAt}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Không có thông báo nào đang hiệu lực.</p>
            )}
          </Section>
          <MapControls
            lines={m.lines}
            visibleLines={m.visibleLines}
            onLineVisibilityChange={m.setLineVisibility}
            showBus={m.showBus}
            onShowBusChange={m.setShowBus}
            showTrains={m.showTrains}
            onShowTrainsChange={m.setShowTrains}
          />
        </div>
      </div>
    </>
  );
}

export function MapPage() {
  return (
    <AppShell title="Bản đồ hệ thống">
      <PageTabs
        tabs={[
          {
            value: "network",
            label: "Bản đồ hệ thống",
            icon: MapIcon,
            content: <SystemMapPanel />,
          },
          { value: "buses", label: "Xe buýt kết nối", icon: Bus, content: <BusesPanel /> },
        ]}
      />
    </AppShell>
  );
}
