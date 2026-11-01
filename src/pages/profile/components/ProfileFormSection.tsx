import { Section } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfileForm } from "@/pages/profile/hooks/useProfile";

/** Sửa các trường hồ sơ được phép (AUTH-05): họ tên. Email và vai trò do Admin quản lý. */
export function ProfileFormSection() {
  const f = useProfileForm();
  return (
    <Section title="Thông tin cá nhân">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          f.submit();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="pf-name">Họ tên</Label>
          <Input
            id="pf-name"
            value={f.draft.name}
            onChange={(e) => f.setDraft({ ...f.draft, name: e.target.value })}
          />
          {f.errors.name && <p className="text-xs text-destructive">{f.errors.name}</p>}
        </div>
        <Button type="submit" disabled={!f.dirty || f.pending}>
          Lưu thông tin
        </Button>
      </form>
    </Section>
  );
}
