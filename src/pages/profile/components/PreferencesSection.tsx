import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { Section } from "@/components/shared";
import { setTheme, themeStore, type ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";

const THEMES: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Sáng", icon: Sun },
  { value: "dark", label: "Tối", icon: Moon },
  { value: "system", label: "Theo hệ thống", icon: Monitor },
];

export function AppearanceSection() {
  const theme = themeStore.use();
  return (
    <Section title="Giao diện" description="Áp dụng cho trình duyệt đang dùng">
      <div role="radiogroup" aria-label="Chế độ màu" className="grid grid-cols-3 gap-2">
        {THEMES.map((t) => (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={theme === t.value}
            onClick={() => setTheme(t.value)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-lg border p-3 text-sm transition-colors hover:border-primary/40",
              theme === t.value && "border-primary bg-primary/5 font-medium text-primary",
            )}
          >
            <t.icon className="h-5 w-5" />
            {t.label}
          </button>
        ))}
      </div>
    </Section>
  );
}
