import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function BackToLoginLink() {
  return (
    <Link
      to="/login"
      className="flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline"
    >
      <ArrowLeft className="h-4 w-4" />
      Quay lại đăng nhập
    </Link>
  );
}
