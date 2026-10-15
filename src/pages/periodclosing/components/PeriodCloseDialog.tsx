import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function PeriodCloseDialog({
  month,
  pendingReconciliationCount,
  onClose,
  onConfirm,
}: {
  month: string | null;
  pendingReconciliationCount: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={!!month} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Chốt kỳ {month}?</AlertDialogTitle>
          <AlertDialogDescription>
            {pendingReconciliationCount > 0
              ? `Còn ${pendingReconciliationCount} giao dịch chưa đối soát trong hệ thống. `
              : ""}
            Sau khi chốt sẽ không thể đối soát lại các giao dịch trong kỳ này.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Chốt kỳ</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
