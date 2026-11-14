import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage, studentVerificationsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { StudentVerification } from "@/stores/student-verifications";
import {
  STUDENTS_KEY,
  useStudentVerificationsData,
} from "@/pages/studentverification/student.service";

export const STUDENT_VERIFY = "STUDENT_VERIFY";
export const STUDENT_POLICY_MANAGE = "STUDENT_POLICY_MANAGE";

export function useStudentReview() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canVerify = hasPermission(STUDENT_VERIFY);
  const data = useStudentVerificationsData(canVerify);
  const [pending, setPending] = useState(false);

  const run = async (task: () => Promise<unknown>, success: string) => {
    if (pending) return false;
    setPending(true);
    try {
      await task();
      toast.success(success);
      await queryClient.invalidateQueries({ queryKey: STUDENTS_KEY });
      return true;
    } catch (error) {
      toast.error(apiErrorMessage(error));
      return false;
    } finally {
      setPending(false);
    }
  };

  return {
    ...data,
    canVerify,
    canConfigure: hasPermission(STUDENT_POLICY_MANAGE),
    pending,
    approve: (item: StudentVerification, approvedUntil?: string) =>
      run(
        () =>
          studentVerificationsApi.approve(item.id, { approvedUntil: approvedUntil || undefined }),
        "Đã duyệt. Hành khách sẽ nhận thông báo.",
      ),
    reject: (item: StudentVerification, reason: string) =>
      run(
        () => studentVerificationsApi.reject(item.id, reason),
        "Đã từ chối. Hành khách sẽ thấy lý do và gửi lại được.",
      ),
    revoke: (item: StudentVerification, reason: string) =>
      run(
        () => studentVerificationsApi.revoke(item.id, reason),
        "Đã thu hồi. Hành khách mất giá sinh viên và sẽ thấy lý do.",
      ),
    retryAi: (item: StudentVerification) =>
      run(() => studentVerificationsApi.retryAi(item.id), "Đã cho AI đọc lại ảnh thẻ"),
  };
}

/** Ảnh thẻ (khi backend còn giữ): tải bằng token rồi hiện qua object URL. */
export function useCardImage(item: StudentVerification | null) {
  const id = item?.imageAvailable ? item.id : null;
  const query = useQuery({
    queryKey: [...STUDENTS_KEY, "image", id],
    queryFn: () => studentVerificationsApi.image(id!),
    enabled: id !== null,
    retry: false,
    staleTime: Infinity,
  });
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!query.data) return setUrl(null);
    const next = URL.createObjectURL(query.data);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [query.data]);
  return { url, error: query.error ? apiErrorMessage(query.error) : "" };
}
