import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api";
import { requestPasswordReset, resetPassword } from "@/lib/auth";
import { useForgotPassword } from "@/pages/forgotpassword/hooks/useForgotPassword";
import { useResetPassword } from "@/pages/forgotpassword/hooks/useResetPassword";

const navigate = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
  useRouter: () => ({ history: { replace: vi.fn() } }),
}));

vi.mock("@/lib/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth")>()),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
}));

const email = "an@metro.vn";
const validDraft = { code: "012345", password: "MatKhau123", confirm: "MatKhau123" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requestPasswordReset).mockResolvedValue({});
  vi.mocked(resetPassword).mockResolvedValue(undefined);
});

describe("useForgotPassword", () => {
  it("400: báo lỗi ở ô email, không hiện nội dung chung của backend", async () => {
    vi.mocked(requestPasswordReset).mockRejectedValue(new ApiError(400, "Dữ liệu không hợp lệ"));
    const { result } = renderHook(() => useForgotPassword());

    act(() => result.current.updateEmail(email));
    await act(() => result.current.submit());

    expect(result.current.emailError).toBe("Email không hợp lệ");
    expect(result.current.formError).toBe("");
    expect(navigate).not.toHaveBeenCalled();
  });

  it("sửa email thì lỗi cũ biến mất", async () => {
    const { result } = renderHook(() => useForgotPassword());

    await act(() => result.current.submit());
    expect(result.current.emailError).toBe("Vui lòng nhập email");

    act(() => result.current.updateEmail("a"));
    expect(result.current.emailError).toBe("");
  });
});

describe("useResetPassword", () => {
  it("sửa ô nào thì chỉ lỗi của ô đó biến mất", async () => {
    const { result } = renderHook(() => useResetPassword(email));

    await act(() => result.current.submit());
    expect(result.current.errors.code).toBeTruthy();
    expect(result.current.errors.password).toBeTruthy();

    act(() => result.current.updateDraft({ code: "0" }));
    expect(result.current.errors.code).toBeUndefined();
    expect(result.current.errors.password).toBeTruthy();
  });

  it("đang đặt lại mật khẩu thì không gửi lại mã", async () => {
    vi.useFakeTimers();
    try {
      let finish = () => {};
      vi.mocked(resetPassword).mockReturnValue(
        new Promise((resolve) => {
          finish = () => resolve(undefined);
        }),
      );
      const { result } = renderHook(() => useResetPassword(email));
      for (let second = 0; second < 60; second++) act(() => vi.advanceTimersByTime(1000));
      expect(result.current.cooldown).toBe(0);
      act(() => result.current.updateDraft(validDraft));

      let submitting = Promise.resolve();
      act(() => {
        submitting = result.current.submit();
      });
      await act(() => result.current.resend());
      expect(requestPasswordReset).not.toHaveBeenCalled();

      await act(async () => {
        finish();
        await submitting;
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("đang gửi lại mã thì không gửi mã cũ đi đặt lại mật khẩu", async () => {
    vi.useFakeTimers();
    try {
      let finish = () => {};
      vi.mocked(requestPasswordReset).mockReturnValue(
        new Promise((resolve) => {
          finish = () => resolve({});
        }),
      );
      const { result } = renderHook(() => useResetPassword(email));
      for (let second = 0; second < 60; second++) act(() => vi.advanceTimersByTime(1000));
      act(() => result.current.updateDraft(validDraft));

      let resending = Promise.resolve();
      act(() => {
        resending = result.current.resend();
      });
      await act(() => result.current.submit());
      expect(resetPassword).not.toHaveBeenCalled();

      await act(async () => {
        finish();
        await resending;
      });
      expect(result.current.draft.code).toBe("");
    } finally {
      vi.useRealTimers();
    }
  });
});
