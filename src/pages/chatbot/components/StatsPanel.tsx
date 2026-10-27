import { useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MessagesSquare, ScanSearch, ThumbsUp, Timer } from "lucide-react";
import { Section, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAuth } from "@/lib/auth";
import { chartTooltipStyle } from "@/lib/chart";
import { cn } from "@/lib/utils";
import type { ChatChannel } from "@/mocks/chatbot";
import { CHANNEL_LABELS, INTENT_INFO, RESPONSE_LIMIT_MS } from "@/pages/chatbot/chatbot.constants";
import { markQuestion, percent } from "@/pages/chatbot/chatbot.service";
import type { ChannelFilter, Period } from "@/pages/chatbot/chatbot.stats";
import { FaqFormDialog } from "@/pages/chatbot/components/FaqFormDialog";
import { SessionSheet } from "@/pages/chatbot/components/SessionSheet";
import { useChatbotStats } from "@/pages/chatbot/hooks/useChatbotStats";
import { useFaqEditor } from "@/pages/chatbot/hooks/useFaqEditor";

const sec = (ms: number) =>
  `${(ms / 1000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} giây`;

function Metric({
  label,
  value,
  detail,
  source,
  icon: Icon,
  tone = "text-primary bg-primary/10",
}: {
  label: string;
  value: string;
  detail: ReactNode;
  source: string;
  icon: typeof Timer;
  tone?: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-1.5 p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", tone)}>
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <div className="text-xs">{detail}</div>
        <p className="border-t pt-1.5 text-[11px] text-muted-foreground">Nguồn: {source}</p>
      </CardContent>
    </Card>
  );
}

/** Tab "Thống kê" — Admin và Manager cùng xem; chỉ Admin thấy nội dung câu hỏi và nút xử lý. */
export function StatsPanel() {
  const { can } = useAuth();
  const canManage = can("chatbot.manage");
  const canRead = can("chatbot.conversations");
  const d = useChatbotStats();
  const s = d.stats;
  const [target, setTarget] = useState<string | null>(null);
  const [openSession, setOpenSession] = useState<string | null>(null);
  const editor = useFaqEditor(() => {
    if (target) markQuestion(target, "ADDED");
    setTarget(null);
  });
  const okLatency = s.p95ResponseMs <= RESPONSE_LIMIT_MS;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          variant="outline"
          value={String(d.period)}
          onValueChange={(v) => v && d.setPeriod(Number(v) as Period)}
        >
          <ToggleGroupItem value="7">7 ngày</ToggleGroupItem>
          <ToggleGroupItem value="30">30 ngày</ToggleGroupItem>
        </ToggleGroup>
        <Select value={d.channel} onValueChange={(v) => d.setChannel(v as ChannelFilter)}>
          <SelectTrigger className="w-40">
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Phiên trò chuyện"
          value={s.sessions.toLocaleString("vi-VN")}
          detail={`${s.questions.toLocaleString("vi-VN")} câu hỏi · Ứng dụng ${s.byChannel.APP}, Website ${s.byChannel.WEB}`}
          source="chatbot_session, chatbot_message (sender = USER)"
          icon={MessagesSquare}
        />
        <Metric
          label="Nhận diện được câu hỏi"
          value={percent(s.recognitionRate)}
          detail={`${s.unrecognized} câu chưa nhận diện · ${s.outOfScope} câu ngoài phạm vi`}
          source="chatbot_message.intent (null = không nhận diện được)"
          icon={ScanSearch}
          tone="text-success bg-success/10"
        />
        <Metric
          label="Thời gian phản hồi"
          value={sec(s.avgResponseMs)}
          detail={
            <span className={okLatency ? "text-success" : "text-destructive"}>
              p95 {sec(s.p95ResponseMs)} · {percent(s.withinLimitRate)} câu trả lời ≤ 3 giây
            </span>
          }
          source="chatbot_message.response_time_ms · yêu cầu UC14: ≤ 3 giây"
          icon={Timer}
          tone="text-accent-foreground bg-accent/15"
        />
        <Metric
          label="Đánh giá hài lòng"
          value={s.feedbackCount ? percent(s.satisfaction) : "—"}
          detail={`${s.likes} hài lòng / ${s.dislikes} chưa tốt · ${percent(s.feedbackRate)} câu trả lời được đánh giá`}
          source="chatbot_message.feedback (LIKE / DISLIKE)"
          icon={ThumbsUp}
          tone="text-muted-foreground bg-muted"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Section title="Câu hỏi theo ngày" description="Nhận diện được so với không nhận diện được">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={d.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  width={36}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="recognized" name="Nhận diện được" stackId="a" fill="var(--chart-1)" />
                <Bar
                  dataKey="unrecognized"
                  name="Không nhận diện được"
                  stackId="a"
                  fill="var(--chart-4)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
        <Section
          title="Hành khách hỏi gì"
          description="Theo nhóm use case của chatbot (cột intent)"
        >
          <ul className="space-y-3.5">
            {d.useCases.map((u) => (
              <li key={u.group} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">{u.group}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {u.count} · {percent(u.share)}
                  </span>
                </div>
                <Progress value={u.share * 100} className="h-1.5" />
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section
          title="Câu hỏi chưa nhận diện được"
          description="Bot trả lời bằng câu dự phòng. Bổ sung vào kho tri thức để lần sau trả lời được."
        >
          {canRead ? (
            <ul className="divide-y">
              {d.unrecognized.map((q) => (
                <li key={q.question} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="text-sm font-medium">{q.question}</p>
                    <p className="text-xs text-muted-foreground">
                      Hỏi {q.count} lần · gần nhất {q.last}
                    </p>
                  </div>
                  {q.handled ? (
                    <StatusBadge s={q.handled} />
                  ) : (
                    canManage && (
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setTarget(q.question);
                            editor.openCreate(q.question);
                          }}
                        >
                          Thêm vào kho tri thức
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markQuestion(q.question, "IGNORED")}
                        >
                          Bỏ qua
                        </Button>
                      </div>
                    )
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {s.unrecognized} câu hỏi chưa nhận diện được. Nội dung câu hỏi chỉ Admin xem được.
            </p>
          )}
        </Section>
        <Section
          title="Câu trả lời bị đánh giá chưa tốt"
          description="Hành khách bấm “không hài lòng” — xem lại để sửa kho tri thức"
        >
          {canRead ? (
            d.disliked.length ? (
              <ul className="max-h-96 divide-y overflow-y-auto">
                {d.disliked.slice(0, 20).map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setOpenSession(r.sessionId)}
                      className="w-full py-3 text-left text-sm hover:bg-muted/50"
                    >
                      <p className="font-medium">{r.question}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">Bot: {r.answer}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {r.at} · {r.intent ? INTENT_INFO[r.intent].label : "Không nhận diện được"}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Không có đánh giá chưa tốt trong khoảng thời gian này.
              </p>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              {s.dislikes} câu trả lời bị đánh giá chưa tốt. Nội dung chỉ Admin xem được.
            </p>
          )}
        </Section>
      </div>
      <FaqFormDialog editor={editor} />
      <SessionSheet
        session={d.sessions.find((x) => x.id === openSession) ?? null}
        messages={d.messages.filter((m) => m.sessionId === openSession)}
        onClose={() => setOpenSession(null)}
      />
    </>
  );
}
