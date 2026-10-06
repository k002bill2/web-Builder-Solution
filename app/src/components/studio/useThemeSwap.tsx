import { useState, type ComponentProps, type MouseEvent } from "react";
import { Link } from "react-router";
import type { ProfileSeries } from "../../domain/profile";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { sectionName } from "../../features/studio/selection";
import type { ThemeApplyDeps } from "../../features/studio/themeText";
import type { FocusTarget } from "../../features/studio/useFocusRequest";
import { ThemeDialogSlot } from "./StudioPanels";

const ACTION = "ds-label min-h-8 text-primary hover:text-primary-hover";

/**
 * 테마 바꾸기 연결(EDITOR-REST SPEC r1 3.1 · 3.3) — 진입 직후 청크에는 여는 버튼·상태만 둔다(/studio 진입 예산 여유 0.34KB).
 * 버전별 대비 판정 · 적용(useSectionOps.run → 기록 스택 · 알림 줄 "되돌리기") · 알림 문장은 대화상자 청크(조작 뒤).
 * 대비 줄 "테마 바꾸기" = 대비 통과 최신 버전을 미리 고른 대화상자(없으면 대화상자 안 캡션 + 링크). 닫기·적용 뒤 포커스 = 연 버튼.
 */
export function useThemeSwap({
  doc,
  series,
  profileId,
  contrastBlocked,
  requestFocus,
  deps,
}: {
  readonly doc: PageDoc;
  readonly series: ProfileSeries | undefined;
  readonly profileId: string;
  readonly contrastBlocked: boolean;
  readonly requestFocus: (target: FocusTarget) => void;
  readonly deps: Omit<ThemeApplyDeps, "sectionName" | "series">;
}) {
  const [opened, setOpened] = useState<{ readonly opener: HTMLElement; readonly pickPass: boolean }>();
  const open = (pickPass: boolean) => (event: MouseEvent<HTMLElement>) => setOpened({ opener: event.currentTarget, pickPass });
  const props: ComponentProps<typeof ThemeDialogSlot> | undefined = opened &&
    series && {
      doc,
      profileId,
      pickPass: opened.pickPass,
      deps: { ...deps, series, sectionName },
      onClose: () => {
        requestFocus({ element: opened.opener });
        setOpened(undefined);
      },
    };
  const latest = series?.latestVersion ?? 0;
  return {
    dialog: props && <ThemeDialogSlot {...props} />,
    // 대비 줄 행동 2개(3.3) — 판정(통과 버전 있음/없음)은 대화상자가 한다(조작 뒤 · 첫 화면 0)
    contrastAction: contrastBlocked && (
      <div className="flex flex-wrap gap-x-3 px-2 ps-6">
        {series && (
          <button type="button" onClick={open(true)} className={ACTION}>
            테마 바꾸기
          </button>
        )}
        <Link to={`/profile/${profileId}?v=${doc.profileVersion}`} className={`${ACTION} flex items-center`}>
          프로필에서 보정
        </Link>
      </div>
    ),
    panel: { onTheme: series && open(false), newer: latest > doc.profileVersion ? `프로필 v${latest}가 새로 있습니다` : undefined },
  };
}
