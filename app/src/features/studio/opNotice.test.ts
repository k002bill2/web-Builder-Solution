import { movedNotice, toParticle } from "./opNotice";

describe("편집 알림 문장 (K3 · 5.2)", () => {
  it("SPEC 예문 그대로 — 'Services를 4번째로 옮겼습니다'", () => {
    expect(movedNotice("services", "Services", 3)).toBe("Services를 4번째로 옮겼습니다");
  });

  it("받침 있는 영어 이름(About·Pricing)은 '을'", () => {
    expect(movedNotice("about", "About", 2)).toBe("About을 3번째로 옮겼습니다");
    expect(movedNotice("pricing", "Pricing", 5)).toBe("Pricing을 6번째로 옮겼습니다");
    expect(movedNotice("faq", "FAQ", 4)).toBe("FAQ를 5번째로 옮겼습니다");
  });

  it("으로/로 — 받침·ㄹ 받침·숫자", () => {
    expect(toParticle("스플릿")).toBe("으로");
    expect(toParticle("목록형")).toBe("으로");
    expect(toParticle("카드 2열")).toBe("로");
    expect(toParticle("후기 2개")).toBe("로");
    expect(toParticle("요금제 2단")).toBe("으로");
    expect(toParticle("그리드 3")).toBe("으로");
    expect(toParticle("그리드 2")).toBe("로");
  });
});
