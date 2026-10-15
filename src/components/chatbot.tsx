import { useEffect, useRef, useState } from "react";
import { Bot, Send, TrainFront, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { answer } from "@/lib/chatbot";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "bot"; text: string };
const suggestions = ["Buýt gần ga Bến Thành", "Tuyến 19 đi đâu?", "Ga nào đông nhất?"];

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "bot",
      text: "Xin chào! Mình là trợ lý Metro. Hỏi mình về ga, tuyến hoặc xe buýt kết nối nhé.",
    },
  ]);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs, typing]);

  const send = (text: string) => {
    if (!text.trim() || typing) return;
    setMsgs((m) => [...m, { role: "user", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMsgs((m) => [...m, { role: "bot", text: answer(text) }]);
      setTyping(false);
    }, 600);
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 z-[1000] flex h-[520px] w-[min(380px,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl">
          <div className="flex items-center gap-3 bg-sidebar px-4 py-3 text-sidebar-foreground">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
              <TrainFront className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-sidebar-accent-foreground">Trợ lý Metro</p>
              <p className="text-xs opacity-70">Dữ liệu mô phỏng</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Đóng">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm",
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {m.text}
              </div>
            ))}
            {typing && (
              <div className="w-fit rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                Đang trả lời…
              </div>
            )}
            <div ref={end} />
          </div>
          <div className="flex flex-wrap gap-1.5 px-3 pb-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2 border-t p-3"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi…"
            />
            <Button type="submit" size="icon" disabled={typing}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Mở trợ lý"
        className="fixed bottom-6 right-6 z-[1000] flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-xl transition-transform hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>
    </>
  );
}
