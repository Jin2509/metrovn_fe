import { AlertTriangle, Clock, Coins, Crown, Send, Undo2, Zap } from "lucide-react";
import { AppShell, PageTabs } from "@/components/app-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CpointPanel } from "@/pages/green/components/CpointPanel";
import { OfferPolicyPanel } from "@/pages/green/components/OfferPolicyPanel";
import { TierPanel } from "@/pages/green/components/TierPanel";
import { useGreenConfig } from "@/pages/green/hooks/useGreenConfig";

export function GreenJourneyPage() {
  const form = useGreenConfig();
  const { locked, changes, errors, rejected } = form;
  const dirty = !locked && changes.length > 0;

  return (
    <AppShell
      title="Hành trình xanh"
      actions={
        dirty && (
          <>
            <Button variant="outline" onClick={form.reset}>
              <Undo2 className="h-4 w-4" />
              Hoàn tác
            </Button>
            <Button onClick={form.submit} disabled={errors.length > 0}>
              <Send className="h-4 w-4" />
              Gửi duyệt ({changes.length})
            </Button>
          </>
        )
      }
    >
      {locked && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            {changes.length} thay đổi đang chờ Manager duyệt. Hành khách vẫn dùng cấu hình cũ cho
            tới khi được phê duyệt.
          </AlertDescription>
        </Alert>
      )}
      {!locked && !dirty && rejected && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Yêu cầu gần nhất bị {rejected.decidedBy} từ chối: {rejected.reason}
          </AlertDescription>
        </Alert>
      )}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc pl-4">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      <PageTabs
        tabs={[
          {
            value: "cpoint",
            label: "Điểm CPoint",
            icon: Coins,
            content: <CpointPanel form={form} />,
          },
          { value: "tiers", label: "Nâng hạng", icon: Crown, content: <TierPanel form={form} /> },
          {
            value: "policy",
            label: "Chính sách ưu đãi",
            icon: Zap,
            content: <OfferPolicyPanel form={form} />,
          },
        ]}
      />
    </AppShell>
  );
}
