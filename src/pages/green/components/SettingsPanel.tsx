import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Leaf, Route, TreePine, Train } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { LoadState, Section, StatCard } from "@/components/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ApiError, apiErrorMessage, greenJourneyApi, type GreenSettings } from "@/lib/api";
import { fmtInstant } from "@/lib/query-sync";
import {
  SETTING_FIELDS,
  greenKeys,
  validateSettings,
  type GreenSettingsDraft,
} from "@/pages/green/green.service";

const num = (value: number, digits = 1) =>
  value.toLocaleString("vi-VN", { maximumFractionDigits: digits });

/** Thống kê công khai: tổng chuyến, quãng đường, CO₂ tiết kiệm. */
function PublicStats() {
  const query = useQuery({
    queryKey: greenKeys.stats,
    queryFn: greenJourneyApi.publicStats,
    retry: false,
  });
  if (!query.data) return <LoadState error={query.error ? apiErrorMessage(query.error) : ""} />;
  const s = query.data;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Chuyến đi xanh" value={num(s.trips, 0)} icon={Train} />
      <StatCard label="Quãng đường" value={`${num(s.distanceKm)} km`} icon={Route} />
      <StatCard
        label="CO₂ tiết kiệm"
        value={`${num(s.co2SavedKg)} kg`}
        icon={Leaf}
        tone="success"
      />
      <StatCard
        label="Tương đương"
        value={`${num(s.treeYearsEquivalent)} cây`}
        hint="Số cây hấp thụ trong một năm"
        icon={TreePine}
        tone="success"
      />
    </div>
  );
}

export function SettingsPanel({ canEdit }: { canEdit: boolean }) {
  const query = useQuery({
    queryKey: greenKeys.settings,
    queryFn: greenJourneyApi.settings,
    retry: false,
  });
  return (
    <div className="space-y-6">
      <PublicStats />
      <LoadState
        loading={query.isPending}
        error={query.error ? apiErrorMessage(query.error) : ""}
        onRetry={() => void query.refetch()}
      />
      {query.data && (
        <SettingsForm key={query.data.version} settings={query.data} canEdit={canEdit} />
      )}
    </div>
  );
}

function SettingsForm({ settings, canEdit }: { settings: GreenSettings; canEdit: boolean }) {
  const queryClient = useQueryClient();
  const initial = (): GreenSettingsDraft => {
    const { version: _v, updatedAt: _u, ...rest } = settings;
    return rest;
  };
  const [draft, setDraft] = useState<GreenSettingsDraft>(initial);
  const [pending, setPending] = useState(false);
  const errors = validateSettings(draft);
  const dirty = (Object.keys(draft) as (keyof GreenSettingsDraft)[]).some(
    (key) => draft[key] !== settings[key],
  );
  const saved = Math.max(0, draft.baselineGramsPerKm - draft.metroGramsPerKm);

  const save = async () => {
    if (errors.length || pending) return;
    setPending(true);
    try {
      await greenJourneyApi.updateSettings({ version: settings.version, ...draft });
      toast.success("Đã lưu. Các chuyến đi sau sẽ tính theo cài đặt mới.");
      await queryClient.invalidateQueries({ queryKey: greenKeys.settings });
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        toast.error("Cài đặt vừa được người khác sửa, đã tải lại bản mới nhất.");
        await queryClient.invalidateQueries({ queryKey: greenKeys.settings });
      } else toast.error(apiErrorMessage(e));
    } finally {
      setPending(false);
    }
  };

  return (
    <Section
      title="Cách tính CO₂ và điểm xanh"
      description={`Mỗi km đi Metro tiết kiệm ${num(saved)} g CO₂ so với xe cá nhân và được ${num(draft.pointsPerKm, 2)} điểm xanh.`}
      action={
        settings.updatedAt && (
          <span className="text-xs text-muted-foreground">
            Sửa lần cuối {fmtInstant(settings.updatedAt)}
          </span>
        )
      }
    >
      <div className="space-y-4">
        <label className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
          <span>
            <span className="block font-medium">Bật Hành trình xanh</span>
            <span className="block text-xs text-muted-foreground">
              Tắt thì app ngừng tính CO₂ và điểm xanh cho chuyến đi mới.
            </span>
          </span>
          <Switch
            checked={draft.enabled}
            disabled={!canEdit}
            onCheckedChange={(enabled) => setDraft({ ...draft, enabled })}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {SETTING_FIELDS.map(([key, label, hint]) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`green-${key}`}>{label}</Label>
              <Input
                id={`green-${key}`}
                type="number"
                min={0}
                step="any"
                disabled={!canEdit}
                value={Number.isNaN(draft[key] as number) ? "" : String(draft[key])}
                aria-describedby={`green-${key}-hint`}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    [key]: e.target.value === "" ? Number.NaN : Number(e.target.value),
                  })
                }
              />
              <p id={`green-${key}-hint`} className="text-xs text-muted-foreground">
                {hint}
              </p>
            </div>
          ))}
        </div>
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" aria-hidden />
            <AlertDescription>
              <ul className="list-disc pl-4">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        {canEdit && (
          <div className="flex gap-2">
            <Button disabled={!dirty || pending || errors.length > 0} onClick={() => void save()}>
              {pending ? "Đang lưu…" : "Lưu cài đặt"}
            </Button>
            <Button
              variant="outline"
              disabled={!dirty || pending}
              onClick={() => setDraft(initial())}
            >
              Hoàn tác
            </Button>
          </div>
        )}
      </div>
    </Section>
  );
}
