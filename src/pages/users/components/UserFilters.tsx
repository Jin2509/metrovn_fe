import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { USER_STATUS_OPTIONS, userRoleLabel } from "@/pages/users/users.constants";
import type { UserRoleFilter, UserStatusFilter } from "@/pages/users/users.types";

export function UserFilters({
  query,
  role,
  roles,
  status,
  onQueryChange,
  onRoleChange,
  onStatusChange,
}: {
  query: string;
  role: UserRoleFilter;
  /** Vai trò cho bộ lọc; bỏ trống để ẩn bộ lọc vai trò (vd. danh sách hành khách). */
  roles?: readonly string[];
  status: UserStatusFilter;
  onQueryChange: (query: string) => void;
  onRoleChange: (role: UserRoleFilter) => void;
  onStatusChange: (status: UserStatusFilter) => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      <Input
        placeholder="Tìm tên, email…"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        className="max-w-xs"
      />
      {roles && (
        <Select value={role} onValueChange={onRoleChange}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Mọi vai trò</SelectItem>
            {roles.map((value) => (
              <SelectItem key={value} value={value}>
                {userRoleLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Select value={status} onValueChange={(value) => onStatusChange(value as UserStatusFilter)}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {USER_STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
