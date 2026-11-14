import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { DataTable, LoadState, Section } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  apiErrorMessage,
  membershipTiersApi,
  systemParamsApi,
  type MembershipTier,
} from "@/lib/api";
import { greenKeys, validateTiers } from "@/pages/green/green.service";
import {
  SYSTEM_PARAMS_KEY,
  paramLabel,
  paramUnit,
} from "@/pages/systemparams/systemparams.service";

/** Hạng thành viên CPoint (bảng `membership_tier`) và các tham số tích điểm. */
export function TierPanel({ canEdit }: { canEdit: boolean }) {
  const queryClient = useQueryClient();
  const tiers = useQuery({
    queryKey: greenKeys.tiers,
    queryFn: membershipTiersApi.list,
    retry: false,
  });
  const params = useQuery({
    queryKey: SYSTEM_PARAMS_KEY,
    queryFn: systemParamsApi.list,
    enabled: canEdit,
    retry: false,
  });
  const [editing, setEditing] = useState<Record<string, MembershipTier>>({});
  const [pending, setPending] = useState("");
  const list = [...(tiers.data ?? [])].sort((a, b) => a.minPoints - b.minPoints);
  const cpoint = (params.data ?? []).filter((p) => p.key.startsWith("CPOINT_"));

  const save = async (code: string) => {
    const draft = editing[code];
    const next = list.map((t) => (t.code === code ? draft : t));
    const errors = validateTiers(next);
    if (errors.length) return void toast.error(errors[0]);
    setPending(code);
    try {
      await membershipTiersApi.update(code, {
        name: draft.name.trim(),
        minPoints: draft.minPoints,
      });
      toast.success(`Đã lưu hạng ${draft.name}`);
      setEditing(({ [code]: _done, ...rest }) => rest);
      await queryClient.invalidateQueries({ queryKey: greenKeys.tiers });
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setPending("");
    }
  };

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_360px]">
      <Section
        title="Hạng thành viên"
        description="CPoint là điểm tích lũy từ các lần check-in, không bị trừ khi lên hạng."
      >
        <LoadState
          loading={tiers.isPending}
          error={tiers.error ? apiErrorMessage(tiers.error) : ""}
          onRetry={() => void tiers.refetch()}
        />
        {tiers.data && (
          <DataTable
            rows={list}
            rowKey={(t) => t.code}
            cols={[
              { h: "Mã", c: (t) => <span className="font-mono text-xs">{t.code}</span> },
              {
                h: "Tên hạng",
                c: (t) =>
                  editing[t.code] ? (
                    <>
                      <Label htmlFor={`tier-name-${t.code}`} className="sr-only">
                        Tên hạng {t.code}
                      </Label>
                      <Input
                        id={`tier-name-${t.code}`}
                        className="h-8 w-40"
                        value={editing[t.code].name}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            [t.code]: { ...editing[t.code], name: e.target.value },
                          })
                        }
                      />
                    </>
                  ) : (
                    <b>{t.name}</b>
                  ),
              },
              {
                h: "Từ CPoint",
                className: "text-right",
                c: (t) =>
                  editing[t.code] ? (
                    <>
                      <Label htmlFor={`tier-min-${t.code}`} className="sr-only">
                        Mốc CPoint của hạng {t.code}
                      </Label>
                      <Input
                        id={`tier-min-${t.code}`}
                        type="number"
                        min={0}
                        className="ml-auto h-8 w-28 text-right"
                        value={editing[t.code].minPoints}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            [t.code]: { ...editing[t.code], minPoints: Number(e.target.value) },
                          })
                        }
                      />
                    </>
                  ) : (
                    t.minPoints.toLocaleString("vi-VN")
                  ),
              },
              ...(canEdit
                ? [
                    {
                      h: "Thao tác",
                      className: "text-right",
                      c: (t: MembershipTier) =>
                        editing[t.code] ? (
                          <span className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditing(({ [t.code]: _x, ...rest }) => rest)}
                            >
                              Hủy
                            </Button>
                            <Button
                              size="sm"
                              disabled={!!pending}
                              onClick={() => void save(t.code)}
                            >
                              Lưu
                            </Button>
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditing({ ...editing, [t.code]: { ...t } })}
                          >
                            Sửa
                          </Button>
                        ),
                    },
                  ]
                : []),
            ]}
          />
        )}
      </Section>
      {canEdit && (
        <Section
          title="Tích điểm CPoint"
          action={
            <Link to="/system-params" className="text-sm text-primary hover:underline">
              Sửa ở Tham số hệ thống
            </Link>
          }
        >
          <LoadState error={params.error ? apiErrorMessage(params.error) : ""} />
          <dl className="divide-y text-sm">
            {cpoint.map((p) => (
              <div key={p.key} className="flex justify-between gap-4 py-2 first:pt-0 last:pb-0">
                <dt className="text-muted-foreground">{paramLabel(p)}</dt>
                <dd className="font-medium">
                  {Number(p.value).toLocaleString("vi-VN")} {paramUnit(p)}
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      )}
    </div>
  );
}
