import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { FieldError } from "@/components/form-field";
import { fieldErrorProps, useFocusFirstInvalid } from "@/components/form-field.utils";
import { money } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiErrorMessage, faresApi, ticketPricesApi, type FareConfig } from "@/lib/api";
import { ticketKeys } from "@/lib/catalogs";
import type { TicketTypeRow } from "@/stores/admin";
import { linkToActiveWork } from "@/pages/approvals/work-requests.service";

const pad = (n: number) => String(n).padStart(2, "0");
/** Giá trị cho `<input type="datetime-local">` theo giờ máy. */
const localInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
/** Mặc định: 0 giờ ngày mai. */
const tomorrowMidnight = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return localInput(d);
};

type Errors = { price?: string; from?: string };

/** Admin đề xuất giá mới cho một loại vé; Manager duyệt ở Hộp phê duyệt. */
export function PriceProposalDialog({
  product,
  onClose,
}: {
  product: TicketTypeRow | null;
  onClose: () => void;
}) {
  if (!product) return null;
  return <PriceProposalForm key={product.id} product={product} onClose={onClose} />;
}

function PriceProposalForm({ product, onClose }: { product: TicketTypeRow; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [price, setPrice] = useState(String(product.price));
  const [from, setFrom] = useState(tomorrowMidnight);
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  const { ref, focusFirstInvalid } = useFocusFirstInvalid<HTMLFormElement>();

  const submit = async () => {
    const next: Errors = {};
    const value = Number(price);
    if (!Number.isInteger(value) || value <= 0) next.price = "Giá phải là số nguyên dương";
    else if (value > 100_000_000) next.price = "Giá tối đa 100.000.000 VND";
    else if (value === product.price) next.price = "Giá mới phải khác giá hiện tại";
    const at = new Date(from);
    if (!from || Number.isNaN(at.getTime())) next.from = "Chọn thời điểm áp dụng";
    else if (at.getTime() < Date.now()) next.from = "Thời điểm áp dụng không được ở quá khứ";
    setErrors(next);
    if (Object.keys(next).length) return focusFirstInvalid();
    setPending(true);
    try {
      const created = await ticketPricesApi.submit(Number(product.id), {
        priceVnd: value,
        effectiveFrom: at.toISOString(),
      });
      linkToActiveWork(`TICKET_PRICE:${created.id}`, `Giá vé ${product.name}`);
      toast.success(`Đã gửi Manager duyệt giá mới cho ${product.name}`);
      await queryClient.invalidateQueries({ queryKey: ticketKeys.prices });
      onClose();
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đề xuất giá · {product.name}</DialogTitle>
          <DialogDescription>
            Giá hiện tại {money(product.price)}. Giá mới chỉ áp dụng sau khi Manager duyệt; vé đã
            bán giữ giá cũ.
          </DialogDescription>
        </DialogHeader>
        <form
          ref={ref}
          id="price-form"
          noValidate
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!pending) void submit();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="price-new">Giá mới (VND) *</Label>
            <Input
              id="price-new"
              type="number"
              min={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              {...fieldErrorProps("price-new", errors.price)}
            />
            <FieldError fieldId="price-new">{errors.price}</FieldError>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="price-from">Áp dụng từ *</Label>
            <Input
              id="price-from"
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              {...fieldErrorProps("price-from", errors.from)}
            />
            <FieldError fieldId="price-from">{errors.from}</FieldError>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="price-form" disabled={pending}>
            {pending ? "Đang gửi…" : "Gửi duyệt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Đổi đơn giá/km của một loại vé lượt (lưu thành phiên bản mới của tham số hệ thống). */
export function FarePerKmDialog({
  fare,
  onClose,
}: {
  fare: FareConfig | null;
  onClose: () => void;
}) {
  if (!fare) return null;
  return <FarePerKmForm key={fare.productCode} fare={fare} onClose={onClose} />;
}

function FarePerKmForm({ fare, onClose }: { fare: FareConfig; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(String(fare.farePerKmVnd));
  const [from, setFrom] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  const { ref, focusFirstInvalid } = useFocusFirstInvalid<HTMLFormElement>();

  const submit = async () => {
    const next: Errors = {};
    const perKm = Number(value);
    if (!Number.isInteger(perKm) || perKm <= 0) next.price = "Đơn giá phải là số nguyên dương";
    const at = from ? new Date(from) : undefined;
    if (at && at.getTime() < Date.now()) next.from = "Thời điểm áp dụng không được ở quá khứ";
    setErrors(next);
    if (Object.keys(next).length) return focusFirstInvalid();
    setPending(true);
    try {
      await faresApi.updatePerKm(fare.productCode, perKm, at?.toISOString());
      toast.success(`Đã lưu đơn giá/km cho ${fare.productName}`);
      await queryClient.invalidateQueries({ queryKey: ticketKeys.fares });
      onClose();
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đơn giá/km · {fare.productName}</DialogTitle>
          <DialogDescription>Vé đã bán giữ giá cũ.</DialogDescription>
        </DialogHeader>
        <form
          ref={ref}
          id="fare-form"
          noValidate
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!pending) void submit();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="fare-perkm">Đơn giá/km (VND) *</Label>
            <Input
              id="fare-perkm"
              type="number"
              min={1}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              {...fieldErrorProps("fare-perkm", errors.price)}
            />
            <FieldError fieldId="fare-perkm">{errors.price}</FieldError>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fare-from">Áp dụng từ</Label>
            <Input
              id="fare-from"
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              aria-describedby={errors.from ? "fare-from-error" : "fare-from-hint"}
              aria-invalid={!!errors.from}
            />
            {errors.from ? (
              <FieldError fieldId="fare-from">{errors.from}</FieldError>
            ) : (
              <p id="fare-from-hint" className="text-xs text-muted-foreground">
                Bỏ trống: áp dụng ngay
              </p>
            )}
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="fare-form" disabled={pending}>
            {pending ? "Đang lưu…" : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
