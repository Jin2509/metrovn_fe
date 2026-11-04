import { AlertTriangle, Clock, Send, Undo2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Section } from "@/components/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { approvalsStore } from "@/mocks/admin";
import { PARAM_GROUP_LABEL, systemParamsStore, type ParamGroup } from "@/mocks/system-params";
import {
  diffParams,
  latestParamApproval,
  submitParams,
  toValues,
  validateParams,
  type ParamValues,
} from "@/pages/systemparams/systemparams.service";

/** Tham số nghiệp vụ dùng chung. Admin đề xuất, Manager duyệt rồi mới có hiệu lực. */
export function SystemParamsPage() {
  const { can } = useAuth();
  const params = systemParamsStore.use();
  const latest = latestParamApproval(approvalsStore.use());
  const [draft, setDraft] = useState<ParamValues>(() => toValues(params));

  const pending = latest?.status === "PENDING" ? latest : null;
  const editable = can("params.edit") && !pending;
  // Đang chờ duyệt thì hiện đúng giá trị đã gửi.
  const values = pending ? (pending.payload as ParamValues) : draft;
  const changes = pending ? pending.changes : diffParams(params, draft);
  const errors = pending ? [] : validateParams(params, draft);
  const groups = Object.keys(PARAM_GROUP_LABEL) as ParamGroup[];

  return (
    <AppShell
      title="Tham số hệ thống"
      actions={
        editable &&
        changes.length > 0 && (
          <>
            <Button variant="outline" onClick={() => setDraft(toValues(params))}>
              <Undo2 className="h-4 w-4" />
              Hoàn tác
            </Button>
            <Button
              disabled={errors.length > 0}
              onClick={() => {
                const error = submitParams(draft);
                if (error) return toast.error(error);
                toast.success("Đã gửi Manager duyệt. Tham số chỉ đổi sau khi được phê duyệt.");
              }}
            >
              <Send className="h-4 w-4" />
              Gửi duyệt ({changes.length})
            </Button>
          </>
        )
      }
    >
      {pending && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            {changes.length} tham số đang chờ Manager duyệt, hệ thống vẫn dùng giá trị cũ.
          </AlertDescription>
        </Alert>
      )}
      {!pending && latest?.status === "REJECTED" && changes.length === 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Yêu cầu gần nhất bị {latest.decidedBy} từ chối: {latest.reason}
          </AlertDescription>
        </Alert>
      )}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc pl-4">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-2">
        {groups.map((group) => (
          <Section key={group} title={PARAM_GROUP_LABEL[group]}>
            <ul className="divide-y">
              {params
                .filter((param) => param.group === group)
                .map((param) => (
                  <li
                    key={param.key}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1 basis-56">
                      <label
                        htmlFor={param.key}
                        className="flex flex-wrap items-center gap-2 text-sm font-medium"
                      >
                        {param.label}
                        {param.appliesAt === "SERVER" && (
                          <Badge variant="outline" className="font-normal">
                            Cần backend
                          </Badge>
                        )}
                      </label>
                      <p className="text-xs text-muted-foreground">{param.description}</p>
                      {param.updatedBy && (
                        <p className="text-xs text-muted-foreground">
                          Đổi bởi {param.updatedBy}, {param.updatedAt}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        id={param.key}
                        type="number"
                        className="h-9 w-24 text-right"
                        min={param.min}
                        max={param.max}
                        value={Number.isNaN(values[param.key]) ? "" : values[param.key]}
                        disabled={!editable}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            [param.key]:
                              event.target.value === "" ? Number.NaN : Number(event.target.value),
                          })
                        }
                      />
                      <span className="w-12 text-sm text-muted-foreground">{param.unit}</span>
                    </div>
                  </li>
                ))}
            </ul>
          </Section>
        ))}
      </div>
    </AppShell>
  );
}
