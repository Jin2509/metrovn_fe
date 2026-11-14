import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FieldError } from "@/components/form-field";
import { LoadState, Section } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ApiError,
  apiErrorMessage,
  studentPolicyApi,
  ticketProductsApi,
  type StudentPolicy,
} from "@/lib/api";
import { ticketKeys } from "@/lib/catalogs";
import { fmtInstant } from "@/lib/query-sync";
import { STUDENT_POLICY_KEY } from "@/pages/studentverification/student.service";

type Draft = Omit<StudentPolicy, "aiConfigured" | "aiModel" | "updatedBy" | "updatedAt">;

const FLAGS: [keyof Draft, string][] = [
  ["requireNameMatch", "Tên trên thẻ khớp tên khai báo"],
  ["requireAccountNameMatch", "Tên trên thẻ khớp tên tài khoản"],
  ["requireStudentCodeMatch", "Mã sinh viên khớp mã khai báo"],
  ["requireNotExpired", "Thẻ còn hạn"],
  ["requireValidUntil", "Đọc được hạn thẻ"],
];

const NUMBERS: [keyof Draft, string, number, number, number][] = [
  ["minConfidence", "Độ tin cậy tối thiểu để tự duyệt (0,5–1)", 0.5, 1, 0.01],
  ["discountPercent", "Mức giảm giá sinh viên (%)", 0, 100, 1],
  ["defaultValidityMonths", "Thời hạn mặc định (tháng)", 1, 60, 1],
  ["maxValidityMonths", "Thời hạn tối đa (tháng)", 1, 60, 1],
  ["maxSubmissionsPer30Days", "Số lần gửi tối đa trong 30 ngày", 1, 100, 1],
  ["imageRetentionDays", "Giữ ảnh thẻ (ngày)", 0, 365, 1],
];

/** Tab "Quy tắc tự động": chính sách xác thực sinh viên của backend (`student_policy`). */
export function RulesPanel({ canEdit }: { canEdit: boolean }) {
  const query = useQuery({
    queryKey: STUDENT_POLICY_KEY,
    queryFn: studentPolicyApi.get,
    retry: false,
  });
  return (
    <>
      <LoadState
        loading={query.isPending}
        error={query.error ? apiErrorMessage(query.error) : ""}
        onRetry={() => void query.refetch()}
      />
      {query.data && <PolicyForm key={query.data.version} policy={query.data} canEdit={canEdit} />}
    </>
  );
}

