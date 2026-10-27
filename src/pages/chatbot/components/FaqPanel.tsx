import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DataTable, Section, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { faqStore, messagesStore, type FaqCategory } from "@/mocks/chatbot";
import { FAQ_CATEGORY_LABELS } from "@/pages/chatbot/chatbot.constants";
import { setFaqActive } from "@/pages/chatbot/chatbot.service";
import { faqUsage } from "@/pages/chatbot/chatbot.stats";
import { FaqFormDialog } from "@/pages/chatbot/components/FaqFormDialog";
import { useFaqEditor } from "@/pages/chatbot/hooks/useFaqEditor";

/** Tab "Kho tri thức" — bảng chatbot_faq. */
export function FaqPanel() {
  const all = faqStore.use();
  const usage = faqUsage(messagesStore.use());
  const editor = useFaqEditor();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"ALL" | FaqCategory>("ALL");
  const [status, setStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const q = query.trim().toLowerCase();
  const rows = all.filter(
    (f) =>
      (category === "ALL" || f.category === category) &&
      (status === "ALL" || f.status === status) &&
      `${f.question} ${f.answer} ${f.keywords}`.toLowerCase().includes(q),
  );

  return (
    <Section
      title="Kho tri thức (FAQ)"
      description={`${all.filter((f) => f.status === "ACTIVE").length}/${all.length} câu hỏi đang được chatbot sử dụng`}
      action={
        <Button onClick={() => editor.openCreate()}>
          <Plus className="h-4 w-4" />
          Thêm câu hỏi
        </Button>
      }
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <Input
          placeholder="Tìm câu hỏi, câu trả lời, từ khóa…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={category} onValueChange={(v) => setCategory(v as "ALL" | FaqCategory)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Mọi danh mục</SelectItem>
            {(Object.keys(FAQ_CATEGORY_LABELS) as FaqCategory[]).map((c) => (
              <SelectItem key={c} value={c}>
                {FAQ_CATEGORY_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Mọi trạng thái</SelectItem>
            <SelectItem value="ACTIVE">Đang dùng</SelectItem>
            <SelectItem value="INACTIVE">Đang tắt</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable
        rows={rows}
        empty="Không có câu hỏi phù hợp"
        cols={[
          {
            h: "Câu hỏi & trả lời",
            className: "min-w-[320px] max-w-[520px] whitespace-normal",
            c: (f) => (
              <div className="space-y-1">
                <p className="font-medium">{f.question}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{f.answer}</p>
                {f.keywords && (
                  <p className="text-[11px] text-muted-foreground">Từ khóa: {f.keywords}</p>
                )}
              </div>
            ),
          },
          { h: "Danh mục", c: (f) => FAQ_CATEGORY_LABELS[f.category] },
          { h: "Lượt dùng 30 ngày", className: "text-right", c: (f) => usage[f.id] ?? 0 },
          {
            h: "Cập nhật",
            c: (f) => (
              <div className="text-xs">
                <p>{f.updatedAt}</p>
                <p className="text-muted-foreground">{f.createdBy}</p>
              </div>
            ),
          },
          {
            h: "Trạng thái",
            c: (f) => (
              <StatusBadge s={f.status} label={f.status === "ACTIVE" ? "Đang dùng" : "Đang tắt"} />
            ),
          },
          {
            h: "",
            className: "text-right",
            c: (f) => (
              <div className="flex items-center justify-end gap-1">
                <Switch
                  aria-label="Bật/tắt"
                  checked={f.status === "ACTIVE"}
                  onCheckedChange={(v) => {
                    setFaqActive(f, v);
                    toast.success(
                      v ? "Chatbot đã dùng lại câu trả lời này" : "Đã tắt câu trả lời này",
                    );
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Sửa"
                  onClick={() => editor.openEdit(f)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            ),
          },
        ]}
      />
      <FaqFormDialog editor={editor} />
    </Section>
  );
}
