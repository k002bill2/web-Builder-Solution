import { slotPlaceholder } from "./slotPlaceholder";

describe("빈 슬롯 자리표시 문장 (K7 · E-S21)", () => {
  it("SPEC 예문 '제목을 입력하세요' · 받침 없으면 '를'", () => {
    expect(slotPlaceholder("제목")).toBe("제목을 입력하세요");
    expect(slotPlaceholder("부제")).toBe("부제를 입력하세요");
    expect(slotPlaceholder("버튼 문구")).toBe("버튼 문구를 입력하세요");
    expect(slotPlaceholder("서비스 목록")).toBe("서비스 목록을 입력하세요");
  });
});
