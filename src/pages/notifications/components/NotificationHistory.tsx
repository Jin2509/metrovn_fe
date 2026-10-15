import { DataTable, Section } from "@/components/shared";
import type { Notice } from "@/mocks/admin";

export function NotificationHistory({ notices }: { notices: Notice[] }) {
  return (
    <Section title="Lịch sử đã gửi">
      <DataTable
        rows={notices}
        cols={[
          { h: "Thời gian", c: (notice) => notice.at },
          {
            h: "Tiêu đề",
            c: (notice) => (
              <div>
                <b>{notice.title}</b>
                <p className="text-xs text-muted-foreground">{notice.body}</p>
              </div>
            ),
          },
          { h: "Nhóm nhận", c: (notice) => notice.audience },
        ]}
      />
    </Section>
  );
}
