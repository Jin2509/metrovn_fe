import { Menu } from "lucide-react";
import { useState } from "react";
import { SidebarPanel } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/** Menu dạng ngăn kéo cho màn hình nhỏ — cùng nội dung với sidebar desktop. */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden" aria-label="Mở menu">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-64 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
      >
        <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
        <SheetDescription className="sr-only">Danh sách màn hình theo vai trò</SheetDescription>
        <SidebarPanel onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
