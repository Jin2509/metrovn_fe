import { FieldError as FieldErrorText } from "@/components/form-field";
import { fieldErrorProps, useFocusFirstInvalid } from "@/components/form-field.utils";
import { Send } from "lucide-react";
import { Section } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { lineStationRows, lineStationsStore, linesStore, stationsStore } from "@/stores/metro";
import type { AnnouncementScope, AnnouncementSeverity } from "@/stores/announcements";
import {
  SCOPE_LABELS,
  SEVERITY_LABELS,
  TARGET_ROLES,
} from "@/pages/notifications/notifications.constants";
import { scopeLabel } from "@/pages/notifications/notifications.service";
import { ANNOUNCEMENT_MANAGE } from "@/pages/notifications/hooks/useHistory";
import { useComposer } from "@/pages/notifications/hooks/useComposer";

const severityTone: Record<AnnouncementSeverity, string> = {
  INFO: "bg-primary/10 text-primary",
  WARNING: "bg-accent/20 text-accent-foreground",
  CRITICAL: "bg-destructive/10 text-destructive",
};

/** Lỗi chỉ hiện sau lần bấm Lưu/Gửi đầu tiên (`showErrors`). */
function FieldError({ id, msg, show }: { id: string; msg?: string; show: boolean }) {
  return <FieldErrorText fieldId={id}>{show ? msg : undefined}</FieldErrorText>;
}

