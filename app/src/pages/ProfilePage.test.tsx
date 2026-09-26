/**
 * DS-2A-04 2a-04a2 프로필 화면 — `/profile` 목록 · `/profile/:id` 상세 (P-AC-01~10 화면 · 41 · 33 · 34 · 37).
 * 보드·프로필 메모리 저장소는 store 하나(createMemoryStudio). "다른 탭"의 쓰기는 보드 저장소를 직접 부른다.
 */
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryStudio } from "../data/memoryStudio";
import type { ProfileCall } from "../data/memoryProfileRepository";
import { createMemoryReferenceRepository } from "../data/referenceRepository";
import type { Picks } from "../domain/compareBoard";
import { PROFILE_EVENT, type ProfileEvent } from "../features/profile/profileEvents";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
import { proposeCorrections } from "../domain/profileContrast";
import { referenceComparisonAttributes } from "../fixtures/referenceComparisons";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { renderApp } from "../test/renderApp";

const THREE = ["ref-a", "ref-b", "ref-c"];
const references = (withdrawn?: string) =>
  createMemoryReferenceRepository(
    referenceFixtures.map((r) => (r.id === withdrawn ? { ...r, licenseStatus: "external_observed" as const } : r)),
    referenceDetailFixtures,
  );

interface Options {
  readonly picks?: Picks;
  readonly withdrawn?: string;
  readonly delay?: (call: ProfileCall) => Promise<void> | undefined;
  readonly fail?: (call: ProfileCall) => Error | undefined;
  /** 렌더 전에 더 할 쓰기 */
  readonly before?: (studio: ReturnType<typeof createMemoryStudio>) => Promise<unknown>;
}

/** v1 보드 확정 → (versions ≥ 2면) 보드에서 대표색을 ref-c로 바꿔 재확정 → path 렌더 */
async function openProfile(path: string, versions = 1, options: Options = {}) {
  const studio = createMemoryStudio(
    { catalog: FIXTURE_CATALOG, initialBoard: boardOf(THREE, options.picks ?? { hero: "ref-a" }) },
    { ...(options.delay && { delay: options.delay }), ...(options.fail && { fail: options.fail }) },
  );
  await studio.board.confirmProfile(1, 0);
  for (let v = 2; v <= versions; v += 1) await reconfirm(studio, v - 1, v % 2 === 0 ? "ref-c" : "ref-a");
  await options.before?.(studio);
  const view = renderApp(path, references(options.withdrawn), studio.board, studio.profiles);
  return { ...view, studio };
}

/** 다른 탭: 보드에서 대표색을 바꿔 재확정 */
async function reconfirm(studio: ReturnType<typeof createMemoryStudio>, latest: number, palette: string) {
  const { board } = await studio.board.getBoard();
  const changed = await studio.board.savePicks({ ...board.picks, palette }, board.custom, board.revision);
  await studio.board.createProfileVersion("profile-1", changed.revision, latest);
}

/** 보정 제안 hex — 수치 자체는 domain/profileContrast.test.ts가 스크립트 값으로 고정한다(화면 테스트에 hex 글자를 두지 않는다) */
const proposalFor = (id: string, role: string) =>
  proposeCorrections(referenceDetailFixtures[id]!.palette, referenceComparisonAttributes[id]!.card.surfaceTone, "aa").find((p) => p.role === role)!.to;

const h1 = () => screen.findByRole("heading", { level: 1 });
const versionRow = (v: number) => screen.getByRole("listitem", { name: new RegExp(`^v${v} `) });
const events: ProfileEvent[] = [];
const listen = (e: Event) => events.push((e as CustomEvent<ProfileEvent>).detail);

afterEach(() => {
  window.removeEventListener(PROFILE_EVENT, listen);
  events.length = 0;
  vi.restoreAllMocks();
});

