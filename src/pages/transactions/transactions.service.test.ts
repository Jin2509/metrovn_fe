import { afterEach, describe, expect, it } from "vitest";
import { txnStore, type Txn } from "@/mocks/admin";
import { isReconcilable, reconcileTransactions } from "@/pages/transactions/transactions.service";

const seed = [...txnStore.get()];
afterEach(() => txnStore.set(() => seed));

const txn = (patch: Partial<Txn>): Txn => ({
  id: "GD1",
  at: "2026-10-05 08:00",
  orderId: "DH1",
  amount: 12000,
  refund: 0,
  method: "QR",
  gateway: "MoMo",
  status: "SUCCESS",
  service: "Vé",
  reconciled: false,
  ...patch,
});

describe("isReconcilable", () => {
  it("giao dịch thành công chưa đối soát thì đối soát được", () => {
    expect(isReconcilable(txn({}), [])).toBe(true);
  });

  it("không đối soát giao dịch chưa thành công hoặc đã đối soát", () => {
    for (const status of ["PENDING", "FAILED", "REFUNDED"] as const)
      expect(isReconcilable(txn({ status }), []), status).toBe(false);
    expect(isReconcilable(txn({ reconciled: true }), [])).toBe(false);
  });

  it("không đối soát giao dịch thuộc kỳ đã chốt", () => {
    expect(isReconcilable(txn({}), ["10/2026"])).toBe(false);
    expect(isReconcilable(txn({}), ["09/2026"])).toBe(true);
  });
});

describe("reconcileTransactions", () => {
  it("chỉ đánh dấu đúng các giao dịch được chọn và ghi người thực hiện", () => {
    const [first, second] = txnStore.get();
    reconcileTransactions([first.id]);
    const after = txnStore.get();
    expect(after.find((t) => t.id === first.id)).toMatchObject({ reconciled: true });
    expect(after.find((t) => t.id === first.id)?.reconciledBy).toBeTruthy();
    expect(after.find((t) => t.id === second.id)?.reconciled).toBe(second.reconciled);
  });
});
