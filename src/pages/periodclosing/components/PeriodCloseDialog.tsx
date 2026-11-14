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
  pendingRefundCount,
  onClose,
  onConfirm,
}: {
  month: string | null;
  pendingRefundCount: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={!!month} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Chốt kỳ {month}?</AlertDialogTitle>
          <AlertDialogDescription>
            {pendingRefundCount > 0
              ? `Còn ${pendingRefundCount} giao dịch chờ hoàn tiền trong hệ thống. `
              : ""}
            Hãy chạy đối soát SePay cho kỳ này trước khi chốt. Trạng thái chốt kỳ hiện chỉ lưu trên
            trình duyệt này vì backend chưa có API chốt kỳ.
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
