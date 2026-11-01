/** `status` = 0 khi không kết nối được tới máy chủ (mất mạng, CORS chặn, backend tắt). */
export const NETWORK_ERROR_STATUS = 0;

const DEFAULT_MESSAGES: Record<number, string> = {
  [NETWORK_ERROR_STATUS]: "Không thể kết nối tới máy chủ, vui lòng thử lại",
  401: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
  403: "Bạn không có quyền thực hiện thao tác này",
  404: "Không tìm thấy dữ liệu",
  409: "Dữ liệu bị trùng hoặc đang được xử lý, vui lòng thử lại",
  429: "Bạn thao tác quá nhanh, vui lòng thử lại sau",
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    /** `detail` của problem+json. Một số lỗi 401/403 có body rỗng nên có thể không có. */
    public readonly detail?: string,
    /** `errors` của problem+json: chỉ dùng để biết field nào sai, nội dung có thể là tiếng Anh. */
    public readonly fieldErrors: Record<string, string> = {},
    /** Header `Retry-After` (giây). */
    public readonly retryAfter?: number,
  ) {
    super(detail || DEFAULT_MESSAGES[status] || "Hệ thống gặp lỗi, vui lòng thử lại");
    this.name = "ApiError";
  }
}

/** Thông báo cho người dùng từ một lỗi bất kỳ khi gọi API. */
export function apiErrorMessage(error: unknown, fallback = "Hệ thống gặp lỗi, vui lòng thử lại") {
  return error instanceof ApiError ? error.message : fallback;
}
