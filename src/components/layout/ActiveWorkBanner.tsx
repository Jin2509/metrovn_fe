import { Link } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { activeWorkRequestStore, workRequestsStore } from "@/mocks/requests";
import { stopActiveWork } from "@/pages/approvals/work-requests.service";

/**
 * Admin đang làm một yêu cầu của Manager trên các màn hình cấu hình: nhắc rằng đề xuất gửi duyệt
 * lúc này sẽ tự gắn vào yêu cầu đó (xem `submitApproval`).
 */
export function ActiveWorkBanner() {
  const { can } = useAuth();
  const activeId = activeWorkRequestStore.use();
  const request = workRequestsStore.use().find((item) => item.id === activeId);
  if (!request || !can("workRequest.handle")) return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm"
    >
      <ClipboardList className="h-4 w-4 shrink-0 text-primary" />
      <p className="min-w-0 flex-1">
        Đang xử lý yêu cầu <b>{request.id}</b> của {request.by}: {request.title}. Đề xuất gửi duyệt
        lúc này sẽ tự gắn vào yêu cầu.
      </p>
      <div className="flex gap-2">
        <Button asChild size="sm" variant="outline">
          <Link to="/approvals" search={{ request: request.id } as never}>
            Mở yêu cầu
          </Link>
        </Button>
        <Button size="sm" variant="ghost" onClick={stopActiveWork}>
          Ngừng gắn
        </Button>
      </div>
    </div>
  );
}
