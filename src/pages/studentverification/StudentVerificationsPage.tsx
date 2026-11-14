import { Bot, ClipboardList, Hand, History, Settings2, UserRoundCheck } from "lucide-react";
import { useState } from "react";
import { AppShell, PageTabs } from "@/components/app-shell";
import {
  DataTable,
  LoadState,
  ReasonDialog,
  Section,
  StatCard,
  StatusBadge,
} from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import type { StudentVerification } from "@/stores/student-verifications";
import { formatDate, formatDateTime } from "@/pages/studentverification/components/format";
import { ReviewSheet } from "@/pages/studentverification/components/ReviewSheet";
import { RulesPanel } from "@/pages/studentverification/components/RulesPanel";
import { useStudentReview } from "@/pages/studentverification/hooks";
import {
  REVIEW_SLA_HOURS,
  isOverdue,
  studentStats,
  studentVerificationsStore,
} from "@/pages/studentverification/student.service";

const FLOW = [
  ["Hành khách gửi thẻ", "Chụp thẻ trên app và đồng ý cho AI đọc."],
  ["AI đọc thẻ", "Backend lấy họ tên, trường, mã sinh viên, hạn thẻ và độ tin cậy."],
  ["Đối chiếu quy tắc", "Kiểm tra hạn thẻ, danh sách trường, tên tài khoản, mã trùng."],
  ["Có kết quả", "Rõ ràng thì tự duyệt hoặc tự từ chối. Nghi ngờ thì chuyển người xem."],
];

function HowItWorks() {
  return (
    <Section
      title="Hệ thống tự xử lý, Manager chỉ xem ngoại lệ"
      description="Ảnh thẻ chỉ giữ trong thời gian lưu trữ của chính sách. Thời hạn ưu đãi không vượt hạn thẻ."
    >
      <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {FLOW.map(([title, detail], index) => (
          <li key={title} className="flex gap-3 text-sm">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
              {index + 1}
            </span>
            <span>
              <span className="block font-medium">{title}</span>
              <span className="text-muted-foreground">{detail}</span>
            </span>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function SubmissionTable({
  rows,
  empty,
  onSelect,
}: {
  rows: StudentVerification[];
  empty: string;
  onSelect: (item: StudentVerification) => void;
}) {
  return (
    <DataTable
      rows={rows}
      empty={empty}
      rowKey={(item) => item.id}
      rowActionLabel={(item) => `Xem hồ sơ của ${item.accountName}`}
      onRow={onSelect}
      cols={[
        {
          h: "Tài khoản",
          c: (item) => (
            <>
              <p className="font-medium">{item.accountName}</p>
              <p className="text-xs text-muted-foreground">{item.accountEmail}</p>
            </>
          ),
        },
        { h: "Trường", c: (item) => item.ai.school ?? item.declared.school },
        {
          h: "Gửi lúc",
          c: (item) => (
            <span className="flex flex-wrap items-center gap-2 whitespace-nowrap">
              {formatDateTime(item.submittedAt)}
              {isOverdue(item) && <Badge variant="destructive">Quá {REVIEW_SLA_HOURS} giờ</Badge>}
            </span>
          ),
        },
        { h: "Trạng thái", c: (item) => <StatusBadge s={item.status} /> },
        {
          h: "Quyết định",
          c: (item) =>
            item.decisionSource === "MANUAL" ? "Người xem" : item.decisionSource ? "Tự động" : "—",
        },
        { h: "Hiệu lực đến", c: (item) => formatDate(item.approvedUntil) ?? "—" },
      ]}
    />
  );
}

export function StudentVerificationsPage() {
  const r = useStudentReview();
  const items = studentVerificationsStore.use();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const revoking = selected?.status === "APPROVED";
  const stats = studentStats(items);
  const queue = items
    .filter((item) => item.status === "NEEDS_REVIEW")
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  const select = (item: StudentVerification) => setSelectedId(item.id);

  return (
    <AppShell title="Xác nhận sinh viên">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Hệ thống tự xử lý"
          value={`${Math.round(stats.autoRate * 100)}%`}
          hint={`${stats.auto}/${stats.total} hồ sơ không cần người xem`}
          icon={Bot}
          tone="success"
        />
        <StatCard
          label="Cần xem xét"
          value={stats.needsReview}
          hint={`Xử lý trong ${REVIEW_SLA_HOURS} giờ, như app đã báo`}
          icon={Hand}
          tone={stats.needsReview ? "accent" : "muted"}
        />
        <StatCard
          label="Đã xác nhận"
          value={stats.verified}
          hint="Đang hưởng giá sinh viên"
          icon={UserRoundCheck}
        />
      </div>
      <LoadState loading={r.loading} error={r.loadError} onRetry={r.reload} />
      <HowItWorks />
      <PageTabs
        tabs={[
          {
            value: "queue",
            label: `Cần xem xét (${queue.length})`,
            icon: ClipboardList,
            content: (
              <Section
                title="Hồ sơ máy không tự quyết được"
                description="Hồ sơ gửi sớm nhất xếp trên cùng."
              >
                <SubmissionTable
                  rows={queue}
                  empty="Không có hồ sơ cần xem xét."
                  onSelect={select}
                />
              </Section>
            ),
          },
          {
            value: "all",
            label: "Tất cả hồ sơ",
            icon: History,
            content: (
              <Section title="Tất cả hồ sơ">
                <SubmissionTable rows={items} empty="Chưa có hồ sơ." onSelect={select} />
              </Section>
            ),
          },
          {
            value: "rules",
            label: "Quy tắc tự động",
            icon: Settings2,
            content: <RulesPanel canEdit={r.canConfigure} />,
          },
        ]}
      />
      <ReviewSheet
        item={selected}
        canVerify={r.canVerify}
        pending={r.pending}
        onClose={() => setSelectedId(null)}
        onApprove={(until) => {
          if (selected) void r.approve(selected, until).then((ok) => ok && setSelectedId(null));
        }}
        onReject={() => setRejecting(true)}
        onRevoke={() => setRejecting(true)}
        onRetryAi={() => selected && void r.retryAi(selected)}
      />
      <ReasonDialog
        open={rejecting}
        title={revoking ? "Thu hồi xác nhận sinh viên" : "Từ chối hồ sơ"}
        confirmLabel={revoking ? "Thu hồi" : "Từ chối"}
        onClose={() => setRejecting(false)}
        onConfirm={(reason) => {
          if (!selected) return;
          void (revoking ? r.revoke : r.reject)(selected, reason).then((ok) => {
            if (!ok) return;
            setRejecting(false);
            setSelectedId(null);
          });
        }}
      />
    </AppShell>
  );
}
