import { Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ROLE_LABELS, useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { threadsStore } from "@/mocks/requests";
import { AttachmentList, AttachmentPicker } from "@/pages/approvals/components/RequestAttachments";
import { postMessage, toAttachments } from "@/pages/approvals/work-requests.service";

/**
 * Luồng trao đổi của một yêu cầu: tin nhắn, tệp đính kèm và các mốc trạng thái (dòng hệ thống).
 * Thay cho việc nhắn qua kênh ngoài để mọi trao đổi gắn với yêu cầu và còn lại để tra cứu.
 */
export function RequestThread({
  requestId,
  canPost,
  placeholder = "Trao đổi với bên còn lại…",
}: {
  requestId: string;
  canPost: boolean;
  placeholder?: string;
}) {
  const messages = threadsStore.use()[requestId] ?? [];
  const { user, role } = useAuth();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const send = () => {
    const { attachments, error } = toAttachments(files);
    if (error) return toast.error(error);
    const failed = postMessage(requestId, text, attachments, role ?? undefined);
    if (failed) return toast.error(failed);
    setText("");
    setFiles([]);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">Trao đổi</p>
      {messages.length === 0 && (
        <p className="text-sm text-muted-foreground">Chưa có trao đổi nào.</p>
      )}
      <ol className="space-y-3">
        {messages.map((message) =>
          message.role === "SYSTEM" ? (
            <li key={message.id} className="text-center text-xs text-muted-foreground">
              {message.text} · {message.at}
            </li>
          ) : (
            <li
              key={message.id}
              className={cn(
                "max-w-[90%] space-y-1.5 rounded-lg border px-3 py-2",
                message.author === user?.name ? "ml-auto bg-primary/5" : "bg-muted/40",
              )}
            >
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{message.author}</span> ·{" "}
                {ROLE_LABELS[message.role]} · {message.at}
              </p>
              {message.text && <p className="whitespace-pre-wrap text-sm">{message.text}</p>}
              <AttachmentList attachments={message.attachments} />
            </li>
          ),
        )}
      </ol>
      {canPost && (
        <div className="space-y-2 rounded-lg border p-3">
          <Textarea
            aria-label="Nội dung trao đổi"
            rows={3}
            placeholder={placeholder}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) send();
            }}
          />
          <div className="flex flex-wrap items-start justify-between gap-2">
            <AttachmentPicker id={`thread-files-${requestId}`} files={files} onChange={setFiles} />
            <Button size="sm" onClick={send}>
              <Send className="h-4 w-4" />
              Gửi
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
