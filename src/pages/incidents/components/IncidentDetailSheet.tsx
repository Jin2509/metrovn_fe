import { Megaphone } from "lucide-react";
import { Can } from "@/components/auth/Can";
import { StatusBadge } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { stationName } from "@/lib/network";
import type { IncidentEvent, IncidentStatus, StationIncident } from "@/mocks/incidents";
import {
  INCIDENT_LOCATION_LABEL,
  INCIDENT_SEVERITY_LABEL,
  INCIDENT_STATUS_LABEL,
  INCIDENT_TYPE_LABEL,
} from "@/pages/incidents/incidents.constants";
import { isOpen, publicNotice } from "@/pages/incidents/incidents.service";
import { formatDateTime } from "@/pages/studentverification/components/format";

function eventText(event: IncidentEvent) {
  if (event.kind === "PUBLISHED") return `${event.actorName} đăng thông báo cho hành khách`;
  if (event.kind === "PUBLISH_DECLINED")
    return `${event.actorName} không báo hành khách: ${event.note}`;
  return `${INCIDENT_STATUS_LABEL[event.status!]} · ${event.actorName}`;
}

function PublicationBox({
  incident,
  onPublish,
  onDecline,
}: {
  incident: StationIncident;
  onPublish: () => void;
  onDecline: () => void;
}) {
  const notice = publicNotice(incident);
  const proposed = incident.publication === "PENDING";
  const published = incident.publication === "PUBLISHED";
  if (!published && !isOpen(incident)) return null;

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <p className="flex items-center gap-2 font-medium">
        <Megaphone className="h-4 w-4" />
        {published
          ? "Đang hiện cho hành khách"
          : proposed
            ? "Nhân viên đề xuất báo hành khách"
            : "Chưa báo hành khách"}
      </p>
      <div className="rounded-md bg-muted/60 p-2.5">
        <p className="font-medium">{notice.title}</p>
        <p className="text-muted-foreground">{notice.content}</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Hành khách chỉ thấy nội dung trên, không có ảnh hay mô tả nội bộ.
      </p>
      {!published && (
        <Can action="incidents.manage">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={onPublish}>
              {proposed ? "Duyệt và đăng" : "Đăng cho hành khách"}
            </Button>
            {proposed && (
              <Button size="sm" variant="outline" onClick={onDecline}>
                Không đăng
              </Button>
            )}
          </div>
        </Can>
      )}
    </div>
  );
}

export function IncidentDetailSheet({
  incident,
  onClose,
  onStatus,
  onPublish,
  onDecline,
}: {
  incident: StationIncident | null;
  onClose: () => void;
  onStatus: (status: IncidentStatus) => void;
  onPublish: () => void;
  onDecline: () => void;
}) {
  return (
    <Sheet open={!!incident} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        {incident && (
          <>
            <SheetHeader>
              <SheetTitle>
                {incident.id} · {INCIDENT_TYPE_LABEL[incident.type]}
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                Ga {stationName(incident.stationId)} · {INCIDENT_LOCATION_LABEL[incident.location]}
              </p>
              <div className="flex flex-wrap gap-2">
                <StatusBadge s={incident.status} />
                <Badge variant={incident.severity === "EMERGENCY" ? "destructive" : "secondary"}>
                  {INCIDENT_SEVERITY_LABEL[incident.severity]}
                </Badge>
              </div>
              {incident.description && <p>{incident.description}</p>}
              {incident.photoUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {incident.photoUrls.map((url) => (
                    <img
                      key={url}
                      src={url}
                      alt="Ảnh hiện trường"
                      className="aspect-square rounded-md object-cover"
                    />
                  ))}
                </div>
              )}

              {isOpen(incident) && (
                <Can action="incidents.manage">
                  <div className="flex flex-wrap gap-2">
                    {incident.status === "OPEN" && (
                      <Button variant="outline" onClick={() => onStatus("IN_PROGRESS")}>
                        Đang xử lý
                      </Button>
                    )}
                    <Button onClick={() => onStatus("RESOLVED")}>Đã xử lý</Button>
                  </div>
                </Can>
              )}

              <PublicationBox incident={incident} onPublish={onPublish} onDecline={onDecline} />

              <div>
                <p className="mb-1 font-medium">Lịch sử xử lý</p>
                <ul className="divide-y">
                  <li className="flex justify-between gap-4 py-1.5">
                    <span>{incident.reporterName} báo sự cố</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDateTime(incident.createdAt)}
                    </span>
                  </li>
                  {incident.history.map((event) => (
                    <li
                      key={`${event.kind}-${event.at}`}
                      className="flex justify-between gap-4 py-1.5"
                    >
                      <span>{eventText(event)}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDateTime(event.at)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
