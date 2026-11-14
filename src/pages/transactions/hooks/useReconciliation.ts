import { useQueryClient } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage, transactionsApi, type ReconcileResult } from "@/lib/api";
import { todayIso } from "@/lib/query-sync";
import { dayRange } from "@/pages/transactions/transactions.service";

/** Đối chiếu giao dịch SePay với hệ thống trong một khoảng ngày, rồi ghi chú các dòng lệch. */
export function useReconciliation() {
  const queryClient = useQueryClient();
  const [from, setFrom] = useState(() => todayIso(subDays(new Date(), 6)));
  const [to, setTo] = useState(() => todayIso());
  const [result, setResult] = useState<ReconcileResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [noted, setNoted] = useState<Record<number, string>>({});

  const run = async () => {
    if (running) return;
    if (!from || !to) return setError("Chọn khoảng ngày cần đối soát");
    if (from > to) return setError("Ngày bắt đầu phải trước ngày kết thúc");
    setError("");
    setRunning(true);
    try {
      const range = dayRange(from, to);
      setResult(await transactionsApi.reconcile(range.from, range.to));
      setNoted({});
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setRunning(false);
    }
  };

  const saveNote = async (sepayId: number, note: string) => {
    try {
      await transactionsApi.noteSepay(sepayId, note);
      setNoted((current) => ({ ...current, [sepayId]: note }));
      toast.success("Đã lưu ghi chú xử lý");
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
      return true;
    } catch (e) {
      toast.error(apiErrorMessage(e));
      return false;
    }
  };

  return { from, setFrom, to, setTo, result, running, error, run, noted, saveNote };
}