describe("P-AC-01 보드 확정 → 프로필 화면", () => {
  it("비교 보드에서 확정하면 /profile/profile-1에 h1 '디자인 프로필' · 'v1 · 현재' · 3.1 필드가 모두 보인다", async () => {
    const studio = createMemoryStudio({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(THREE, { hero: "ref-a" }) });
    const { router } = renderApp("/compare", references(), studio.board, studio.profiles);
    await userEvent.click(await screen.findByRole("button", { name: "프로필 확정 (v1)" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/profile/profile-1"));
    // lazy 라우트 전환 중에는 이전 화면(비교 보드) h1이 잠시 남는다 — 이름으로 새 화면 h1을 기다린다
    expect(await screen.findByRole("heading", { level: 1, name: "디자인 프로필" })).toBeInTheDocument();
    expect(screen.getByText("v1 · 현재")).toBeInTheDocument();
    expect(screen.getByText(/^기준 레퍼런스: 모던 카페 브랜드 · /)).toBeInTheDocument();
    const values = screen.getByRole("region", { name: "프로필 값" });
    for (const label of ["시각 방향", "레이아웃 방향", "Hero", "메뉴", "CTA 위치", "카드 스타일", "이미지 비율", "모바일 구조", "Footer", "타이포그래피", "간격", "모션", "섹션 구성"]) {
      expect(within(values).getByText(label)).toBeInTheDocument();
    }
    expect(within(values).getByText("풀블리드 이미지 + 좌측 카피")).toBeInTheDocument();
    expect(within(values).getByText(/^라이브러리 1\.4 · seed \S+ · /)).toBeInTheDocument();
    const palette = screen.getByRole("region", { name: "역할 팔레트와 대비" });
    const swatches = within(palette).getByRole("list", { name: "역할 팔레트" });
    for (const role of ["primary", "surface", "ink", "muted", "bg"]) expect(within(swatches).getByText(new RegExp(`\\(${role}\\)`))).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "비교 보드에서 선택 바꾸기" })).toHaveAttribute("href", "/compare");
  });
});

