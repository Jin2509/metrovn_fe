import { RoleBadge } from "@/components/auth/RoleBadge";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, type DemoAccount } from "@/mocks/accounts";

/** Danh sách tài khoản demo — bấm để điền sẵn email và mật khẩu. Chỉ dùng cho môi trường thử nghiệm. */
export function DemoAccounts({ onPick }: { onPick: (account: DemoAccount) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        Tài khoản demo
        <span className="h-px flex-1 bg-border" />
      </div>
      <ul className="space-y-2">
        {DEMO_ACCOUNTS.map((account) => (
          <li key={account.id}>
            <button
              type="button"
              onClick={() => onPick(account)}
              className="flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <RoleBadge role={account.role} className="w-20 justify-center" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{account.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {account.email}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-center text-xs text-muted-foreground">
        Mật khẩu chung: <code className="rounded bg-muted px-1 py-0.5">{DEMO_PASSWORD}</code>
      </p>
    </div>
  );
}
