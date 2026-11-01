import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Bell, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { notificationsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const KEY = "my-notifications";
/** Backend chưa có realtime nên client tự hỏi lại. Tự dừng khi tab ẩn. */
const POLL_MS = 30_000;

/** Thông báo trong ứng dụng của người đang đăng nhập, đọc từ backend. */
export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const unread = useQuery({
    queryKey: [KEY, "unread"],
    queryFn: notificationsApi.unreadCount,
    enabled: isAuthenticated,
    refetchInterval: POLL_MS,
    retry: false,
  });
  const list = useQuery({
    queryKey: [KEY, "list"],
    queryFn: () => notificationsApi.list({ size: 20 }),
    enabled: isAuthenticated && open,
    retry: false,
  });
  const count = unread.data?.count ?? 0;

  // Chỉ báo khi số chưa đọc tăng trong lúc đang mở app, không báo lại thông báo cũ khi vừa tải trang.
  const previous = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (unread.data === undefined) return;
    if (previous.current !== undefined && count > previous.current)
      toast.info(`Bạn có ${count - previous.current} thông báo mới`);
    previous.current = count;
  }, [unread.data, count]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: [KEY] });
  const markRead = useMutation({ mutationFn: notificationsApi.markRead, onSuccess: refresh });
  const markAllRead = useMutation({ mutationFn: notificationsApi.markAllRead, onSuccess: refresh });

  const items = list.data?.content ?? [];
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={count ? `Thông báo, ${count} chưa đọc` : "Thông báo"}
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] max-w-[calc(100vw-2rem)] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold">Thông báo</p>
          <Button
            variant="ghost"
            size="sm"
            disabled={!count || markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            Đọc tất cả
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {list.isPending && (
            <div className="flex justify-center p-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {list.isError && (
            <p className="p-6 text-center text-sm text-destructive">Không tải được thông báo</p>
          )}
          {list.isSuccess && !items.length && (
            <p className="p-6 text-center text-sm text-muted-foreground">Chưa có thông báo</p>
          )}
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="block w-full border-b px-3 py-2 text-left last:border-0 hover:bg-muted/60"
              onClick={() => {
                if (!item.read) markRead.mutate(item.id);
              }}
            >
              <span className="flex items-start gap-2">
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.read ? "bg-transparent" : "bg-primary"}`}
                />
                <span className="min-w-0">
                  <span className={`block text-sm ${item.read ? "" : "font-semibold"}`}>
                    {item.title}
                  </span>
                  <span className="block whitespace-pre-wrap break-words text-xs text-muted-foreground">
                    {item.body}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {format(parseISO(item.createdAt), "dd/MM/yyyy HH:mm")}
                  </span>
                </span>
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
