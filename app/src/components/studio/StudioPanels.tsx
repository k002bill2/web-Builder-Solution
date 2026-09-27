import type { ReactNode } from "react";
import { Link } from "react-router";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { SectionList } from "./SectionList";

/** 편집기 영역 제목(6.1 h2) — 모든 배치가 같은 제목을 쓴다 */
const H2 = "ds-heading2 focus:outline-none";
const CAPTION = "ds-caption1 text-label-alternative";

/** "편집 알림"(6.3 · E-AC-33) — 배치마다 정확히 1개. 비어 있어도 그려 둔다(`display:none` 금지) */
export function NoticeRegion({ text }: { readonly text: string }) {
  return (
    <p role="status" aria-label="편집 알림" className="ds-body2 px-3 empty:p-0">
      {text}
    </p>
  );
}

/** 섹션 열(6.2 `nav` "섹션") — 페이지 정보 줄 + 섹션 줄. ≥1280 왼쪽 열 · <1024 "섹션" 탭 */
export function SectionNav({ doc, selectedId, onSelect }: { readonly doc: PageDoc; readonly selectedId: string; readonly onSelect: (id: string) => void }) {
  return (
    <nav aria-labelledby="studio-sections-heading" className="flex flex-col gap-2">
      <h2 id="studio-sections-heading" className={H2}>
        섹션
      </h2>
      <SectionList sections={doc.sections} selectedId={selectedId} onSelect={onSelect} />
    </nav>
  );
}

/** 테마(3.1 · 4.2) — ≥1280은 "프로필 v3", 그 밖은 문서 Tag가 여기로 온다. 테마 바꾸기는 a3 */
export function ThemePanel({ doc, docTag, profileId }: { readonly doc: PageDoc; readonly docTag?: string; readonly profileId: string }) {
  return (
    <section aria-labelledby="studio-theme-heading" className="flex flex-col items-start gap-2">
      <h2 id="studio-theme-heading" className={H2}>
        테마
      </h2>
      <span className="ds-caption1 rounded-sm bg-fill-strong px-2 py-0.5 text-label-neutral">{docTag ?? `프로필 v${doc.profileVersion}`}</span>
      <Link to={`/profile/${profileId}`} className="ds-label text-primary hover:text-primary-hover">
        프로필 보기
      </Link>
    </section>
  );
}

/** 편집 패널 "편집 · <섹션 이름>"(6.1). h2 `tabIndex=-1` = 게이트 문제 줄 이동 대상(6.4) */
export function EditPanel({ name, children }: { readonly name: string; readonly children?: ReactNode }) {
  return (
    <section aria-labelledby="studio-edit-heading" className="flex flex-col gap-3">
      <h2 id="studio-edit-heading" tabIndex={-1} className={H2}>
        편집 · {name}
      </h2>
      {children}
    </section>
  );
}

/** 품질 게이트 · 내보내기 자리(6.1 h2 · h3). 검사 목록·내보내기 흐름은 a4(SPEC 13.1) — 제목 구조만 먼저 둔다 */
export function GatePanel() {
  return (
    <section aria-labelledby="studio-gate-heading" className="flex flex-col gap-2">
      <h2 id="studio-gate-heading" tabIndex={-1} className={H2}>
        품질 게이트
      </h2>
      <p className={CAPTION}>검사 항목은 준비 중입니다.</p>
      <h3 className="ds-label">내보내기</h3>
      <p className={CAPTION}>코드 생성기 연결 후(M2) 내보낼 수 있습니다. 지금 문서는 이 탭에 저장돼 있습니다.</p>
    </section>
  );
}