/** Form "Gửi thông báo vận hành" (UC13-04). */
export function Composer({ onDone }: { onDone: () => void }) {
  const canManage = useAuth().hasPermission(ANNOUNCEMENT_MANAGE);
  const c = useComposer(onDone);
  const { draft: d, update, errors, showErrors } = c;
  const lines = linesStore.use();
  const stations = stationsStore.use();
  const rows = lineStationsStore.use();
  const stationChoices = d.lineId
    ? lineStationRows(d.lineId, rows)
        .map((r) => stations.find((s) => s.id === r.stationId))
        .filter((s) => !!s)
    : stations;
  const { ref, focusFirstInvalid } = useFocusFirstInvalid<HTMLDivElement>();
  const a11y = (id: string, msg?: string) => fieldErrorProps(id, showErrors ? msg : undefined);
  const needsLine = d.scope === "LINE";
  const showLine = d.scope === "LINE" || d.scope === "STATION";

  if (!canManage)
    return (
      <p className="text-sm text-muted-foreground">
        Tài khoản chưa có quyền soạn thông báo (ANNOUNCEMENT_MANAGE).
      </p>
    );

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_360px]">
      <Section
        title={c.editingId ? "Sửa thông báo" : "Soạn thông báo vận hành"}
        description="Thay đổi giờ chạy, bảo trì, sự cố tuyến, đóng ga tạm thời… Gửi Manager duyệt trước khi phát hành."
      >
        <div ref={ref} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="an-title">Tiêu đề</Label>
            <Input
              id="an-title"
              maxLength={200}
              value={d.title}
              onChange={(e) => update({ title: e.target.value })}
              required
              {...a11y("an-title", errors.title)}
            />
            <FieldError id="an-title" msg={errors.title} show={showErrors} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="an-content">Nội dung</Label>
            <Textarea
              id="an-content"
              rows={5}
              maxLength={2000}
              value={d.content}
              onChange={(e) => update({ content: e.target.value })}
              required
              {...a11y("an-content", errors.content)}
            />
            <FieldError id="an-content" msg={errors.content} show={showErrors} />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium leading-none">Phạm vi nhận</legend>
            <RadioGroup
              value={d.scope}
              onValueChange={(v) => c.setScope(v as AnnouncementScope)}
              className="grid gap-2 sm:grid-cols-4"
            >
              {(Object.keys(SCOPE_LABELS) as AnnouncementScope[]).map((s) => (
                <label
                  key={s}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <RadioGroupItem value={s} />
                  {SCOPE_LABELS[s]}
                </label>
              ))}
            </RadioGroup>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="an-severity">Mức độ</Label>
              <Select
                value={d.severity}
                onValueChange={(v) => update({ severity: v as AnnouncementSeverity })}
              >
                <SelectTrigger id="an-severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SEVERITY_LABELS) as AnnouncementSeverity[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {SEVERITY_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {showLine && (
              <div className="space-y-1.5">
                <Label htmlFor="an-line">{needsLine ? "Tuyến" : "Lọc ga theo tuyến"}</Label>
                <Select
                  value={d.lineId ?? "NONE"}
                  onValueChange={(v) =>
                    update({ lineId: v === "NONE" ? undefined : v, stationId: undefined })
                  }
                >
                  <SelectTrigger id="an-line" {...a11y("an-line", errors.line)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">{needsLine ? "Chọn tuyến" : "Mọi tuyến"}</SelectItem>
                    {lines.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.code} · {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError id="an-line" msg={errors.line} show={showErrors} />
              </div>
            )}
            {d.scope === "STATION" && (
              <div className="space-y-1.5">
                <Label htmlFor="an-station">Ga</Label>
                <Select
                  value={d.stationId ?? "NONE"}
                  onValueChange={(v) => update({ stationId: v === "NONE" ? undefined : v })}
                >
                  <SelectTrigger id="an-station" {...a11y("an-station", errors.station)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Chọn ga</SelectItem>
                    {stationChoices.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError id="an-station" msg={errors.station} show={showErrors} />
              </div>
            )}
            {d.scope === "ROLE" && (
              <div className="space-y-1.5">
                <Label htmlFor="an-role">Vai trò</Label>
                <Select
                  value={d.targetRole ?? "NONE"}
                  onValueChange={(v) => update({ targetRole: v === "NONE" ? undefined : v })}
                >
                  <SelectTrigger id="an-role" {...a11y("an-role", errors.role)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Chọn vai trò</SelectItem>
                    {TARGET_ROLES.map(([code, label]) => (
                      <SelectItem key={code} value={code}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError id="an-role" msg={errors.role} show={showErrors} />
              </div>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="an-start">Hiệu lực từ</Label>
              <Input
                id="an-start"
                type="datetime-local"
                value={d.startsAt}
                onChange={(e) => update({ startsAt: e.target.value })}
                {...a11y("an-period", errors.period)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="an-end">Đến (không bắt buộc)</Label>
              <Input
                id="an-end"
                type="datetime-local"
                value={d.endsAt}
                onChange={(e) => update({ endsAt: e.target.value })}
              />
            </div>
          </div>
          <FieldError id="an-period" msg={errors.period} show={showErrors} />
          <p className="text-xs text-muted-foreground">
            Thông báo có tuyến/ga sẽ hiện ở màn hình tuyến/ga trong ứng dụng và trên Bản đồ hệ thống
            trong thời gian hiệu lực. Sau khi Manager duyệt, hệ thống tự gửi thông báo tới đúng đối
            tượng vào thời điểm hiệu lực; mức Khẩn cấp gửi kèm thông báo đẩy.
          </p>
        </div>
      </Section>

      <div className="space-y-6 xl:sticky xl:top-28">
        <Section title="Xem trước">
          <div className="rounded-lg border p-3">
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[11px] font-semibold",
                severityTone[d.severity],
              )}
            >
              {SEVERITY_LABELS[d.severity]}
            </span>
            <p className="mt-2 font-semibold">{d.title || "Tiêu đề thông báo"}</p>
            <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
              {d.content || "Nội dung thông báo"}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {scopeLabel(d)} · từ {d.startsAt.replace("T", " ") || "—"}
              {d.endsAt && ` đến ${d.endsAt.replace("T", " ")}`}
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              disabled={c.sending}
              onClick={() => void c.save().then((ok) => !ok && focusFirstInvalid())}
            >
              Lưu nháp
            </Button>
            <Button
              disabled={c.sending}
              onClick={() => void c.submit().then((ok) => !ok && focusFirstInvalid())}
            >
              <Send className="h-4 w-4" />
              Gửi duyệt
            </Button>
          </div>
          {c.editingId && (
            <Button variant="ghost" className="mt-2 w-full" onClick={c.reset}>
              Hủy sửa
            </Button>
          )}
        </Section>
      </div>
    </div>
  );
}
