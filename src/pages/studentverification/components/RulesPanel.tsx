import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Section } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { studentRulesStore, type StudentRules } from "@/mocks/student-verifications";
import { NumberField } from "@/pages/green/components/fields";
import { saveStudentRules } from "@/pages/studentverification/student.service";

/** Tab "Quy tắc tự động": Admin chỉnh, Manager chỉ xem. Chỉ áp dụng cho hồ sơ gửi sau khi lưu. */
export function RulesPanel() {
  const saved = studentRulesStore.use();
  const { can } = useAuth();
  const readOnly = !can("student.configure");
  const [draft, setDraft] = useState<StudentRules>(saved);
  const [school, setSchool] = useState("");
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const addSchool = () => {
    const name = school.trim();
    if (!name || draft.schools.includes(name)) return;
    setDraft({ ...draft, schools: [...draft.schools, name] });
    setSchool("");
  };
  const save = () => {
    const error = saveStudentRules(draft);
    if (error) return toast.error(error);
    toast.success("Đã lưu. Quy tắc mới áp dụng cho hồ sơ gửi sau.");
  };

  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <Section
        title="Ngưỡng và thời hạn"
        description={readOnly ? "Chỉ Admin được chỉnh." : "Áp dụng cho hồ sơ gửi sau khi lưu."}
        action={
          !readOnly && (
            <Button onClick={save} disabled={!dirty}>
              Lưu quy tắc
            </Button>
          )
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            id="rule-auto"
            label="Tự duyệt từ độ tin cậy (%)"
            hint="Thấp hơn mức này thì chuyển người xem."
            value={Math.round(draft.autoApproveConfidence * 100)}
            disabled={readOnly}
            onChange={(value) => setDraft({ ...draft, autoApproveConfidence: value / 100 })}
          />
          <NumberField
            id="rule-min"
            label="Coi là đọc được từ (%)"
            hint="Thấp hơn mức này thì yêu cầu chụp lại."
            value={Math.round(draft.minReadableConfidence * 100)}
            disabled={readOnly}
            onChange={(value) => setDraft({ ...draft, minReadableConfidence: value / 100 })}
          />
          <NumberField
            id="rule-validity"
            label="Thời hạn xác nhận (tháng)"
            hint="Không vượt quá hạn in trên thẻ."
            value={draft.validityMonths}
            disabled={readOnly}
            onChange={(validityMonths) => setDraft({ ...draft, validityMonths })}
          />
          <NumberField
            id="rule-renew"
            label="Nhắc gia hạn trước (ngày)"
            hint="App nhắc gửi lại trước khi hết hạn."
            value={draft.renewWithinDays}
            disabled={readOnly}
            onChange={(renewWithinDays) => setDraft({ ...draft, renewWithinDays })}
          />
        </div>
      </Section>
      <Section
        title="Trường được tự duyệt"
        description="Trường ngoài danh sách không bị từ chối, mà chuyển người xem."
      >
        <div className="space-y-3">
          {!readOnly && (
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                addSchool();
              }}
            >
              <Input
                aria-label="Tên trường"
                placeholder="Tên trường đúng như in trên thẻ"
                value={school}
                onChange={(event) => setSchool(event.target.value)}
              />
              <Button type="submit" variant="outline">
                Thêm
              </Button>
            </form>
          )}
          <ul className="divide-y rounded-lg border text-sm">
            {draft.schools.map((name) => (
              <li key={name} className="flex items-center justify-between gap-2 px-3 py-2">
                {name}
                {!readOnly && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    aria-label={`Bỏ ${name}`}
                    onClick={() =>
                      setDraft({ ...draft, schools: draft.schools.filter((s) => s !== name) })
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </div>
  );
}
