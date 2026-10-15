import { AppShell } from "@/components/app-shell";
import { ApprovalHistoryTable } from "@/pages/policies/components/ApprovalHistoryTable";
import { DistancePricesTable } from "@/pages/policies/components/DistancePricesTable";
import { MembershipTiersTable } from "@/pages/policies/components/MembershipTiersTable";
import { OperationHoursSection } from "@/pages/policies/components/OperationHoursSection";
import { ParkingPricesTable } from "@/pages/policies/components/ParkingPricesTable";
import { TicketTypesTable } from "@/pages/policies/components/TicketTypesTable";
import { usePolicies } from "@/pages/policies/hooks/usePolicies";

export function PoliciesPage() {
  const { prices, ticketTypes, parkingPrices, tiers, activeOperation, history } = usePolicies();

  return (
    <AppShell title="Chính sách đang áp dụng" roles={["MANAGER"]}>
      <div className="grid gap-6 lg:grid-cols-2">
        <DistancePricesTable prices={prices} />
        <TicketTypesTable ticketTypes={ticketTypes} />
        <ParkingPricesTable prices={parkingPrices} />
        <MembershipTiersTable tiers={tiers} />
      </div>
      <OperationHoursSection operation={activeOperation} />
      <ApprovalHistoryTable approvals={history} />
    </AppShell>
  );
}
