import { Loader2, MapPin } from "lucide-react";
import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { searchPlaces, type Place } from "@/lib/geocode";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 350;
const MIN_CHARS = 2;

type Props = Omit<ComponentProps<typeof Input>, "value" | "onChange" | "onSelect"> & {
  value: string;
  onChange: (text: string) => void;
  /** Người dùng chọn một gợi ý: form tự điền địa chỉ, phường/xã và toạ độ. */
  onSelect: (place: Place) => void;
  /** Toạ độ để ưu tiên gợi ý ở gần (ví dụ vị trí đang chọn trên bản đồ). */
  near?: { lat: number; lng: number } | null;
};

/**
 * Ô nhập địa chỉ có gợi ý địa điểm (combobox): gõ ≥ 2 ký tự, chờ 350 ms rồi hỏi Photon/OpenStreetMap.
 * Vẫn nhập tay bình thường khi không có mạng hoặc không có gợi ý phù hợp.
 */
export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  near,
  className,
  ...rest
}: Props) {
  const listId = useId();
  const [query, setQuery] = useState<string | null>(null); // chỉ tìm khi người dùng gõ
  const [items, setItems] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState(-1);
  const abortRef = useRef<AbortController | null>(null);
  const nearRef = useRef(near);
  nearRef.current = near;

  useEffect(() => {
    if (query === null) return;
    abortRef.current?.abort();
    if (query.trim().length < MIN_CHARS) {
      setItems([]);
      setLoading(false);
      setError("");
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const places = await searchPlaces(query, {
          near: nearRef.current ?? undefined,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setItems(places);
        setError("");
        setActive(places.length ? 0 : -1);
        setOpen(true);
      } catch (e) {
        if (controller.signal.aborted) return;
        setItems([]);
        setError(e instanceof Error ? e.message : "Không lấy được gợi ý địa điểm");
        setOpen(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Đóng gợi ý và huỷ request khi component bị gỡ.
  useEffect(() => () => abortRef.current?.abort(), []);

  const choose = (place: Place) => {
    abortRef.current?.abort();
    setQuery(null);
    setOpen(false);
    setItems([]);
    setLoading(false);
    onSelect(place);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!items.length) return;
      e.preventDefault();
      setOpen(true);
      setActive((i) => {
        const n = items.length;
        return e.key === "ArrowDown" ? (i + 1) % n : (i - 1 + n) % n;
      });
    } else if (e.key === "Enter") {
      if (open && active >= 0 && items[active]) {
        e.preventDefault();
        choose(items[active]);
      }
    } else if (e.key === "Escape") {
      if (open) {
        // Chỉ đóng gợi ý, không đóng hộp thoại đang chứa ô nhập.
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      }
    }
  };

  const showList = open && (items.length > 0 || !!error || (loading && query !== null));
  const activeId = active >= 0 && items[active] ? `${listId}-${active}` : undefined;

  return (
    <div className="relative">
      <Input
        {...rest}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={activeId}
        autoComplete="off"
        className={cn(loading && "pr-8", className)}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => items.length && setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {loading && (
        <Loader2
          aria-hidden
          className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
        />
      )}
      <span className="sr-only" aria-live="polite">
        {loading ? "Đang tìm địa điểm" : items.length ? `${items.length} gợi ý` : ""}
      </span>
      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Gợi ý địa điểm"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto rounded-md border bg-popover p-1 text-sm text-popover-foreground shadow-md"
        >
          {error && <li className="px-2 py-1.5 text-destructive">{error}</li>}
          {!error && loading && !items.length && (
            <li className="px-2 py-1.5 text-muted-foreground">Đang tìm…</li>
          )}
          {items.map((place, i) => {
            const rest = place.address.startsWith(place.name)
              ? place.address.slice(place.name.length).replace(/^,\s*/, "")
              : place.address;
            return (
              <li
                key={place.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                className={cn(
                  "flex cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5",
                  i === active && "bg-accent text-accent-foreground",
                )}
                onMouseEnter={() => setActive(i)}
                // Giữ focus ở ô nhập để onBlur không đóng danh sách trước khi click kịp chọn.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(place)}
              >
                <MapPin aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{place.name}</span>
                  {rest && (
                    <span className="block truncate text-xs text-muted-foreground">{rest}</span>
                  )}
                </span>
              </li>
            );
          })}
          {!error && !loading && items.length > 0 && (
            <li className="px-2 pt-1 text-[11px] text-muted-foreground">
              Gợi ý từ OpenStreetMap · chọn để điền địa chỉ và toạ độ
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
