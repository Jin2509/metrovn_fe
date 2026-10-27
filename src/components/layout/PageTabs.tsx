import { useNavigate, useSearch } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type PageTab = {
  value: string;
  label: string;
  icon?: LucideIcon;
  content: ReactNode;
  /** Ẩn tab (vd. vai trò hiện tại không có quyền). */
  hidden?: boolean;
};

/**
 * Gom nhiều chức năng liên quan vào một trang dưới dạng tab, thay vì tách thành nhiều mục menu.
 * Tab đang mở được đồng bộ với tham số `?tab=` nên có thể dẫn link thẳng tới từng tab.
 */
export function PageTabs({ tabs }: { tabs: PageTab[] }) {
  const visible = tabs.filter((t) => !t.hidden);
  const { tab } = useSearch({ strict: false }) as { tab?: string };
  const navigate = useNavigate();
  const current = visible.find((t) => t.value === tab)?.value ?? visible[0]?.value;

  if (visible.length === 1) return <>{visible[0].content}</>;

  return (
    <Tabs
      value={current}
      onValueChange={(value) =>
        navigate({
          to: ".",
          // Giữ các tham số khác trên URL (vd. ?station=) khi đổi tab.
          search: (prev: Record<string, unknown>) => ({
            ...prev,
            tab: value === visible[0].value ? undefined : value,
          }),
          replace: true,
        } as never)
      }
      className="space-y-6"
    >
      <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b bg-transparent p-0 sm:w-auto">
        {visible.map((t) => (
          <TabsTrigger
            key={t.value}
            value={t.value}
            className="relative -mb-px gap-2 rounded-none border-b-2 border-transparent px-4 py-2.5 text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            {t.icon && <t.icon className="h-4 w-4" />}
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {visible.map((t) => (
        <TabsContent key={t.value} value={t.value} className="mt-0 space-y-6">
          {t.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
