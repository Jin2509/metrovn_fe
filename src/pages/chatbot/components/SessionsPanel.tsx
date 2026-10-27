import { useState } from "react";
import { DataTable, Section, StatusBadge } from "@/components/shared";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  messagesStore,
  sessionsStore,
  type ChatChannel,
  type SessionStatus,
} from "@/mocks/chatbot";
import { CHANNEL_LABELS, SESSION_STATUS_LABELS } from "@/pages/chatbot/chatbot.constants";
import { SessionSheet } from "@/pages/chatbot/components/SessionSheet";

type Flag = "ALL" | "UNRECOGNIZED" | "DISLIKED";

/** Tab "Lịch sử hội thoại" — bảng chatbot_session + chatbot_message (chỉ đọc). */
export function SessionsPanel() {
  const sessions = sessionsStore.use();
  const messages = messagesStore.use();
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState<"ALL" | ChatChannel>("ALL");
  const [status, setStatus] = useState<"ALL" | SessionStatus>("ALL");
  const [flag, setFlag] = useState<Flag>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const bySession = new Map<string, typeof messages>();
  for (const m of messages) bySession.set(m.sessionId, [...(bySession.get(m.sessionId) ?? []), m]);
  const summary = (id: string) => {
    const list = bySession.get(id) ?? [];
    const bot = list.filter((m) => m.sender === "BOT");
    return {
      questions: list.length - bot.length,
      unrecognized: bot.filter((m) => !m.intent).length,
      likes: bot.filter((m) => m.feedback === "LIKE").length,
      dislikes: bot.filter((m) => m.feedback === "DISLIKE").length,
    };
  };
  const q = query.trim().toLowerCase();
  const rows = sessions
    .map((s) => ({ ...s, ...summary(s.id) }))
    .filter(
      (s) =>
        (channel === "ALL" || s.channel === channel) &&
        (status === "ALL" || s.status === status) &&
        (flag === "ALL" || (flag === "UNRECOGNIZED" ? s.unrecognized > 0 : s.dislikes > 0)) &&
        (!q || `${s.id} ${s.userName}`.toLowerCase().includes(q)),
    );
  const selected = sessions.find((s) => s.id === selectedId) ?? null;

  return (
    <Section
      title="Lịch sử hội thoại"
      description="Chỉ Admin xem được nội dung hội thoại của hành khách"
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <Input
          placeholder="Tìm mã phiên, hành khách…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={channel} onValueChange={(v) => setChannel(v as "ALL" | ChatChannel)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Mọi kênh</SelectItem>
            {(Object.keys(CHANNEL_LABELS) as ChatChannel[]).map((c) => (
              <SelectItem key={c} value={c}>
                {CHANNEL_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as "ALL" | SessionStatus)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Mọi trạng thái</SelectItem>
            {(Object.keys(SESSION_STATUS_LABELS) as SessionStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {SESSION_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={flag} onValueChange={(v) => setFlag(v as Flag)}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả phiên</SelectItem>
            <SelectItem value="UNRECOGNIZED">Có câu chưa nhận diện được</SelectItem>
            <SelectItem value="DISLIKED">Có đánh giá chưa tốt</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable
        rows={rows}
        onRow={(s) => setSelectedId(s.id)}
        empty="Không có phiên phù hợp"
        cols={[
          { h: "Mã phiên", c: (s) => <span className="font-mono text-xs">{s.id}</span> },
          { h: "Hành khách", c: (s) => s.userName },
          { h: "Kênh", c: (s) => CHANNEL_LABELS[s.channel] },
          {
            h: "Bắt đầu",
            c: (s) => <span className="whitespace-nowrap text-xs">{s.startedAt}</span>,
          },
          { h: "Câu hỏi", className: "text-right", c: (s) => s.questions },
          {
            h: "Chưa nhận diện",
            className: "text-right",
            c: (s) =>
              s.unrecognized ? (
                <span className="font-medium text-destructive">{s.unrecognized}</span>
              ) : (
                "—"
              ),
          },
          {
            h: "Đánh giá",
            c: (s) =>
              s.likes || s.dislikes ? (
                <span className="text-xs">
                  {s.likes} hài lòng ·{" "}
                  <span className={s.dislikes ? "text-destructive" : ""}>
                    {s.dislikes} chưa tốt
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              ),
          },
          {
            h: "Trạng thái",
            c: (s) => (
              <StatusBadge
                s={
                  s.status === "ACTIVE" ? "PENDING" : s.status === "CLOSED" ? "SUCCESS" : "EXPIRED"
                }
                label={SESSION_STATUS_LABELS[s.status]}
              />
            ),
          },
        ]}
      />
      <SessionSheet
        session={selected}
        messages={selected ? (bySession.get(selected.id) ?? []) : []}
        onClose={() => setSelectedId(null)}
      />
    </Section>
  );
}