describe("P-AC-02 없는 프로필 (P-S02)", () => {
  it("없는 id → h1 '프로필을 찾을 수 없습니다' + 새로고침 안내 + '비교 보드로', role=alert 없음", async () => {
    await openProfile("/profile/profile-9");
    expect(await h1()).toHaveTextContent("프로필을 찾을 수 없습니다");
    expect(screen.getByText("새로고침하면 확정한 프로필이 사라집니다(서버 연결 전)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "비교 보드로" })).toHaveAttribute("href", "/compare");
    expect(within(screen.getByRole("main")).getByRole("link", { name: "카탈로그" })).toHaveAttribute("href", "/catalog");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("P-AC-03 /profile 목록 (P-S04·05)", () => {
  it("프로필 0 → 시작 안내 + 비교 보드로 · 카탈로그에서 고르기", async () => {
    renderApp("/profile");
    expect(await h1()).toHaveTextContent("디자인 프로필");
    expect(await screen.findByText("프로필은 비교 보드에서 요소를 골라 확정하면 만들어집니다")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "비교 보드로" })).toHaveAttribute("href", "/compare");
    expect(screen.getByRole("link", { name: "카탈로그에서 고르기" })).toHaveAttribute("href", "/catalog");
  });

  it("프로필이 있으면 줄마다 기준 레퍼런스 제목 · 최신 버전 · 열기 링크", async () => {
    const { router } = await openProfile("/profile", 2);
    const row = await screen.findByRole("listitem", { name: /^모던 카페 브랜드/ });
    expect(within(row).getByText("최신 v2")).toBeInTheDocument();
    expect(within(row).getByText((_, el) => el?.tagName === "TIME")).toHaveAttribute("datetime");
    await userEvent.click(within(row).getByRole("link", { name: "모던 카페 브랜드 열기" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/profile/profile-1"));
  });
});

describe("P-AC-04 출처 (권리 경계 · P-S16)", () => {
  it("제목 링크 · 업종 · 라이선스, 회수된 출처는 '출처 회수됨' 글자 + 링크 없음, 이미지·외부 URL 0", async () => {
    await openProfile("/profile/profile-1", 1, { picks: { hero: "ref-a", palette: "ref-c" }, withdrawn: "ref-c" });
    const sources = await screen.findByRole("list", { name: "출처 레퍼런스" });
    const live = within(sources).getByRole("link", { name: "모던 카페 브랜드" });
    expect(live).toHaveAttribute("href", "/references/ref-a");
    const withdrawn = within(sources).getAllByRole("listitem")[1]!;
    expect(withdrawn).toHaveTextContent("출처 회수됨");
    expect(withdrawn).toHaveTextContent("프로필 값은 우리 섹션·토큰이라 계속 쓸 수 있습니다");
    expect(within(withdrawn).queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("출처 레퍼런스의 이미지·문구는 쓰지 않습니다")).toBeInTheDocument();
    expect(document.querySelectorAll("main img")).toHaveLength(0);
    expect([...document.querySelectorAll("main a")].every((a) => a.getAttribute("href")?.startsWith("/"))).toBe(true);
  });
});

describe("P-AC-05·06 대비 검사 표시 (3.3)", () => {
  it("ref-a: C-1·C-2·C-4 통과 · C-5 3.8:1 미달 + muted 대체안(4.5:1, 명도 −3.9%p), 밝은 카드라 C-3 줄 없음", async () => {
    await openProfile("/profile/profile-1");
    const palette = await screen.findByRole("region", { name: "역할 팔레트와 대비" });
    const checks = within(palette).getByRole("list", { name: "대비 검사" });
    expect(within(checks).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      expect.stringMatching(/^C-1.*5\.5:1.*통과/),
      expect.stringMatching(/^C-2.*13\.9:1.*통과/),
      expect.stringMatching(/^C-4.*11\.6:1.*통과/),
      expect.stringMatching(/^C-5.*3\.8:1.*미달/),
    ]);
    expect(within(palette).getByText(`보조 글자(muted) 대비가 배경에서 3.8:1로 기준 4.5:1보다 낮습니다. 대체안: ${proposalFor("ref-a", "muted")}(4.5:1, 명도 −3.9%p)`)).toBeInTheDocument();
  });

  it("ref-b(어두운 카드): C-3 7.3 통과, ink 보정은 충돌(C-3 7.3 → 2.8) → 보정값 쓰기 없음 + 대체안 + '비교 보드에서 카드 바꾸기', muted는 보정 제공", async () => {
    await openProfile("/profile/profile-1", 1, { picks: { hero: "ref-b" } });
    const palette = await screen.findByRole("region", { name: "역할 팔레트와 대비" });
    expect(within(palette).getByText(/^C-3/).closest("li")).toHaveTextContent(/7\.3:1.*통과/);
    expect(within(palette).getByText(/본문 글자\(ink\)가 .*한 값으로 둘 다 맞출 수 없습니다\. 대체안: 비교 보드에서 밝은 카드를 고르면 ink를 어둡게 보정할 수 있습니다/)).toBeInTheDocument();
    expect(within(palette).getByText(`후보 ${proposalFor("ref-b", "ink")}를 쓰면 C-3 7.3:1 → 2.8:1`)).toBeInTheDocument();
    expect(within(palette).getByRole("link", { name: "비교 보드에서 카드 바꾸기" })).toHaveAttribute("href", "/compare");
    expect(within(palette).getByText(new RegExp(`대체안: ${proposalFor("ref-b", "muted")}\\(4\\.5:1`))).toBeInTheDocument();
    // 2a-04b2(Q6): muted에는 "보정값 쓰기"가 생겼다 — 충돌인 ink에만 없다
    expect(within(palette).queryByRole("button", { name: /보정값 쓰기 \(본문 글자 ink\)/ })).not.toBeInTheDocument();
  });
});

describe("P-AC-07 버전 목록 (P-S06)", () => {
  it("버전 1개 → 한 줄 + '비교할 이전 버전이 없습니다', 비교·되돌리기 버튼 없음", async () => {
    await openProfile("/profile/profile-1");
    await h1();
    const row = versionRow(1);
    expect(row).toHaveTextContent("현재");
    expect(row).toHaveTextContent("보드 확정");
    expect(row).toHaveTextContent("첫 버전");
    expect(within(row).getByText((_, el) => el?.tagName === "TIME")).toHaveAttribute("datetime");
    expect(screen.getByText("비교할 이전 버전이 없습니다")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /비교|되돌리기/ })).not.toBeInTheDocument();
  });

  it("버전마다 번호 · 출처 · 요약 · 시각, 최신이 위, 현재 버전은 Tag 글자 '현재'", async () => {
    await openProfile("/profile/profile-1", 2);
    await h1();
    const rows = within(screen.getByRole("list", { name: "버전 목록" })).getAllByRole("listitem");
    expect(rows.map((r) => r.getAttribute("aria-label"))).toEqual([expect.stringMatching(/^v2 /), expect.stringMatching(/^v1 /)]);
    expect(within(rows[0]!).getByText("현재")).toBeInTheDocument();
    expect(rows[0]).toHaveTextContent("보드 재확정");
    expect(rows[0]).toHaveTextContent(/출처 · .+ 외 \d+/);
    expect(within(rows[1]!).queryByText("현재")).not.toBeInTheDocument();
    expect(within(rows[0]!).queryByRole("button", { name: /현재와 비교/ })).not.toBeInTheDocument();
    expect(within(rows[1]!).getByRole("button", { name: "현재와 비교 (v1)" })).toBeInTheDocument();
  });
});

describe("P-AC-08 이전 버전 보기 (P-S07)", () => {
  it("'보기' → ?v=1, Callout 'v1을 보고 있습니다 · 현재 v2' + 되돌리기, Tag 'v1 · 이전 버전', 포커스 h1", async () => {
    const { router } = await openProfile("/profile/profile-1", 2);
    await h1();
    await userEvent.click(within(versionRow(1)).getByRole("button", { name: "보기 (v1)" }));
    expect(router.state.location.search).toBe("?v=1");
    expect(await screen.findByText("v1을 보고 있습니다 · 현재 v2")).toBeInTheDocument();
    expect(screen.getByText("v1 · 이전 버전")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveFocus();
    expect(screen.getByRole("button", { name: "이 버전으로 되돌리기" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("link", { name: "현재 버전 보기" }));
    expect(router.state.location.search).toBe("");
  });
});

describe("P-AC-09 버전 비교 (P-S08)", () => {
  it("'현재와 비교' → 표(caption 'v1과 v2 비교')에 포커스, 바뀐 줄 '바뀜' · 닫으면 비교 버튼으로 포커스", async () => {
    const { router } = await openProfile("/profile/profile-1", 2);
    await h1();
    await userEvent.click(within(versionRow(1)).getByRole("button", { name: "현재와 비교 (v1)" }));
    expect(router.state.location.search).toBe("?diff=1");
    const table = await screen.findByRole("table", { name: "v1과 v2 비교" });
    expect(within(table).getAllByRole("columnheader").map((th) => th.textContent)).toEqual(["항목", "v1", "v2", "차이"]);
    const primary = within(table).getByRole("row", { name: /대표색 \(primary\)/ });
    expect(primary).toHaveTextContent("바뀜");
    expect(within(table).getByRole("row", { name: /^Hero/ })).not.toHaveTextContent("바뀜");
    expect(table.querySelector("caption")).toHaveFocus();
    await userEvent.click(screen.getByRole("button", { name: "비교 닫기" }));
    expect(router.state.location.search).toBe("");
    expect(within(versionRow(1)).getByRole("button", { name: "현재와 비교 (v1)" })).toHaveFocus();
  });

  it("같은 값 두 버전(v1과 v1을 되돌린 v3) → '두 버전의 값이 같습니다'", async () => {
    await openProfile("/profile/profile-1?diff=1", 2, { before: (studio) => studio.profiles.revertTo("profile-1", 1, 2) });
    expect(await screen.findByText("두 버전의 값이 같습니다")).toBeInTheDocument();
  });
});

describe("FIX-2A04a2 Q3 비교 쌍 = (?v= 또는 최신, diff) · Q9 없는 버전 안내", () => {
  const columns = (table: HTMLElement) => within(table).getAllByRole("columnheader").map((th) => th.textContent);
  /** 상시 "프로필 알림" 영역에 문장이 나왔는지 + 보이는 안내 Callout 제목(h3) */
  const announced = (text: string) => waitFor(() => expect(screen.getByRole("status", { name: "프로필 알림" })).toHaveTextContent(text));
  const missingCallout = (name: string | RegExp) => screen.queryByRole("heading", { level: 3, name });

  it("F-1 v3 계열 ?v=1&diff=2 → caption·표 = v1↔v2 (v3 열 없음)", async () => {
    await openProfile("/profile/profile-1?v=1&diff=2", 3);
    const table = await screen.findByRole("table", { name: "v1과 v2 비교" });
    expect(columns(table)).toEqual(["항목", "v1", "v2", "차이"]);
    expect(within(table).getByRole("row", { name: /대표색 \(primary\)/ })).toHaveTextContent("바뀜");
  });

  it("F-2 ?diff=2(v 없음) → v2↔최신 v3", async () => {
    await openProfile("/profile/profile-1?diff=2", 3);
    const table = await screen.findByRole("table", { name: "v2와 v3 비교" });
    expect(columns(table)).toEqual(["항목", "v2", "v3", "차이"]);
  });

  it("F-3 ?v=1에서 v2 줄 'v1과 비교 (v2)' → ?v=1&diff=2 · 포커스 caption · 닫기 → 같은 버튼", async () => {
    const { router } = await openProfile("/profile/profile-1?v=1", 3);
    await h1();
    expect(within(versionRow(1)).queryByRole("button", { name: /비교/ })).not.toBeInTheDocument();
    expect(within(versionRow(3)).getByRole("button", { name: "v1과 비교 (v3)" })).toHaveTextContent("v1과 비교");
    await userEvent.click(within(versionRow(2)).getByRole("button", { name: "v1과 비교 (v2)" }));
    expect(router.state.location.search).toBe("?v=1&diff=2");
    const table = await screen.findByRole("table", { name: "v1과 v2 비교" });
    expect(table.querySelector("caption")).toHaveFocus();
    await userEvent.click(screen.getByRole("button", { name: "비교 닫기" }));
    expect(router.state.location.search).toBe("?v=1");
    expect(within(versionRow(2)).getByRole("button", { name: "v1과 비교 (v2)" })).toHaveFocus();
  });

  it.each(["?v=2&diff=2", "?diff=9", "?diff=3"])("F-4 %s → 비교 닫힘(표·같음 문장 없음)", async (search) => {
    await openProfile(`/profile/profile-1${search}`, 3);
    await h1();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText("두 버전의 값이 같습니다")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "비교 닫기" })).not.toBeInTheDocument();
  });

  it("F-5 ?v=7(v3 계열) → 최신 v3 + role=status '요청한 v7이 없어 최신 v3을 보여 줍니다'", async () => {
    await openProfile("/profile/profile-1?v=7", 3);
    await h1();
    expect(screen.getByText("v3 · 현재")).toBeInTheDocument();
    await announced("요청한 v7이 없어 최신 v3을 보여 줍니다");
    expect(missingCallout("요청한 v7이 없어 최신 v3을 보여 줍니다")).toBeInTheDocument();
    expect(screen.queryByText(/보고 있습니다/)).not.toBeInTheDocument();
  });

  it("F-5 ?v=abc → '요청한 버전이 없어 최신 v3을 보여 줍니다'", async () => {
    await openProfile("/profile/profile-1?v=abc", 3);
    await h1();
    await announced("요청한 버전이 없어 최신 v3을 보여 줍니다");
    expect(missingCallout("요청한 버전이 없어 최신 v3을 보여 줍니다")).toBeInTheDocument();
  });

  it("F-5 ?v=3·?diff=9 → 요청 버전 안내 없음", async () => {
    await openProfile("/profile/profile-1?v=3&diff=9", 3);
    await h1();
    expect(screen.queryByText(/요청한/)).not.toBeInTheDocument();
  });

  it("F-6 ?v=7 → '프로필 알림' 영역 = '요청한 v7이 없어 최신 v3을 보여 줍니다', 보이는 Callout 유지 · Callout 쪽 role=status 없음", async () => {
    await openProfile("/profile/profile-1?v=7", 3);
    await h1();
    await announced("요청한 v7이 없어 최신 v3을 보여 줍니다");
    const callout = missingCallout("요청한 v7이 없어 최신 v3을 보여 줍니다");
    expect(callout).toBeVisible();
    expect(callout?.closest("[role=status]")).toBeNull();
    expect(screen.getAllByRole("status")).toEqual([screen.getByRole("status", { name: "프로필 알림" })]);
  });

  it("F-7 같은 화면에서 ?v=7 → ?v=9 알림 문장 갱신, ?v=1(있는 버전) → 안내 Callout 사라짐", async () => {
    const { router } = await openProfile("/profile/profile-1?v=7", 3);
    await h1();
    await announced("요청한 v7이 없어 최신 v3을 보여 줍니다");
    const region = screen.getByRole("status", { name: "프로필 알림" });
    await act(() => router.navigate("/profile/profile-1?v=9"));
    await announced("요청한 v9가 없어 최신 v3을 보여 줍니다");
    expect(screen.getByRole("status", { name: "프로필 알림" })).toBe(region);
    expect(missingCallout("요청한 v9가 없어 최신 v3을 보여 줍니다")).toBeInTheDocument();
    expect(missingCallout(/요청한 v7/)).not.toBeInTheDocument();
    await act(() => router.navigate("/profile/profile-1?v=1"));
    expect(await screen.findByText("v1을 보고 있습니다 · 현재 v3")).toBeInTheDocument();
    expect(missingCallout(/요청한/)).not.toBeInTheDocument();
  });

  it("F-7 ?v=abc → ?v=0(같은 문장) → 알림을 다시 낸다(key 갱신으로 새 문장 노드)", async () => {
    const { router } = await openProfile("/profile/profile-1?v=abc", 3);
    await h1();
    await announced("요청한 버전이 없어 최신 v3을 보여 줍니다");
    const region = screen.getByRole("status", { name: "프로필 알림" });
    const first = region.firstElementChild;
    await act(() => router.navigate("/profile/profile-1?v=0"));
    await waitFor(() => expect(region.firstElementChild).not.toBe(first));
    expect(region).toHaveTextContent("요청한 버전이 없어 최신 v3을 보여 줍니다");
  });
});

describe("P-AC-10 되돌리기 (P-S09) · P-AC-37 계측", () => {
  it("?v=1에서 되돌리기 → 새 버전 v3 · 알림 'v1 내용으로 v3을 만들었습니다' · 포커스 새 버전 줄 · 현재 보기로 · profile_saved 1회", async () => {
    window.addEventListener(PROFILE_EVENT, listen);
    const { router, studio } = await openProfile("/profile/profile-1?v=1", 2);
    await h1();
    await userEvent.click(screen.getByRole("button", { name: "이 버전으로 되돌리기" }));
    expect(await screen.findByRole("status", { name: "프로필 알림" })).toHaveTextContent("v1 내용으로 v3을 만들었습니다");
    await waitFor(() => expect(versionRow(3)).toHaveFocus());
    expect(router.state.location.search).toBe("");
    expect(screen.getByText("v3 · 현재")).toBeInTheDocument();
    expect(versionRow(3)).toHaveTextContent("되돌리기 (v1)");
    const series = await studio.profiles.getProfile("profile-1");
    expect(series?.versions.map((v) => [v.version, v.origin, v.basedOn])).toEqual([[1, "board", undefined], [2, "board-reconfirm", undefined], [3, "revert", 1]]);
    expect(events).toEqual([{ name: "profile_saved", version: 3, origin: "revert" }]);
  });

  it("되돌리기 실패(요청 오류) → role=alert '되돌리지 못했습니다', 보기 상태 유지 · profile_save_failed(reason) 1회", async () => {
    window.addEventListener(PROFILE_EVENT, listen);
    const { router, studio } = await openProfile("/profile/profile-1?v=1", 2, { fail: (call) => (call.method === "revertTo" ? new Error("네트워크") : undefined) });
    await h1();
    await userEvent.click(screen.getByRole("button", { name: "이 버전으로 되돌리기" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("되돌리지 못했습니다 · 다시 시도하세요");
    expect(router.state.location.search).toBe("?v=1");
    expect((await studio.profiles.getProfile("profile-1"))?.latestVersion).toBe(2);
    expect(events).toEqual([{ name: "profile_save_failed", reason: "UNKNOWN" }]);
  });

  it("되돌리는 중 연타해도 요청 1회 (aria-busy)", async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => (release = r));
    const { studio } = await openProfile("/profile/profile-1?v=1", 2, { delay: (call) => (call.method === "revertTo" && call.phase === "request" ? gate : undefined) });
    await h1();
    const button = screen.getByRole("button", { name: "이 버전으로 되돌리기" });
    await userEvent.click(button);
    await userEvent.click(button);
    expect(button).toHaveAttribute("aria-busy", "true");
    release();
    await screen.findByText("v3 · 현재");
    expect((await studio.profiles.getProfile("profile-1"))?.latestVersion).toBe(3);
  });
});

describe("P-AC-41 되돌리기 거부(STALE_PROFILE) — 보기 상태 유지 + P-S12 문장", () => {
  it("화면이 v2를 본 뒤 다른 탭이 v3을 만들면 되돌리기 거부, 새 버전 0, 버전 라벨 갱신, ?v=1 유지", async () => {
    window.addEventListener(PROFILE_EVENT, listen);
    const { router, studio } = await openProfile("/profile/profile-1?v=1", 2);
    expect(await screen.findByText("v1을 보고 있습니다 · 현재 v2")).toBeInTheDocument();
    await reconfirm(studio, 2, "ref-a");
    await userEvent.click(screen.getByRole("button", { name: "이 버전으로 되돌리기" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("다른 곳에서 v3이 만들어졌습니다. 되돌리지 않았습니다 — 확인 후 다시 되돌리세요");
    expect(router.state.location.search).toBe("?v=1");
    expect(screen.getByText("v1을 보고 있습니다 · 현재 v3")).toBeInTheDocument();
    expect((await studio.profiles.getProfile("profile-1"))?.versions.map((v) => v.origin)).toEqual(["board", "board-reconfirm", "board-reconfirm"]);
    expect(events).toEqual([{ name: "profile_save_failed", reason: "STALE_PROFILE" }]);
    await userEvent.click(screen.getByRole("button", { name: "이 버전으로 되돌리기" }));
    expect(await screen.findByRole("status", { name: "프로필 알림" })).toHaveTextContent("v1 내용으로 v4를 만들었습니다");
  });
});

describe("P-AC-33·34 키보드 순서 · 색 하나로만 알리지 않기", () => {
  it("DOM 순서 = 흐름(보드 링크 → 출처 → 대비 → 버전), disabled 속성·양수 tabindex 0, 프로필 색은 aria-hidden 견본에만", async () => {
    await openProfile("/profile/profile-1", 2);
    await h1();
    const order = [
      screen.getByRole("link", { name: "비교 보드에서 선택 바꾸기" }),
      screen.getByRole("link", { name: "모던 카페 브랜드" }),
      screen.getByRole("list", { name: "대비 검사" }),
      screen.getByRole("button", { name: "보기 (v1)" }),
    ];
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i - 1]!.compareDocumentPosition(order[i]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    const main = document.querySelector("main")!;
    expect(main.querySelectorAll("[disabled]")).toHaveLength(0);
    expect([...main.querySelectorAll("[tabindex]")].every((el) => Number(el.getAttribute("tabindex")) <= 0)).toBe(true);
    const painted = [...main.querySelectorAll<HTMLElement>("[style]")].filter((el) => el.style.backgroundColor !== "");
    expect(painted.length).toBeGreaterThanOrEqual(5);
    expect(painted.every((el) => el.closest("[aria-hidden='true']") !== null)).toBe(true);
    expect(screen.getAllByText("통과").length).toBeGreaterThan(0);
    expect(screen.getByText("v2 · 현재")).toBeInTheDocument();
  });
});
