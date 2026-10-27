import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { FaqCategory } from "@/mocks/chatbot";
import { FAQ_CATEGORY_LABELS } from "@/pages/chatbot/chatbot.constants";
import type { FaqEditor } from "@/pages/chatbot/hooks/useFaqEditor";

export function FaqFormDialog({ editor }: { editor: FaqEditor }) {
  const { open, setOpen, editing, draft: d, setDraft, errors, submit } = editor;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Sửa câu hỏi thường gặp" : "Thêm vào kho tri thức"}</DialogTitle>
          <DialogDescription>
            Chatbot tìm câu trả lời trong kho tri thức theo nội dung câu hỏi và từ khóa (tìm kiếm
            toàn văn).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="faq-q">Câu hỏi</Label>
            <Input
              id="faq-q"
              value={d.question}
              onChange={(e) => setDraft({ ...d, question: e.target.value })}
            />
            {errors.question && <p className="text-xs text-destructive">{errors.question}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="faq-a">Câu trả lời</Label>
            <Textarea
              id="faq-a"
              rows={5}
              value={d.answer}
              onChange={(e) => setDraft({ ...d, answer: e.target.value })}
            />
            {errors.answer && <p className="text-xs text-destructive">{errors.answer}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Danh mục</Label>
              <Select
                value={d.category}
                onValueChange={(v) => setDraft({ ...d, category: v as FaqCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(FAQ_CATEGORY_LABELS) as FaqCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {FAQ_CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="faq-k">Từ khóa</Label>
              <Input
                id="faq-k"
                placeholder="phân tách bằng dấu phẩy"
                value={d.keywords}
                onChange={(e) => setDraft({ ...d, keywords: e.target.value })}
              />
            </div>
          </div>
          <label className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <span>
              <span className="block text-sm font-medium">Đang sử dụng</span>
              <span className="block text-xs text-muted-foreground">
                Tắt để chatbot tạm không dùng câu trả lời này.
              </span>
            </span>
            <Switch checked={d.active} onCheckedChange={(active) => setDraft({ ...d, active })} />
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button onClick={submit}>{editing ? "Lưu thay đổi" : "Thêm"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
