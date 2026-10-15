import { Section } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { NOTIFICATION_AUDIENCES } from "@/pages/notifications/notifications.constants";
import type {
  NotificationAudience,
  NotificationDraft,
} from "@/pages/notifications/notifications.types";

export function NotificationComposer({
  draft,
  error,
  onDraftChange,
  onSend,
}: {
  draft: NotificationDraft;
  error: string;
  onDraftChange: (draft: NotificationDraft) => void;
  onSend: () => void;
}) {
  return (
    <Section title="Soạn thông báo">
      <div className="space-y-3">
        <div>
          <Label>Tiêu đề</Label>
          <Input
            value={draft.title}
            onChange={(event) => onDraftChange({ ...draft, title: event.target.value })}
          />
        </div>
        <div>
          <Label>Nội dung</Label>
          <Textarea
            rows={5}
            value={draft.body}
            onChange={(event) => onDraftChange({ ...draft, body: event.target.value })}
          />
        </div>
        <div>
          <Label>Nhóm nhận</Label>
          <Select
            value={draft.audience}
            onValueChange={(audience) =>
              onDraftChange({ ...draft, audience: audience as NotificationAudience })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NOTIFICATION_AUDIENCES.map((audience) => (
                <SelectItem key={audience} value={audience}>
                  {audience}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button className="w-full" onClick={onSend}>
          Gửi thông báo
        </Button>
      </div>
    </Section>
  );
}
