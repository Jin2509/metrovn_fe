export type ResetDraft = {
  code: string;
  password: string;
  confirm: string;
};

export type ResetErrors = Partial<Record<keyof ResetDraft, string>>;
