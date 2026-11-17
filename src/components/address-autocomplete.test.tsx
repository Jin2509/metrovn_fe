import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AddressAutocomplete } from "@/components/address-autocomplete";

const photon = {
  features: [
    {
      properties: {
        osm_type: "W",
        osm_id: 1,
        type: "house",
        name: "Nhà hát Thành phố",
        housenumber: "7",
        street: "Công trường Lam Sơn",
        district: "Sài Gòn",
        city: "Thành phố Hồ Chí Minh",
      },
      geometry: { coordinates: [106.7032488, 10.7767437] },
    },
    {
      properties: {
        osm_type: "N",
        osm_id: 2,
        type: "house",
        name: "Bến Thành",
        street: "Trần Hưng Đạo",
        district: "Bến Thành",
        city: "Thành phố Hồ Chí Minh",
      },
      geometry: { coordinates: [106.6975693, 10.7707755] },
    },
  ],
};

describe("AddressAutocomplete", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    // Timer giả để điều khiển debounce; vẫn cho thời gian thật trôi để waitFor hoạt động.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, json: async () => photon });
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("gõ ≥ 2 ký tự → chờ 350 ms → hỏi Photon một lần, hiện gợi ý, chọn bằng bàn phím", async () => {
    const onChange = vi.fn();
    const onSelect = vi.fn();
    render(
      <AddressAutocomplete
        id="addr"
        value=""
        onChange={onChange}
        onSelect={onSelect}
        near={null}
      />,
    );
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "N" } });
    fireEvent.change(input, { target: { value: "Nhà hát" } });
    expect(onChange).toHaveBeenLastCalledWith("Nhà hát");
    expect(fetchMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(400);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("photon.komoot.io/api/?q=Nh%C3%A0+h%C3%A1t");
    expect(url).toContain("lang=default");

    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(2));
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("7 Công trường Lam Sơn, Sài Gòn, Thành phố Hồ Chí Minh")).toBeTruthy();

    fireEvent.keyDown(input, { key: "ArrowDown" }); // sang gợi ý thứ 2
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Bến Thành",
        district: "Bến Thành",
        lat: 10.7707755,
        lng: 106.6975693,
      }),
    );
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("dưới 2 ký tự thì không gọi; lỗi dịch vụ thì báo trong danh sách và vẫn nhập tay được", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503, json: async () => ({}) });
    render(<AddressAutocomplete id="addr" value="" onChange={() => {}} onSelect={() => {}} />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "B" } });
    await vi.advanceTimersByTimeAsync(400);
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "Bến Thành" } });
    await vi.advanceTimersByTimeAsync(400);
    await waitFor(() => expect(screen.getByText(/không phản hồi/)).toBeTruthy());
    expect(input).not.toBeDisabled();
  });
});
