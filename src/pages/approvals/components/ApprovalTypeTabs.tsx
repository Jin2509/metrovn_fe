import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { approvalLabel, type ApprovalType } from "@/mocks/admin";
import type { ApprovalTypeTab } from "@/pages/approvals/approvals.types";

export function ApprovalTypeTabs({
  value,
  onValueChange,
}: {
  value: ApprovalTypeTab;
  onValueChange: (value: ApprovalTypeTab) => void;
}) {
  return (
    <Tabs value={value} onValueChange={(nextValue) => onValueChange(nextValue as ApprovalTypeTab)}>
      <TabsList className="flex-wrap">
        <TabsTrigger value="ALL">Tất cả</TabsTrigger>
        {(Object.keys(approvalLabel) as ApprovalType[]).map((type) => (
          <TabsTrigger key={type} value={type}>
            {approvalLabel[type]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
