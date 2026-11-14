import { useCallback, useRef } from "react";

/**
 * Lỗi của một ô nhập. Form trong app tự kiểm tra bằng JS và chỉ hiện lỗi sau khi người dùng bấm lưu
 * hoặc đã sửa ô đó, nên chỉ gắn lỗi vào ô (aria-invalid, aria-describedby) khi lỗi đang hiện:
 * trình đọc màn hình đọc cả nội dung bị ẩn mà aria-describedby trỏ tới.
 */
export const errorId = (fieldId: string) => `${fieldId}-error`;

export function fieldErrorProps(fieldId: string, error?: string | null) {
  return {
    "aria-invalid": error ? true : false,
    "aria-describedby": error ? errorId(fieldId) : undefined,
  } as const;
}

/**
 * Sau khi bấm lưu mà còn lỗi: chuyển focus tới ô sai đầu tiên để trình đọc màn hình đọc luôn lỗi của ô đó.
 * Gắn `ref` vào phần tử bao các ô nhập, gọi `focusFirstInvalid()` ngay sau khi đặt lỗi.
 */
export function useFocusFirstInvalid<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);
  const focusFirstInvalid = useCallback(() => {
    // Chờ React vẽ xong lỗi mới (aria-invalid) rồi mới tìm.
    requestAnimationFrame(() => {
      ref.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    });
  }, []);
  return { ref, focusFirstInvalid };
}
