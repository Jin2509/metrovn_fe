import { Link } from "@tanstack/react-router";
import { CatalogSection } from "@/components/catalog/CatalogSection";
import { Section } from "@/components/shared";
import { useAuth } from "@/lib/auth";
import { schoolCatalog } from "@/lib/catalogs";
import { systemParamsStore } from "@/mocks/system-params";
import type { StudentSchool } from "@/mocks/student-verifications";

/** Tab "Quy tắc tự động": ngưỡng nằm ở Tham số hệ thống, danh sách trường do Admin đề xuất. */
export function RulesPanel() {
  const { can } = useAuth();
  const params = systemParamsStore.use().filter((param) => param.group === "STUDENT");

  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <Section
        title="Ngưỡng và thời hạn"
        description="Hồ sơ gửi sau khi đổi mới áp dụng giá trị mới."
        action={
          <Link to="/system-params" className="text-sm text-primary hover:underline">
            Mở Tham số hệ thống
          </Link>
        }
      >
        <dl className="divide-y text-sm">
          {params.map((param) => (
            <div key={param.key} className="flex justify-between gap-4 py-2 first:pt-0 last:pb-0">
              <dt className="text-muted-foreground">{param.label}</dt>
              <dd className="font-medium">
                {param.value} {param.unit}
              </dd>
            </div>
          ))}
        </dl>
      </Section>
      <CatalogSection<StudentSchool>
        catalog={schoolCatalog}
        title="Trường được tự duyệt"
        description="Trường ngoài danh sách không bị từ chối, mà chuyển người xem."
        canEdit={can("student.configure")}
        columns={[{ h: "Tên trường", c: (school) => school.name }]}
      />
    </div>
  );
}
