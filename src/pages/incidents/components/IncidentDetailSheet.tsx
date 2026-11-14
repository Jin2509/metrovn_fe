import { Megaphone } from "lucide-react";
import { StatusBadge } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useUserNames } from "@/hooks/use-user-names";
import type { StationIncident } from "@/stores/incidents";
import {
  INCIDENT_SEVERITY_LABEL,
  INCIDENT_TYPE_LABEL,
} from "@/pages/incidents/incidents.constants";
import { publicNotice, useIncidentImage } from "@/pages/incidents/hooks";
import { isOpen, isUrgent } from "@/pages/incidents/incidents.service";
import { formatDateTime } from "@/pages/studentverification/components/format";

export function IncidentDetailSheet({
  incident,
  canManage,
  canAnnounce,
  pending,
  onClose,
  onAccept,
  onResolve,
  onAnnounce,
}: {
  incident: StationIncident | null;
  canManage: boolean;
  canAnnounce: boolean;
  pending: boolean;
  onClose: () => void;
  onAccept: () => void;
  onResolve: () => void;
  onAnnounce: () => void;
}) {
  const nameOf = useUserNames();
  const image = useIncidentImage(incident);
  return (
    <Sheet open={!!incident} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        {incident && (
          <>
            <SheetHeader>
              <SheetTitle>
                #{incident.id} · {INCIDENT_TYPE_LABEL[incident.type]}
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-4 px-4 text-sm">
              <p className="text-muted-foreground">Ga {incident.stationName}</p>
              <div className="flex flex-wrap gap-2">
                <StatusBadge s={incident.status} />
                <Badge variant={isUrgent(incident) ? "destructive" : "secondary"}>
                  {INCIDENT_SEVERITY_LABEL[incident.severity]}
                </Badge>
              </div>
              {incident.description && (
                <p className="whitespace-pre-line">{incident.description}</p>
              )}
              {incident.hasImage && (
                <div>
                  {image.url ? (
                    <img
                      src={image.url}
                      alt={`Ảnh hiện trường sự cố #${incident.id}`}
                      className="max-h-72 w-full rounded-md object-contain"
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground" role="status">
                      {image.error ? `Không tải được ảnh: ${image.error}` : "Đang tải ảnh…"}
                    </p>
                  )}
                </div>
              )}

              {canManage && isOpen(incident) && (
                <div className="flex flex-wrap gap-2">
                  {incident.status === "NEW" && (
                    <Button variant="outline" disabled={pending} onClick={onAccept}>
                      Nhận xử lý
                    </Button>
                  )}
                  <Button disabled={pending} onClick={onResolve}>
                    Đã xử lý
                  </Button>
                </div>
              )}

              {canAnnounce && isOpen(incident) && (
                <div className="space-y-3 rounded-lg border p-3">
                  <p className="flex items-center gap-2 font-medium">
                    <Megaphone className="h-4 w-4" aria-hidden />
                    Báo cho hành khách
                  </p>
                  <div className="rounded-md bg-muted/60 p-2.5">
                    <p className="font-medium">{publicNotice(incident).title}</p>
                    <p className="text-muted-foreground">{publicNotice(incident).content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tạo thông báo vận hành tại ga và gửi duyệt. Hành khách chỉ thấy nội dung trên,
                    không có ảnh hay mô tả nội bộ.
                  </p>
                  <Button size="sm" variant="outline" disabled={pending} onClick={onAnnounce}>
                    Gửi duyệt thông báo
                  </Button>
                </div>
              )}

              <div>
                <h3 className="mb-1 font-medium">Lịch sử xử lý</h3>
                <ul className="divide-y">
                  <li className="flex justify-between gap-4 py-1.5">
                    <span>{nameOf(incident.reportedBy)} báo sự cố</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDateTime(incident.createdAt)}
                    </span>
                  </li>
                  {incident.acceptedAt && (
                    <li className="flex justify-between gap-4 py-1.5">
                      <span>{nameOf(incident.handledBy)} nhận xử lý</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDateTime(incident.acceptedAt)}
                      </span>
                    </li>
                  )}
                  {incident.resolvedAt && (
                    <li className="py-1.5">
                      <div className="flex justify-between gap-4">
                        <span>Đã xử lý · {nameOf(incident.handledBy)}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDateTime(incident.resolvedAt)}
                        </span>
                      </div>
                      {incident.resolution && (
                        <p className="mt-1 text-muted-foreground">{incident.resolution}</p>
                      )}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
