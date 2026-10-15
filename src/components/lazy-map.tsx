import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, type ComponentProps } from "react";

const MetroMap = lazy(() => import("./metro-map"));

export function LazyMap(props: ComponentProps<typeof MetroMap>) {
  const fallback = (
    <div
      className="flex items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground"
      style={{ height: props.height ?? 520 }}
    >
      Đang tải bản đồ…
    </div>
  );
  return (
    <ClientOnly fallback={fallback}>
      <Suspense fallback={fallback}>
        <MetroMap {...props} />
      </Suspense>
    </ClientOnly>
  );
}
