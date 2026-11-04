import { ApprovalHistoryTable } from "@/pages/policies/components/ApprovalHistoryTable";
import { DistancePricesTable } from "@/pages/policies/components/DistancePricesTable";
import { GreenPolicyTable } from "@/pages/policies/components/GreenPolicyTable";
import { OperationHoursSection } from "@/pages/policies/components/OperationHoursSection";
import { ParkingPricesTable } from "@/pages/policies/components/ParkingPricesTable";
import { TicketTypesTable } from "@/pages/policies/components/TicketTypesTable";
import { usePolicies } from "@/pages/policies/hooks/usePolicies";

/** Tab "Chính sách đang áp dụng" (chỉ xem) trong trang Phê duyệt & chính sách. */
export function PoliciesPanel() {
  const { prices, ticketTypes, parkingPrices, green, activeOperation, history } = usePolicies();

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <DistancePricesTable prices={prices} />
        <TicketTypesTable ticketTypes={ticketTypes} />
        <ParkingPricesTable prices={parkingPrices} />
        <GreenPolicyTable config={green} />
      </div>
      <OperationHoursSection operation={activeOperation} />
      <ApprovalHistoryTable approvals={history} />
    </>
  );
}
