import type { ReactNode } from "react";
import { DataTable, Section, StatusBadge } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS, type Role } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { Approval } from "@/mocks/admin";
import type { WorkRequest } from "@/mocks/requests";
import {
  WORK_CATEGORY_LABELS,
  WORK_FILTER_OPTIONS,
  WORK_PRIORITY,
  WORK_STATUS_LABELS,
  WORK_STATUS_TONE,
} from "@/pages/approvals/work-requests.constants";
import { isOverdue, waitingOn } from "@/pages/approvals/work-requests.service";
import type { WorkFilter } from "@/pages/approvals/hooks/useWorkRequests";

export function WorkPriorityBadge({ priority }: { priority: WorkRequest["priority"] }) {
  const { label, className } = WORK_PRIORITY[priority];
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap border-transparent", className)}>
      {label}
    </Badge>
  );
}

export function WorkStatusBadge({ status }: { status: WorkRequest["status"] }) {
  return <StatusBadge s={WORK_STATUS_TONE[status]} label={WORK_STATUS_LABELS[status]} />;
}

export function WorkRequestListSection({
  title,
  description,
  rows,
  approvals,
  filter,
  onFilterChange,
  onSelect,
  action,
}: {
  title: string;
  description: string;
  rows: WorkRequest[];
  approvals: Approval[];
  filter: WorkFilter;
  onFilterChange: (filter: WorkFilter) => void;
  onSelect: (request: WorkRequest) => void;
  action?: ReactNode;
}) {
  return (
    <Section
      title={title}
      description={description}
      action={
        <>
          <Select value={filter} onValueChange={(next) => onFilterChange(next as WorkFilter)}>
            <SelectTrigger className="w-44" aria-label="Lọc yêu cầu">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WORK_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {action}
        </>
      }
    >
      <DataTable
        rows={rows}
        onRow={onSelect}
        empty="Không có yêu cầu nào"
        cols={[
          {
            h: "Nội dung",
            c: (request) => (
              <div className="min-w-48">
                <b>{request.title}</b>
                <p className="text-xs text-muted-foreground">
                  {request.id} · {WORK_CATEGORY_LABELS[request.category]}
                  {request.attachments.length > 0 && ` · ${request.attachments.length} tệp`}
                </p>
              </div>
            ),
          },
          { h: "Ưu tiên", c: (request) => <WorkPriorityBadge priority={request.priority} /> },
          {
            h: "Hạn",
            c: (request) =>
              request.dueDate ? (
                <span className={cn(isOverdue(request) && "font-medium text-destructive")}>
                  {request.dueDate}
                  {isOverdue(request) && " · quá hạn"}
                </span>
              ) : (
                "—"
              ),
          },
          { h: "Người gửi", c: (request) => request.by },
          { h: "Người xử lý", c: (request) => request.handledBy ?? "—" },
          {
            h: "Đang chờ",
            c: (request) => {
              const role: Role | null = waitingOn(request, approvals);
              return role ? ROLE_LABELS[role] : "—";
            },
          },
          { h: "Trạng thái", c: (request) => <WorkStatusBadge status={request.status} /> },
        ]}
      />
    </Section>
  );
}
