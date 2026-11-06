import { FileText, Paperclip, X } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import type { Attachment } from "@/mocks/requests";
import { ATTACHMENT_ACCEPT, ATTACHMENT_MAX_FILES } from "@/pages/approvals/work-requests.constants";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Danh sách tệp đã đính kèm. Tệp mẫu (không có url) chỉ hiện tên. */
export function AttachmentList({ attachments }: { attachments: Attachment[] }) {
  if (!attachments.length) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {attachments.map((file) => (
        <li key={file.id}>
          <a
            href={file.url}
            download={file.url ? file.name : undefined}
            target="_blank"
            rel="noreferrer"
            title={file.url ? `Tải ${file.name}` : "Tệp mẫu, không có nội dung để tải"}
            className="inline-flex max-w-64 items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-xs hover:bg-muted aria-disabled:pointer-events-none"
            aria-disabled={!file.url}
          >
            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{file.name}</span>
            <span className="shrink-0 text-muted-foreground">{formatBytes(file.size)}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Chọn tệp để gửi kèm. Kiểm tra loại và dung lượng nằm ở `toAttachments` khi gửi. */
export function AttachmentPicker({
  files,
  onChange,
  id,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  id: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <input
        ref={input}
        id={id}
        type="file"
        multiple
        accept={ATTACHMENT_ACCEPT}
        className="sr-only"
        onChange={(event) => {
          onChange([...files, ...Array.from(event.target.files ?? [])]);
          event.target.value = "";
        }}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={files.length >= ATTACHMENT_MAX_FILES}
        onClick={() => input.current?.click()}
      >
        <Paperclip className="h-4 w-4" />
        Đính kèm tệp
      </Button>
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="inline-flex max-w-64 items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1 text-xs"
            >
              <span className="truncate">{file.name}</span>
              <span className="shrink-0 text-muted-foreground">{formatBytes(file.size)}</span>
              <button
                type="button"
                aria-label={`Bỏ ${file.name}`}
                className="rounded p-0.5 hover:bg-background"
                onClick={() => onChange(files.filter((_, i) => i !== index))}
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
