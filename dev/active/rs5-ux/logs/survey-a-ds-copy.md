# 조사 A — DS 컴포넌트·저장 상태 문구 (code-explorer, 읽기 전용, 16 tool)
경로 기준 app/src/. 메인이 사용한 핵심 사실만 압축 보존(원문 요약).

- DS(components/ds/): Avatar·Button·Callout·Checkbox·Chip·Icon·Select·SegmentedControl·Tag·TextField·rovingFocus. Dialog/Toast/Badge/Banner 없음.
- Callout: tone info|warning|negative, title(h3) 필수, action 슬롯, role 없음(정적 영역) — 알림은 래퍼 role=alert(ExportRetryAlert) (ds/Callout.tsx:5,13-15,32-38)
- Button: variant primary|secondary|assistive|outline, size sm|md|lg (ds/Button.tsx:5-6,36-45)
- 대화상자: 네이티브 <dialog>+showModal(), focus trap=showModal, 바깥 클릭 닫기 없음, 연타 방지 aria-disabled.
  - DeleteProjectDialog 초기 포커스 "취소"[data-cancel], 안쪽 role=alert(key 재낭독), 부모가 트리거로 포커스 복귀 (components/projects/DeleteProjectDialog.tsx:37-47,86-90)
  - RestartDialog 초기 포커스 제목 h2 tabIndex=-1, unconfirmed/unknown 때 주 버튼 "다시 시도"·"편집기 열기" 숨김 (features/profile/RestartDialog.tsx:52-57,80-100,120-160)
- phase: idle|dirty|saving|saved|failed|offline|stale (features/studio/useAutosaveScheduler.ts:50)
- 문구(features/studio/saveStatusText.ts:20-65): dirty "저장 전 변경 있음" · saving "저장 중…" · saved memory "이 탭에 저장됨 · {시각}" · saved local "이 브라우저에 저장됨 · {시각}" · failed "저장하지 못했습니다" · offline "오프라인 — 연결되면 저장합니다" · stale "다른 곳에서 이 문서가 바뀌었습니다". 알림: stale/실패=alert, 오프라인/회복=status("다시 저장했습니다")
- SaveStatus: 상태 글자는 라이브 영역 밖, failed일 때만 Button outline sm "다시 저장"(save.retry), alert는 sr-only <p role=alert> 1곳 (components/studio/SaveStatus.tsx:54-66). 편집 알림 role=status aria-label="편집 알림" 화면당 1개 (StudioPanels.tsx:35)
- ConflictCallout: Callout warning, 제목 "다른 곳에서 이 문서가 바뀌었습니다(r12)", 본문 "내 편집은 그대로 두었습니다", 버튼 "내 편집으로 저장"(primary sm) · "다른 편집 불러오기"(outline sm) → useDocSave.resolve → repository.resolveConflict(보존 스냅샷+저장 한 트랜잭션) (ConflictCallout.tsx:20-37, useDocSave.ts:97-112). 실패 "충돌을 해결하지 못했습니다 — 다시 골라 주세요"(StudioLayout.tsx:116-120, 유추 문장)
- 배치: StudioToolbar, 폭 <1024에서 h1 아래 subline 슬롯 (StudioLayout.tsx:431,468,513, StudioToolbar.tsx:12-21)
- 수동 저장 버튼 없음. 저장 수단 = 자동 저장(2s/30s) · failed "다시 저장" · 앱 안 링크 leave()(실패 시 이동 보류) · 스냅샷 "지금 상태 저장" · online 이벤트
- INFRA 사유 문구(data/persistence/infra.ts:10-29): READ_ONLY_TAB "다른 탭에서 편집 중입니다 — 이 탭의 변경은 저장하지 않습니다" · STALE_TAB "다른 탭에서 바뀐 내용이 있습니다 — 새로고침한 뒤 편집하세요" · CLEARED_TAB "이 브라우저 데이터가 지워졌습니다 — 새로고침하세요" · quota "브라우저 저장 공간이 부족합니다". 편집기 UI에는 사유 미노출(useDocSave.ts:73-74 문구 매칭)
- needsUnloadGuard: memory는 항상, 그 외 idle·saved 제외 (useAutosaveScheduler.ts:67-70)
- /projects: memory 캡션 "이 브라우저에 저장할 수 없어 새로고침하면 프로젝트가 사라집니다"(pages/ProjectsPage.tsx:48-52) · BrowserStorageSection Callout warning issueText(storageCheck.ts:12-19) · 저장소 알림 role=status sr-only (BrowserStorageSection.tsx:173) · 프로젝트 알림 role=status (ProjectsPage.tsx:244-246)
- /profile: RESTART_TEXT(features/profile/restartText.ts:24-52) unconfirmed/unknown 문구, CandidatesSection 실패 Callout negative + role=alert 래퍼 + outline sm "다시 시도" (CandidatesSection.tsx:257-263)
- 문구 SSOT: 전역 i18n 없음, 기능별 *Text.ts. 편집기 저장 문구 정본 = features/studio/saveStatusText.ts
- 미조사: Tag/Chip/SegmentedControl role, Clear/Import/Export 대화상자 세부 문구
