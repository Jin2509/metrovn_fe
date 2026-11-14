import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DataTable, LoadState, Section } from "@/components/shared";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiErrorMessage } from "@/lib/api";
import { fmtInstant } from "@/lib/query-sync";
import { faqStore, type ChatbotFaq, type FaqCategory } from "@/stores/chatbot";
import { FAQ_CATEGORY_LABELS } from "@/pages/chatbot/chatbot.constants";
import { FAQS_KEY, deleteFaq, useFaqsData } from "@/pages/chatbot/chatbot.service";
import { FaqFormDialog } from "@/pages/chatbot/components/FaqFormDialog";
import { useFaqEditor } from "@/pages/chatbot/hooks/useFaqEditor";

/** Tab "Kho tri thức" — bảng chatbot_faq. */
export function FaqPanel() {
  const queryClient = useQueryClient();
  const data = useFaqsData();
  const all = faqStore.use();
  const editor = useFaqEditor();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"ALL" | FaqCategory>("ALL");
  const [deleting, setDeleting] = useState<ChatbotFaq | null>(null);
  const [pending, setPending] = useState(false);
  const q = query.trim().toLowerCase();
  const rows = all.filter(
    (f) =>
      (category === "ALL" || f.category === category) &&
      `${f.question} ${f.answer} ${f.keywords}`.toLowerCase().includes(q),
  );

  const confirmDelete = async () => {
    if (!deleting || pending) return;
    setPending(true);
    try {
      await deleteFaq(deleting);
      toast.success("Đã xóa câu hỏi khỏi kho tri thức");
      setDeleting(null);
      await queryClient.invalidateQueries({ queryKey: FAQS_KEY });
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setPending(false);
    }
  };

  return (
    <Section
      title="Kho tri thức (FAQ)"
      description={`${all.length} câu hỏi chatbot đang dùng để trả lời hành khách`}
      action={
        <Button onClick={() => editor.openCreate()}>
          <Plus className="h-4 w-4" />
          Thêm câu hỏi
        </Button>
      }
    >
      <LoadState loading={data.loading} error={data.loadError} onRetry={data.reload} />
      <div className="mb-3 flex flex-wrap gap-2">
        <Input
          aria-label="Tìm trong kho tri thức"
          placeholder="Tìm câu hỏi, câu trả lời, từ khóa…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={category} onValueChange={(v) => setCategory(v as "ALL" | FaqCategory)}>
          <SelectTrigger className="w-48" aria-label="Lọc theo danh mục">
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
      </div>
      <DataTable
        rows={rows}
        rowKey={(f) => f.id}
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
          { h: "Cập nhật", c: (f) => <span className="text-xs">{fmtInstant(f.updatedAt)}</span> },
          {
            h: "Thao tác",
            className: "text-right",
            c: (f) => (
              <div className="flex items-center justify-end gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Sửa câu hỏi: ${f.question}`}
                  onClick={() => editor.openEdit(f)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  aria-label={`Xóa câu hỏi: ${f.question}`}
                  onClick={() => setDeleting(f)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ),
          },
        ]}
      />
      <FaqFormDialog editor={editor} />
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa câu hỏi khỏi kho tri thức?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.question} — chatbot sẽ thôi dùng câu trả lời này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Section>
  );
}
