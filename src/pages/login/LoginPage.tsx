import { TrainFront } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoAccounts } from "@/pages/login/components/DemoAccounts";
import { LoginBrandPanel } from "@/pages/login/components/LoginBrandPanel";
import { LoginForm } from "@/pages/login/components/LoginForm";
import { useLogin } from "@/pages/login/hooks/useLogin";
import { SHOW_DEMO_ACCOUNTS } from "@/pages/login/login.constants";

export function LoginPage({ redirect }: { redirect?: string }) {
  const login = useLogin(redirect);

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
            <CardTitle className="text-xl">Đăng nhập</CardTitle>
            <CardDescription>Dùng tài khoản quản trị do Admin cấp để tiếp tục.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <LoginForm
              draft={login.draft}
              errors={login.errors}
              formError={login.formError}
              pending={login.pending}
              onChange={login.updateDraft}
              onSubmit={login.submit}
            />
            {SHOW_DEMO_ACCOUNTS && (
              <DemoAccounts
                onPick={(account) =>
                  login.updateDraft({ email: account.email, password: account.password })
                }
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
