import { TrainFront } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginBrandPanel } from "@/pages/login/components/LoginBrandPanel";

/** Khung chung của các trang chưa đăng nhập: đăng nhập, quên mật khẩu, đặt lại mật khẩu. */
export function AuthPageLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <LoginBrandPanel className="hidden lg:flex" />
      <main className="flex flex-col items-center justify-center gap-6 px-4 py-10">
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar text-sidebar-primary">
            <TrainFront className="h-5 w-5" />
          </div>
          <p className="font-bold">Metro Admin TP.HCM</p>
        </div>
        <Card className="w-full max-w-md shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">{children}</CardContent>
        </Card>
      </main>
    </div>
  );
}
