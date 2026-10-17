# M4-a-2 BRIEF — 정적 zip 내보내기 구현 (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18 (영환님 "M4-a ★ 일괄" · "추천안 자동 적용")
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/m4a-impl` (브랜치 `k002bill2/m4a-impl`, base origin/main `d8e548e5`). `app/node_modules` 설치 완료.

## 정본
- `docs/design/m4a/EXPORT-SPEC.md` r1 + **8a 결정 기록**(Q1~Q19 ★: Q1 A 링크 게이트 줄 제외 · Q5 A 단일 HTML도 참조 직렬화 · Q6 B `updatedAt` · Q7 64MB · Q17 B 참조 직렬화 · Q18 A React zip 버튼 제외·zip 위 · Q19 A 글꼴 파일 분리+OFL.txt).
- 참고 구현(그대로 적용 금지 — TDD로 옮김): `dev/active/m4a-zip-spike/patches/{s1-s4-zip-writer-split-wire.patch, s2b-render-refs-mode.patch}` · REPORT.

## 범위 (EXP-AC 중 M4-a 본체 — Q1 A로 게이트 링크 줄 관련 AC는 제외, REPORT에 "M4-a-2b 이월" 표)
- CP1 store zip 작성기(`features/studio/zip/storeZip.ts`) + 단위(CRC 벡터·파서·`unzip -t`/`zipinfo` 가능하면·경로 거절·ZIP64 throw·결정적 시각 Q6).
- CP2 렌더 문서 참조 직렬화(Q17 B) — 이미지 data URI → 참조, 부모 Blob 합침 · `HTML_MAX` 상한 **유지** · 단일 HTML 경로도 같은 방식(Q5) · 기존 정적 HTML 테스트 전부 통과 · 20MB 이미지 문서 성공 단위(EXP-AC-17).
- CP3 zip 조립: `index.html` + `assets/images/*` + `assets/fonts/*.woff2` + `assets/fonts/OFL.txt` + `LICENSES.md`(구조만 — 문안 자리표시는 SPEC 3절 필드, 최종 문안은 Hemingway 후속) · 파일명 규칙 · `ZIP_MAX` 64MB.
- CP4 금지 패턴 검사 확장(SPEC 4절 — zip 파일 목록 허용표·외부 href 금지 Q11·브랜드 0 Q10) · 생성기 안 링크 검사 F-11·F-12.
- CP5 UI: `ExportButtons` 버튼 2개(1 = 정적 사이트(zip), 2 = HTML 파일 1개) · React zip 버튼 제외(Q18) · 상태(생성 중·성공·실패 분류) 문구는 조작 뒤 청크 · 성공 Callout 보조 문장(Q14).
- 범위 밖: 게이트 링크 줄(M4-a-2b) · React zip(M4-b) · LICENSES 최종 문안 · axe.

## 예산 — 결정 1
- `/studio` 정규화 128.66 · 복원 131.64(main 기준, row-reason 머지 시 131.65) · raw 129.96 → **진입 증분 0**. 새 모듈은 조작 뒤 목록(`STUDIO_AFTER_ACTION`). 렌더 문서 JS 84.22/90.
- 진입이 +0.01이라도 나오면 감량 1회(동작 변화 0 수단만) → 그래도 남으면 **멈추고 수치 보고**(개정 18 상신은 Jarvis). 기준선 파일 수정 금지.

## 규칙
- TDD(CP마다 RED 로그 `dev/active/m4a-impl/logs/`) · 기존 단언 약화·skip 0 — 버튼 목록·형식 변경으로 바뀌는 단언은 SPEC 7절 근거와 이전/이후 표.
- 새 의존성 0. 엔진·PageDoc·레코드·스키마 변경 0.
- Ego Lite(마지막 1회): build + preview `--port 4395 --strictPort` — 이미지 2장·글꼴 있는 문서로 zip 내려받기 → `unzip -l`/`unzip -t` · 압축 푼 폴더 `file://`로 열어 이미지·글꼴 로드 · 단일 HTML도 1회 · 1280·390 버튼 배치. 마지막 커밋 직전 서버 종료 → `lsof -nP -iTCP:4395 -sTCP:LISTEN` 0 기록. IDB 삭제·`finish({keep:[]})`.
- fresh typecheck·lint·test·build(전 라우트 + 렌더 문서). Codex review 1회(`--scope branch --base d8e548e5`).
- 쓰기 경로: `features/studio/{zip,staticHtml,png}/**`·`features/studio/exportFlow*`·`components/studio/Export*`·`render/**`(참조 직렬화)·`app/src/build/**`(조작 뒤 목록)·`dev/active/m4a-impl/`. **금지**: `features/projects/**`·`features/studio/save/**`·`components/studio/{PngSave,StudioLayout}.tsx`(병렬 `rs8-ux-fix` 경로 — 겹치면 멈추고 보고)·docs·기준선.
- 명시 경로 커밋, amend·rebase·push·merge 0. 첫 3턴 BRIEF·PROGRESS 커밋. **CP2 완료 시점에 REPORT 초안 커밋**, 이후 CP마다 PROGRESS 커밋. 마감 전 `git status --short` node_modules 외 빈 값.
- 서브에이전트 분할: 권장(쓰기 1개 `isolation: worktree` — CP1 storeZip 단위 ∥ 메인 CP2 렌더 참조 직렬화; 통합·게이트는 메인).
- 최대 110턴. CP2 50턴 전 · 95턴부터 새 구현 중단 → Ego Lite·Codex·게이트·REPORT. 턴 부족 시 마지막 완료 CP까지 커밋, 남은 것 BLOCKED.
