import { AlertTriangle, IdCard } from "lucide-react";
import { Can } from "@/components/auth/Can";
import { StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { StudentVerification } from "@/mocks/student-verifications";
import { formatDate, formatDateTime } from "@/pages/studentverification/components/format";

export function ReviewSheet({
  item,
  onClose,
  onApprove,
  onReject,
}: {
  item: StudentVerification | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <Sheet open={!!item} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        {item && (
          <>
            <SheetHeader>
              <SheetTitle>
                {item.id} · {item.accountName}
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge s={item.status} />
                <span className="text-muted-foreground">
                  {item.accountEmail} · gửi lúc {formatDateTime(item.submittedAt)}
                </span>
              </div>

              {item.reasons.length > 0 && (
                <div className="space-y-1 rounded-lg border border-accent/40 bg-accent/10 p-3">
                  {item.reasons.map((reason) => (
                    <p key={reason} className="flex gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" />
                      {reason}
                    </p>
                  ))}
                </div>
              )}

              <div className="rounded-lg border">
                <p className="flex items-center gap-2 border-b px-3 py-2 font-medium">
                  <IdCard className="h-4 w-4" />
                  Thông tin AI đọc được ({Math.round(item.confidence * 100)}%)
                </p>
                <dl className="divide-y">
                  {[
                    ["Họ tên", item.card.fullName],
                    ["Trường", item.card.school],
                    ["Mã sinh viên", item.card.studentCode],
                    ["Hạn thẻ", formatDate(item.card.cardExpiry)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 px-3 py-2">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="text-right font-medium">{value ?? "Không đọc được"}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {item.status === "NEEDS_REVIEW" ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    Ảnh thẻ chỉ được giữ tới khi có kết quả, sau đó xóa theo cam kết với hành khách.
                    Dữ liệu demo không có ảnh thật.
                  </p>
                  <Can
                    action="student.review"
                    fallback={
                      <p className="text-muted-foreground">Manager sẽ quyết định hồ sơ này.</p>
                    }
                  >
                    <div className="flex gap-2">
                      <Button onClick={onApprove}>Duyệt</Button>
                      <Button variant="destructive" onClick={onReject}>
                        Từ chối
                      </Button>
                    </div>
                  </Can>
                </>
              ) : (
                <p className="text-muted-foreground">
                  {item.decidedBy ? `Do ${item.decidedBy} quyết định` : "Hệ thống tự quyết định"}
                  {item.decidedAt && ` lúc ${formatDateTime(item.decidedAt)}`}
                  {item.expiresAt && `. Hiệu lực đến ${formatDate(item.expiresAt)}`}.
                </p>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
