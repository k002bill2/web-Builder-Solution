import { lazy, Suspense, type ComponentProps, type MouseEventHandler, type ReactNode } from "react";
import { Link } from "react-router";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { Button } from "../ds/Button";
import { SectionList } from "./SectionList";

/** "테마 바꾸기" 대화상자(조작 뒤, ER-AC-T7) — 테마 영역·대비 줄 "테마 바꾸기"를 눌러야 받는다 */
const ThemeDialog = lazy(() => import("./ThemeDialog"));
export function ThemeDialogSlot(props: ComponentProps<typeof ThemeDialog>) {
  return (
    <Suspense fallback={null}>
      <ThemeDialog {...props} />
    </Suspense>
  );
}

/** 편집기 영역 제목(6.1 h2) — 모든 배치가 같은 제목을 쓴다 */
const H2 = "ds-heading2 focus:outline-none";
const CAPTION = "ds-caption1 text-label-alternative";

/**
 * "편집 알림"(6.3 · E-AC-33) — 배치마다 정확히 1개. 비어 있어도 그려 둔다(`display:none` 금지).
 * 알림 줄(5.4 · Q7) = `role=status` 글자 + **영역 밖 형제 버튼** "되돌리기"(D-QA06 형식) — 바로 앞 연산 1개만.
 */
export function NoticeRegion({ text, detail, onUndo }: { readonly text: string; readonly detail?: string; readonly onUndo?: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {/* detail = 접힌 원문(진입 알림 8.2.1 (a), r4.7 A3-Q7) — 요약 줄이 summary, 원문은 펼치면 보인다 */}
      <div role="status" aria-label="편집 알림" className="ds-body2 px-3 empty:p-0">
        {detail ? (
          <details>
            <summary className="cursor-pointer">{text}</summary>
            <p className="ds-body3 mt-1">{detail}</p>
          </details>
        ) : (
          text
        )}
      </div>
      {onUndo && (
        <button type="button" onClick={onUndo} className="ds-label min-h-8 rounded-sm px-3 text-primary hover:bg-fill-normal hover:text-primary-hover">
          되돌리기
        </button>
      )}
    </div>
  );
}

/** 섹션 열(6.2 `nav` "섹션") — 페이지 정보 줄 + 섹션 줄. ≥1280 왼쪽 열 · <1024 "섹션" 탭 */
export function SectionNav({
  doc,
  selectedId,
  onSelect,
  selectedExtra,
  footer,
}: {
  readonly doc: PageDoc;
  readonly selectedId: string;
  readonly onSelect: (id: string) => void;
  /** <1024 "섹션" 탭 — 선택 줄 옆 순서 부품(5.2) */
  readonly selectedExtra?: ReactNode;
  /** 목록 아래 "섹션 추가"(5.3 · 4.3 순서: 섹션 줄 → 섹션 추가) */
  readonly footer?: ReactNode;
}) {
  return (
    <nav aria-labelledby="studio-sections-heading" className="flex flex-col gap-2">
      <h2 id="studio-sections-heading" className={H2}>
        섹션
      </h2>
      <SectionList sections={doc.sections} selectedId={selectedId} onSelect={onSelect} selectedExtra={selectedExtra} />
      {footer}
    </nav>
  );
}

/**
 * 테마(3.1 · 4.2) — ≥1280은 "프로필 v3", 그 밖은 문서 Tag가 여기로 온다. h2 `tabIndex=-1` = 게이트 "대비 AA" 줄 이동 대상(5.12).
 * "테마 바꾸기"(outline · EDITOR-REST SPEC r1 3.1) = 바로 다음 Tab · E-S18 캡션(문서 버전 < 계열 최신)은 그 버튼의 설명 · "프로필 보기"에 `?v=문서 버전`
 */
export function ThemePanel({
  doc,
  docTag,
  profileId,
  onTheme,
  newer,
}: {
  readonly doc: PageDoc;
  readonly docTag?: string;
  readonly profileId: string;
  readonly onTheme?: MouseEventHandler<HTMLElement>;
  readonly newer?: string;
}) {
  return (
    <section aria-labelledby="studio-theme-heading" className="flex flex-col items-start gap-2">
      <h2 id="studio-theme-heading" tabIndex={-1} className={H2}>
        테마
      </h2>
      <span className="ds-caption1 rounded-sm bg-fill-strong px-2 py-0.5 text-label-neutral">{docTag ?? `프로필 v${doc.profileVersion}`}</span>
      {onTheme && (
        <Button id="studio-theme-swap" variant="outline" size="sm" onClick={onTheme} aria-describedby={newer && "studio-theme-newer"}>
          테마 바꾸기
        </Button>
      )}
      {newer && (
        <p id="studio-theme-newer" className={CAPTION}>
          {newer}
        </p>
      )}
      <Link to={`/profile/${profileId}?v=${doc.profileVersion}`} className="ds-label text-primary hover:text-primary-hover">
        프로필 보기
      </Link>
    </section>
  );
}

/** 편집 패널 "편집 · <섹션 이름>"(6.1). h2 `tabIndex=-1` = 게이트 문제 줄 이동 대상(6.4). `head` = 머리 순서·삭제 부품(5.2·5.4) */
export function EditPanel({ name, head, children }: { readonly name: string; readonly head?: ReactNode; readonly children?: ReactNode }) {
  return (
    <section aria-labelledby="studio-edit-heading" className="flex flex-col gap-3">
      <h2 id="studio-edit-heading" tabIndex={-1} className={H2}>
        편집 · {name}
      </h2>
      {head}
      {children}
    </section>
  );
}

/**
 * 품질 게이트 · 내보내기(6.1 h2 · h3 · 5.12 · 5.13). h2 `tabIndex=-1` = 툴바 "검사 · 내보내기" 이동 대상(E-S26).
 * `children` = 게이트 8줄(GateList) · `exports` = 내보내기 묶음(없으면 생성기 안내 문장)
 */
export function GatePanel({ children, exports }: { readonly children?: ReactNode; readonly exports?: ReactNode }) {
  return (
    <section aria-labelledby="studio-gate-heading" className="flex flex-col gap-2">
      <h2 id="studio-gate-heading" tabIndex={-1} className={H2}>
        품질 게이트
      </h2>
      {children}
      <h3 className="ds-label">내보내기</h3>
      {exports ?? <p className={CAPTION}>코드 생성기 연결 후(M2) 내보낼 수 있습니다. 지금 문서는 이 탭에 저장돼 있습니다.</p>}
    </section>
  );
}
