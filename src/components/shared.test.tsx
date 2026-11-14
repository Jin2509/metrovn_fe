import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DataTable, ReasonDialog, Section } from "@/components/shared";

type Row = { id: string; name: string };
const rows: Row[] = [
  { id: "a", name: "Bến Thành" },
  { id: "b", name: "Ba Son" },
];
const cols = [
  { h: "Mã", c: (r: Row) => r.id },
  { h: "Tên", c: (r: Row) => r.name },
  { h: "Thao tác khác", c: () => <button type="button">Sửa</button> },
];

describe("Section", () => {
  it("dùng heading thật, lồng nhau thì xuống một cấp", () => {
    render(
      <Section title="Ngoài">
        <Section title="Trong">nội dung</Section>
      </Section>,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Ngoài" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Trong" })).toBeInTheDocument();
  });
});

describe("DataTable", () => {
  it("bảng lấy tên từ tiêu đề Section, tiêu đề cột có scope", () => {
    render(
      <Section title="Danh sách ga">
        <DataTable rows={rows} cols={cols} />
      </Section>,
    );
    expect(screen.getByRole("table", { name: "Danh sách ga" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Tên" })).toHaveAttribute("scope", "col");
    // Ở dạng thẻ (khung hẹp), nhãn cột lấy từ data-label.
    expect(screen.getByText("Ba Son").closest("td")).toHaveAttribute("data-label", "Tên");
  });

  it("dòng mở được bằng nút có tên riêng, bấm nút khác trong dòng thì không mở", () => {
    const onRow = vi.fn();
    render(
      <DataTable
        rows={rows}
        cols={cols}
        rowKey={(r) => r.id}
        rowActionLabel={(r) => (r.id === "b" ? null : `Xem chi tiết ga ${r.name}`)}
        onRow={onRow}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Xem chi tiết ga Bến Thành" }));
    expect(onRow).toHaveBeenCalledWith(rows[0]);

    onRow.mockClear();
    fireEvent.click(screen.getAllByRole("button", { name: "Sửa" })[0]);
    expect(onRow).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("Bến Thành"));
    expect(onRow).toHaveBeenCalledTimes(1);

    // Dòng không mở được: không có nút, bấm cả dòng cũng không mở.
    onRow.mockClear();
    expect(screen.queryByRole("button", { name: /Ba Son/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Ba Son"));
    expect(onRow).not.toHaveBeenCalled();
  });

  it("phân trang nằm trong nav và báo trang hiện tại", () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ id: String(i), name: `Ga ${i}` }));
    render(<DataTable rows={many} cols={cols} pageSize={5} label="Ga" />);
    const nav = screen.getByRole("navigation", { name: "Phân trang Ga" });
    expect(nav).toHaveTextContent("Trang 1/3");
    fireEvent.click(screen.getByRole("button", { name: "Sau" }));
    expect(nav).toHaveTextContent("Trang 2/3");
  });
});

describe("ReasonDialog", () => {
  it("ô lý do có nhãn; bỏ trống thì báo lỗi gắn với ô và focus vào ô", () => {
    const onConfirm = vi.fn();
    render(<ReasonDialog open title="Từ chối" onClose={() => {}} onConfirm={onConfirm} />);
    const field = screen.getByLabelText(/Lý do/);
    expect(field).toHaveAttribute("aria-invalid", "false");

    fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAccessibleDescription("Lỗi: Vui lòng nhập lý do");
    expect(field).toHaveFocus();

    fireEvent.change(field, { target: { value: "Thiếu hồ sơ" } });
    expect(field).toHaveAttribute("aria-invalid", "false");
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
    expect(onConfirm).toHaveBeenCalledWith("Thiếu hồ sơ");
  });
});
