import ExcelJS from "exceljs";
import type { ReportExport } from "@/pages/reports/reports.types";

// Thư viện Excel khá nặng nên file này chỉ được tải khi người dùng bấm xuất (xem ExportDialog).

const TEAL = "FF00767E";
const LIGHT = "FFDDF1F2";
const GRAY = "FF576574";
const LINE = "FFD5DCE3";
const fill = (argb: string) => ({ type: "pattern", pattern: "solid", fgColor: { argb } }) as const;
const border = { style: "thin", color: { argb: LINE } } as const;
const box = { top: border, left: border, bottom: border, right: border };

const columnName = (index: number) => String.fromCharCode(64 + index);

/** Tạo tệp .xlsx theo mẫu: tiêu đề, thông tin kỳ báo cáo, số tổng, bảng chi tiết, dòng tổng, chữ ký. */
export async function reportToXlsx(report: ReportExport): Promise<Blob> {
  const { title, meta, kpis, headers, rows, totals, note } = report;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "HopOn";
  const sheet = workbook.addWorksheet("Báo cáo", {
    pageSetup: {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
    headerFooter: { oddFooter: "&LHopOn · Cổng quản trị&RTrang &P / &N" },
  });
  const last = headers.length;
  const merge = (row: number, from: number, to: number) => sheet.mergeCells(row, from, row, to);

  sheet.columns = headers.map((_, index) => ({ width: index === 0 ? 26 : 17 }));

  const brand = sheet.getCell(1, 1);
  brand.value = "HopOn · Cổng quản trị Metro TP.HCM";
  brand.font = { bold: true, size: 11, color: { argb: TEAL } };
  merge(1, 1, last);

  const heading = sheet.getCell(2, 1);
  heading.value = title;
  heading.font = { bold: true, size: 15 };
  heading.alignment = { horizontal: "center", vertical: "middle" };
  merge(2, 1, last);
  sheet.getRow(2).height = 28;

  let row = 4;
  for (const [label, value] of meta) {
    sheet.getCell(row, 1).value = label;
    sheet.getCell(row, 1).font = { color: { argb: GRAY } };
    sheet.getCell(row, 2).value = value;
    sheet.getCell(row, 2).font = { bold: true };
    merge(row, 2, last);
    row += 1;
  }
  row += 1;

  // Số tổng: mỗi chỉ số một dòng, cùng cột với thông tin phía trên để dễ đọc và dễ in.
  for (const [label, value] of kpis) {
    const name = sheet.getCell(row, 1);
    name.value = label;
    name.fill = fill(LIGHT);
    name.border = box;
    const number = sheet.getCell(row, 2);
    number.value = value;
    number.font = { bold: true };
    number.alignment = { horizontal: "right" };
    number.border = box;
    row += 1;
  }
  row += 1;

  const headerRow = row;
  headers.forEach((text, index) => {
    const cell = sheet.getCell(headerRow, index + 1);
    cell.value = text;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = fill(TEAL);
    cell.border = box;
    cell.alignment = { horizontal: index ? "right" : "left", vertical: "middle", wrapText: true };
  });
  sheet.getRow(headerRow).height = 32;
  sheet.pageSetup.printTitlesRow = `${headerRow}:${headerRow}`;
  row += 1;

  const firstData = row;
  for (const values of rows) {
    values.forEach((value, index) => {
      const cell = sheet.getCell(row, index + 1);
      cell.value = value;
      cell.border = box;
      if (index) cell.numFmt = "#,##0";
    });
    row += 1;
  }

  // Dòng tổng dùng công thức để người nhận sửa số thì tổng vẫn đúng; `result` để hiện ngay khi mở tệp.
  totals.forEach((value, index) => {
    const cell = sheet.getCell(row, index + 1);
    if (index === 0 || !rows.length) cell.value = value;
    else {
      const column = columnName(index + 1);
      cell.value = {
        formula: `SUM(${column}${firstData}:${column}${row - 1})`,
        result: Number(value),
      };
      cell.numFmt = "#,##0";
    }
    cell.font = { bold: true };
    cell.fill = fill(LIGHT);
    cell.border = box;
  });
  row += 2;

  sheet.getCell(row, 1).value = note;
  sheet.getCell(row, 1).font = { italic: true, size: 9, color: { argb: GRAY } };
  merge(row, 1, last);
  row += 2;

  const preparedBy = meta.find(([label]) => label === "Người lập")?.[1] ?? "";
  const middle = Math.ceil(last / 2);
  const signature = (from: number, to: number, role: string, name = "") => {
    [role, "(Ký, ghi rõ họ tên)"].forEach((text, offset) => {
      const cell = sheet.getCell(row + offset, from);
      cell.value = text;
      cell.alignment = { horizontal: "center" };
      cell.font = offset ? { italic: true, size: 9, color: { argb: GRAY } } : { bold: true };
      merge(row + offset, from, to);
    });
    const cell = sheet.getCell(row + 6, from);
    cell.value = name;
    cell.alignment = { horizontal: "center" };
    merge(row + 6, from, to);
  };
  signature(1, middle, "Người lập báo cáo", preparedBy);
  signature(middle + 1, last, "Người phê duyệt");

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
