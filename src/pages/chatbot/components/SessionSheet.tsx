import { ThumbsDown, ThumbsUp } from "lucide-react";
import { StatusBadge } from "@/components/shared";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { ChatbotMessage, ChatbotSession } from "@/mocks/chatbot";
import {
  CHANNEL_LABELS,
  INTENT_INFO,
  RESPONSE_LIMIT_MS,
  SESSION_STATUS_LABELS,
} from "@/pages/chatbot/chatbot.constants";

export function SessionSheet({
  session: s,
  messages,
  onClose,
}: {
  session: ChatbotSession | null;
  messages: ChatbotMessage[];
  onClose: () => void;
}) {
  return (
    <Sheet open={!!s} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {s && (
          <>
            <SheetHeader className="border-b">
              <SheetTitle className="flex items-center gap-2">
                {s.id}{" "}
                <StatusBadge
                  s={
                    s.status === "ACTIVE"
                      ? "PENDING"
                      : s.status === "CLOSED"
                        ? "SUCCESS"
                        : "EXPIRED"
                  }
                  label={SESSION_STATUS_LABELS[s.status]}
                />
              </SheetTitle>
              <SheetDescription>
                {s.userName} · {CHANNEL_LABELS[s.channel]} · {s.startedAt}
                {s.endedAt && ` → ${s.endedAt.slice(11)}`}
              </SheetDescription>
            </SheetHeader>
            <ol className="space-y-3 p-4" aria-label="Nội dung hội thoại">
              {messages.map((m) =>
                m.sender === "USER" ? (
                  <li
                    key={m.id}
                    className="ml-auto max-w-[85%] rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground"
                  >
                    {m.content}
                  </li>
                ) : (
                  <li key={m.id} className="max-w-[90%] space-y-1">
                    <div className="rounded-xl bg-muted px-3 py-2 text-sm">{m.content}</div>
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 px-1 text-[11px] text-muted-foreground">
                      <span className={m.intent ? "" : "font-semibold text-destructive"}>
                        {m.intent ? INTENT_INFO[m.intent].label : "Không nhận diện được"}
                      </span>
                      {m.confidence !== null && <span>độ tin cậy {m.confidence.toFixed(2)}</span>}
                      {m.actionCalled && <span className="font-mono">{m.actionCalled}</span>}
                      {m.responseTimeMs !== null && (
                        <span
                          className={cn(
                            m.responseTimeMs > RESPONSE_LIMIT_MS &&
                              "font-semibold text-destructive",
                          )}
                        >
                          {(m.responseTimeMs / 1000).toLocaleString("vi-VN", {
                            maximumFractionDigits: 1,
                          })}{" "}
                          giây
                        </span>
                      )}
                      {m.feedback === "LIKE" && <ThumbsUp className="h-3 w-3 text-success" />}
                      {m.feedback === "DISLIKE" && (
                        <ThumbsDown className="h-3 w-3 text-destructive" />
                      )}
                    </p>
                  </li>
                ),
              )}
            </ol>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
