import { Mail, Send, Smartphone, Users } from "lucide-react";
import { Section } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";
import { lineStations, lines } from "@/mocks/metro";
import type {
  AnnouncementAudience,
  AnnouncementChannel,
  AnnouncementSeverity,
} from "@/mocks/announcements";
import {
  AUDIENCE_LABELS,
  CHANNELS_BY_AUDIENCE,
  CHANNEL_LABELS,
  SEVERITY_LABELS,
} from "@/pages/notifications/notifications.constants";
import { scopeLabel } from "@/pages/notifications/notifications.service";
import { useComposer } from "@/pages/notifications/hooks/useComposer";

const severityTone: Record<AnnouncementSeverity, string> = {
  INFO: "bg-primary/10 text-primary",
  WARNING: "bg-accent/20 text-accent-foreground",
  CRITICAL: "bg-destructive/10 text-destructive",
};

function FieldError({ msg, show }: { msg?: string; show: boolean }) {
  return show && msg ? <p className="text-xs text-destructive">{msg}</p> : null;
}

/** Form "Gửi thông báo vận hành" (UC13-04). */
export function Composer({ onDone }: { onDone: () => void }) {
  const c = useComposer(onDone);
  const { draft: d, update, errors, showErrors } = c;
  const allowed = CHANNELS_BY_AUDIENCE[d.audience];
  const stationsOfLine = d.lineId ? lineStations(d.lineId) : [];

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_360px]">
      <Section
        title={c.editingId ? "Sửa bản nháp" : "Soạn thông báo vận hành"}
        description="Thay đổi giờ chạy, bảo trì, sự cố tuyến, đóng ga tạm thời… gửi tới nhóm người dùng"
      >
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="an-title">Tiêu đề</Label>
            <Input
              id="an-title"
              maxLength={200}
              value={d.title}
              onChange={(e) => update({ title: e.target.value })}
            />
            <FieldError msg={errors.title} show={showErrors} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="an-content">Nội dung</Label>
            <Textarea
              id="an-content"
              rows={5}
              value={d.content}
              onChange={(e) => update({ content: e.target.value })}
            />
            <FieldError msg={errors.content} show={showErrors} />
          </div>

          <div className="space-y-2">
            <Label>Nhóm nhận</Label>
            <RadioGroup
              value={d.audience}
              onValueChange={(v) => c.setAudience(v as AnnouncementAudience)}
              className="grid gap-2 sm:grid-cols-4"
            >
              {(Object.keys(AUDIENCE_LABELS) as AnnouncementAudience[]).map((a) => (
                <label
                  key={a}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <RadioGroupItem value={a} />
                  {AUDIENCE_LABELS[a]}
                </label>
              ))}
            </RadioGroup>
            <FieldError msg={errors.recipients} show={showErrors} />
          </div>

          <div className="space-y-2">
            <Label>Kênh gửi</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {(Object.keys(CHANNEL_LABELS) as AnnouncementChannel[]).map((ch) => {
                const ok = allowed.includes(ch);
                return (
                  <label
                    key={ch}
                    className={cn(
                      "flex items-start gap-2.5 rounded-lg border p-3",
                      ok ? "cursor-pointer" : "cursor-not-allowed opacity-50",
                    )}
                  >
                    <Checkbox
                      className="mt-0.5"
                      disabled={!ok}
                      checked={ok && d.channels.includes(ch)}
                      onCheckedChange={(v) => c.toggleChannel(ch, !!v)}
                    />
                    <span>
                      <span className="block text-sm font-medium">{CHANNEL_LABELS[ch].label}</span>
                      <span className="block text-xs text-muted-foreground">
                        {CHANNEL_LABELS[ch].hint}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            {d.audience === "ACCOUNTANT" && (
              <p className="text-xs text-muted-foreground">
                Kế toán dùng web quản trị nên chỉ nhận qua email.
              </p>
            )}
            <FieldError msg={errors.channels} show={showErrors} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Mức độ</Label>
              <Select
                value={d.severity}
                onValueChange={(v) => update({ severity: v as AnnouncementSeverity })}
              >
                <SelectTrigger>
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
            <div className="space-y-1.5">
              <Label>Tuyến liên quan</Label>
              <Select
                value={d.lineId ?? "NONE"}
                onValueChange={(v) =>
                  update({ lineId: v === "NONE" ? undefined : v, stationId: undefined })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Không gắn tuyến</SelectItem>
                  {lines.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ga liên quan</Label>
              <Select
                disabled={!d.lineId}
                value={d.stationId ?? "NONE"}
                onValueChange={(v) => update({ stationId: v === "NONE" ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Cả tuyến</SelectItem>
                  {stationsOfLine.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="an-start">Hiệu lực từ</Label>
              <Input
                id="an-start"
                type="datetime-local"
                value={d.startsAt}
                onChange={(e) => update({ startsAt: e.target.value })}
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
          <FieldError msg={errors.period} show={showErrors} />
          <p className="text-xs text-muted-foreground">
            Thông báo có tuyến/ga sẽ hiện ở màn hình tuyến/ga trong ứng dụng và trên Bản đồ hệ thống
            trong thời gian hiệu lực. Thông báo vận hành là loại bắt buộc, hành khách không tắt được
            (UC13-03).
          </p>
        </div>
      </Section>

      <div className="space-y-6 xl:sticky xl:top-28">
        <Section title="Xem trước">
          <div className="space-y-3">
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
            <p className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {d.channels.includes("EMAIL") && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> Email
                </span>
              )}
              {(d.channels.includes("IN_APP") || d.channels.includes("PUSH")) && (
                <span className="flex items-center gap-1">
                  <Smartphone className="h-3.5 w-3.5" /> Ứng dụng di động
                </span>
              )}
            </p>
          </div>
        </Section>
        <Section title="Người nhận">
          <p className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-primary" />
            <b className="tabular-nums">{c.recipients}</b> tài khoản đang hoạt động thuộc nhóm{" "}
            {AUDIENCE_LABELS[d.audience].toLowerCase()}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Đếm từ bảng tài khoản (trạng thái Hoạt động).
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={c.save}>
              Lưu nháp
            </Button>
            <Button onClick={c.send}>
              <Send className="h-4 w-4" />
              Gửi
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
