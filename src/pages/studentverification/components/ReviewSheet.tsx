import { AlertTriangle, IdCard } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useUserNames } from "@/hooks/use-user-names";
import type { StudentVerification } from "@/stores/student-verifications";
import { formatDate, formatDateTime } from "@/pages/studentverification/components/format";
import { useCardImage } from "@/pages/studentverification/hooks";
import { reasonsOf } from "@/pages/studentverification/student.service";

const same = (a: string | null, b: string | null) =>
  !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

export function ReviewSheet({
  item,
  canVerify,
  pending,
  onClose,
  onApprove,
  onReject,
  onRevoke,
  onRetryAi,
}: {
  item: StudentVerification | null;
  canVerify: boolean;
  pending: boolean;
  onClose: () => void;
  onApprove: (approvedUntil?: string) => void;
  onReject: () => void;
  onRevoke: () => void;
  onRetryAi: () => void;
}) {
  return (
    <Sheet open={!!item} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        {item && (
          <ReviewBody
            key={item.id}
            item={item}
            canVerify={canVerify}
            pending={pending}
            onApprove={onApprove}
            onReject={onReject}
            onRevoke={onRevoke}
            onRetryAi={onRetryAi}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function ReviewBody({
  item,
  canVerify,
  pending,
  onApprove,
  onReject,
  onRevoke,
  onRetryAi,
}: {
  item: StudentVerification;
  canVerify: boolean;
  pending: boolean;
  onApprove: (approvedUntil?: string) => void;
  onReject: () => void;
  onRevoke: () => void;
  onRetryAi: () => void;
}) {
  const nameOf = useUserNames();
  const image = useCardImage(item);
  const [until, setUntil] = useState("");
  const reasons = reasonsOf(item);
  const reviewable = item.status === "NEEDS_REVIEW";
  const rows: [string, string | null, string | null][] = [
    ["Họ tên", item.declared.fullName, item.ai.fullName],
    ["Trường", item.declared.school, item.ai.school],
    ["Mã sinh viên", item.declared.studentCode, item.ai.studentCode],
  ];

  return (
    <>
      <SheetHeader>
        <SheetTitle>{item.accountName}</SheetTitle>
      </SheetHeader>
      <div className="space-y-4 px-4 pb-6 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge s={item.status} />
          <span className="text-muted-foreground">
            {item.accountEmail} · gửi lúc {formatDateTime(item.submittedAt)}
          </span>
        </div>

        {(reasons.length > 0 || item.ai.tamperingSuspected || item.ai.isStudentCard === false) && (
          <div className="space-y-1 rounded-lg border border-accent/40 bg-accent/10 p-3">
            {item.ai.isStudentCard === false && (
              <p className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                AI cho rằng ảnh không phải thẻ sinh viên.
              </p>
            )}
            {item.ai.tamperingSuspected && (
              <p className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                AI nghi ảnh thẻ bị chỉnh sửa.
              </p>
            )}
            {reasons.map((reason) => (
              <p key={reason} className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {reason}
              </p>
            ))}
          </div>
        )}

        {item.imageAvailable &&
          (image.url ? (
            <img
              src={image.url}
              alt={`Ảnh thẻ sinh viên của ${item.accountName}`}
              className="max-h-72 w-full rounded-md object-contain"
            />
          ) : (
            <p className="text-xs text-muted-foreground" role="status">
              {image.error ? `Không tải được ảnh thẻ: ${image.error}` : "Đang tải ảnh thẻ…"}
            </p>
          ))}

        <div className="rounded-lg border">
          <h3 className="flex items-center gap-2 border-b px-3 py-2 font-medium">
            <IdCard className="h-4 w-4" aria-hidden />
            Khai báo và AI đọc được
            {item.ai.confidence != null && ` (${Math.round(item.ai.confidence * 100)}%)`}
          </h3>
          <table className="w-full text-left">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-1.5 font-normal">
                  <span className="sr-only">Thông tin</span>
                </th>
                <th scope="col" className="px-3 py-1.5 font-normal">
                  Hành khách khai
                </th>
                <th scope="col" className="px-3 py-1.5 font-normal">
                  AI đọc
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map(([label, declared, read]) => (
                <tr key={label}>
                  <th scope="row" className="px-3 py-2 font-normal text-muted-foreground">
                    {label}
                  </th>
                  <td className="px-3 py-2">{declared}</td>
                  <td
                    className={`px-3 py-2 font-medium ${read && !same(declared, read) ? "text-destructive" : ""}`}
                  >
                    {read ?? "Không đọc được"}
                  </td>
                </tr>
              ))}
              <tr>
                <th scope="row" className="px-3 py-2 font-normal text-muted-foreground">
                  Hạn thẻ
                </th>
                <td className="px-3 py-2">—</td>
                <td className="px-3 py-2 font-medium">
                  {formatDate(item.ai.validUntil) ?? "Không đọc được"}
                </td>
              </tr>
            </tbody>
          </table>
          {item.ai.notes && (
            <p className="border-t px-3 py-2 text-muted-foreground">{item.ai.notes}</p>
          )}
          {item.ai.error && (
            <p className="border-t px-3 py-2 text-destructive">Lỗi AI: {item.ai.error}</p>
          )}
        </div>

        {canVerify &&
          item.ai.error &&
          (item.status === "NEEDS_REVIEW" || item.status === "PENDING") && (
            <Button variant="outline" disabled={pending} onClick={onRetryAi}>
              Cho AI đọc lại
            </Button>
          )}

        {reviewable ? (
          canVerify ? (
            <div className="space-y-3 rounded-lg border p-3">
              <div className="space-y-1.5">
                <Label htmlFor="student-until">Ưu đãi đến ngày</Label>
                <Input
                  id="student-until"
                  type="date"
                  className="w-48"
                  value={until}
                  aria-describedby="student-until-hint"
                  onChange={(e) => setUntil(e.target.value)}
                />
                <p id="student-until-hint" className="text-xs text-muted-foreground">
                  Bỏ trống: hệ thống tính theo chính sách và hạn thẻ.
                </p>
              </div>
              <div className="flex gap-2">
                <Button disabled={pending} onClick={() => onApprove(until)}>
                  Duyệt
                </Button>
                <Button variant="destructive" disabled={pending} onClick={onReject}>
                  Từ chối
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Manager sẽ quyết định hồ sơ này.</p>
          )
        ) : (
          item.decidedAt && (
            <p className="text-muted-foreground">
              {item.decisionSource === "MANUAL"
                ? `Do ${nameOf(item.reviewedBy)} quyết định`
                : "Hệ thống tự quyết định"}{" "}
              lúc {formatDateTime(item.decidedAt)}
              {item.approvedUntil && `. Hiệu lực đến ${formatDate(item.approvedUntil)}`}.
              {item.reviewNote && ` Ghi chú: ${item.reviewNote}`}
            </p>
          )
        )}
        {canVerify && item.status === "APPROVED" && (
          <div className="space-y-2 rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">
              Phát hiện thẻ giả, mượn thẻ hoặc đã thôi học thì thu hồi để dừng giá sinh viên.
            </p>
            <Button variant="outline" disabled={pending} onClick={onRevoke}>
              Thu hồi xác nhận
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
