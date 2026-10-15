export type TransactionFilters = {
  q: string;
  status: string;
  method: string;
  gateway: string;
  rec: string;
  from: string;
  to: string;
};

export type TransactionFilterKey = "status" | "method" | "gateway" | "rec";
