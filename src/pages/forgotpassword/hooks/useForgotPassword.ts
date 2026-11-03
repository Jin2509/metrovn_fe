import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ApiError, apiErrorMessage } from "@/lib/api";
import { requestPasswordReset } from "@/lib/auth";
import { useRedirectIfAuthenticated } from "@/pages/forgotpassword/hooks/useRedirectIfAuthenticated";
import { validateEmail } from "@/pages/login/login.service";

export function useForgotPassword() {
  useRedirectIfAuthenticated();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  const updateEmail = (value: string) => {
    setEmail(value);
    setEmailError("");
    setFormError("");
  };

  const submit = async () => {
    if (pending) return;
    const nextError = validateEmail(email) ?? "";
    setEmailError(nextError);
    setFormError("");
    if (nextError) return;

    setPending(true);
    try {
      // Vừa gửi mã (429) cũng sang màn nhập mã: mã trong mail mới nhất vẫn dùng được.
      await requestPasswordReset(email);
      await navigate({ to: "/reset-password", search: { email: email.trim().toLowerCase() } });
    } catch (error) {
      // `detail` của lỗi 400 chỉ là nội dung chung, không nói rõ email sai.
      if (error instanceof ApiError && error.status === 400) setEmailError("Email không hợp lệ");
      else setFormError(apiErrorMessage(error, "Không thể gửi mã xác thực, vui lòng thử lại"));
    } finally {
      setPending(false);
    }
  };

  return { email, updateEmail, emailError, formError, pending, submit };
}