function PolicyForm({ policy, canEdit }: { policy: StudentPolicy; canEdit: boolean }) {
  const queryClient = useQueryClient();
  const products = useQuery({
    queryKey: ticketKeys.products,
    queryFn: ticketProductsApi.all,
    retry: false,
  });
  const [draft, setDraft] = useState<Draft>(() => ({ ...policy }));
  const [school, setSchool] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const addSchool = () => {
    const name = school.trim();
    if (!name) return;
    if (draft.acceptedSchools.some((s) => s.toLowerCase() === name.toLowerCase()))
      return setError("Trường đã có trong danh sách");
    set({ acceptedSchools: [...draft.acceptedSchools, name] });
    setSchool("");
    setError("");
  };

  const save = async () => {
    if (draft.defaultValidityMonths > draft.maxValidityMonths)
      return setError("Thời hạn mặc định không được vượt thời hạn tối đa");
    setError("");
    setPending(true);
    try {
      const { version, ...rest } = draft;
      await studentPolicyApi.update({ version, ...rest });
      toast.success("Đã lưu chính sách. Hồ sơ gửi sau sẽ áp dụng giá trị mới.");
      await queryClient.invalidateQueries({ queryKey: STUDENT_POLICY_KEY });
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        toast.error("Chính sách vừa được người khác sửa, đã tải lại bản mới nhất.");
        await queryClient.invalidateQueries({ queryKey: STUDENT_POLICY_KEY });
      } else toast.error(apiErrorMessage(e));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <Section
        title="Tự động duyệt"
        description={
          policy.aiConfigured
            ? `AI đọc thẻ: ${policy.aiModel ?? "đã cấu hình"}`
            : "Backend chưa cấu hình AI đọc thẻ: mọi hồ sơ chuyển người xem."
        }
      >
        <div className="space-y-4 text-sm">
          <label className="flex items-center justify-between gap-4">
            <span>Cho hành khách gửi xác thực sinh viên</span>
            <Switch
              checked={draft.enabled}
              disabled={!canEdit}
              onCheckedChange={(enabled) => set({ enabled })}
            />
          </label>
          <label className="flex items-center justify-between gap-4">
            <span>Tự duyệt khi đạt mọi điều kiện</span>
            <Switch
              checked={draft.autoApprove}
              disabled={!canEdit}
              onCheckedChange={(autoApprove) => set({ autoApprove })}
            />
          </label>
          <fieldset className="space-y-2">
            <legend className="font-medium">Điều kiện tự duyệt</legend>
            {FLAGS.map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <Checkbox
                  checked={!!draft[key]}
                  disabled={!canEdit}
                  onCheckedChange={(v) => set({ [key]: !!v })}
                />
                {label}
              </label>
            ))}
          </fieldset>
          <div className="grid gap-3 sm:grid-cols-2">
            {NUMBERS.map(([key, label, min, max, step]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={`sp-${key}`}>{label}</Label>
                <Input
                  id={`sp-${key}`}
                  type="number"
                  min={min}
                  max={max}
                  step={step}
                  disabled={!canEdit}
                  value={String(draft[key])}
                  onChange={(e) => set({ [key]: Number(e.target.value) })}
                />
              </div>
            ))}
          </div>
        </div>
      </Section>
      <div className="space-y-6">
        <Section
          title="Trường được tự duyệt"
          description="Trường ngoài danh sách không bị từ chối, mà chuyển người xem."
        >
          <ul className="flex flex-wrap gap-1.5">
            {draft.acceptedSchools.map((name) => (
              <li key={name}>
                <Badge variant="secondary" className="gap-1 font-normal">
                  {name}
                  {canEdit && (
                    <button
                      type="button"
                      className="rounded-sm hover:text-destructive"
                      aria-label={`Bỏ ${name}`}
                      onClick={() =>
                        set({ acceptedSchools: draft.acceptedSchools.filter((s) => s !== name) })
                      }
                    >
                      <X className="h-3 w-3" aria-hidden />
                    </button>
                  )}
                </Badge>
              </li>
            ))}
            {!draft.acceptedSchools.length && (
              <li className="text-sm text-muted-foreground">Chưa có trường nào.</li>
            )}
          </ul>
          {canEdit && (
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addSchool();
              }}
            >
              <Label htmlFor="sp-school" className="sr-only">
                Tên trường
              </Label>
              <Input
                id="sp-school"
                placeholder="Tên trường đúng như in trên thẻ"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
              />
              <Button type="submit" variant="outline">
                <Plus className="h-4 w-4" />
                Thêm
              </Button>
            </form>
          )}
        </Section>
        <Section title="Loại vé được giảm giá sinh viên">
          <LoadState error={products.error ? apiErrorMessage(products.error) : ""} />
          <div className="grid gap-2 sm:grid-cols-2">
            {(products.data ?? []).map((p) => (
              <label key={p.code} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={draft.eligibleProductCodes.includes(p.code)}
                  disabled={!canEdit}
                  onCheckedChange={(v) =>
                    set({
                      eligibleProductCodes: v
                        ? [...draft.eligibleProductCodes, p.code]
                        : draft.eligibleProductCodes.filter((c) => c !== p.code),
                    })
                  }
                />
                {p.name}
              </label>
            ))}
          </div>
        </Section>
        {canEdit && (
          <div className="space-y-2">
            <div role="alert">
              <FieldError fieldId="student-policy">{error}</FieldError>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button disabled={pending} onClick={() => void save()}>
                {pending ? "Đang lưu…" : "Lưu chính sách"}
              </Button>
              <Button variant="outline" disabled={pending} onClick={() => setDraft({ ...policy })}>
                Hoàn tác
              </Button>
              {policy.updatedAt && (
                <span className="text-xs text-muted-foreground">
                  Sửa lần cuối {fmtInstant(policy.updatedAt)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
