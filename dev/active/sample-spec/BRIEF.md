# SAMPLE-SPEC BRIEF — 디자인 샘플 추출 명세 r0 (Designer)

책임 역할: Designer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-25 (영환님 "★")
worktree `~/orca/workspaces/web-builder-solution/sample-spec` · 브랜치 `k002bill2/sample-spec` · base main `7aac7b7e`(ADR-009 포함).
쓰기 경로 = `docs/design/sample/` + `dev/active/sample-spec/`만. **앱 코드·테스트·PRD·TRD·ADR·BACKLOG 수정 금지.**

## 0. 배경 (반드시 먼저 읽기)
- `docs/decisions/ADR-009-sample-extraction-only.md` — 제품 범위가 "사이트 디자인 샘플 추출 전용"으로 바뀜. 발행·호스팅 안 함. 편집기·zip은 유지·동결.
- 산출물 정의(ADR-009 1절 2): 시안 PNG · 시안 열람용 정적 HTML · 디자인 토큰 · 섹션 구성.
- 경로 A(내부, 구현됨): 레퍼런스 → 프로필 → 3안 실렌더 → PNG·정적 HTML. 경로 B(외부 URL, 미착수·ADR-009 2절 게이트 전 코드 금지).
- 병렬 레인: Newton이 외부 URL 디자인 추출의 저작권·약관 리스크를 조사 중(이 레인은 법무 판단을 하지 않는다 — 필요한 곳은 `[Newton 결과 대기]`로 표기).

## 1. 산출물 — `docs/design/sample/SAMPLE-SPEC.md` r0
1. **현행 조사 [L1 파일:줄 근거]**: 지금 앱이 사용자에게 주는 "샘플이 될 수 있는 것" 목록 — PNG(`app/src/features/studio/png/`), 정적 HTML(`staticHtml/`), 토큰(`app/src/kit/tokens.ts`·`kitTokens`·render 메시지), 섹션 구성(PageDoc). 어떤 화면·버튼에서 나오는지, 지금 토큰 파일 단독 내보내기가 있는지 없는지.
2. **샘플 산출물 포맷**: 디자인 토큰 파일 스키마 초안(JSON 권장 — 키 이름·단위·예시 1개. W3C Design Tokens 형식 호환 여부는 [L3 확인 필요]로 표기) · 섹션 구성 표기(섹션 id·변형·순서) · PNG/정적 HTML과 한 묶음(zip)으로 줄지 개별로 줄지 후보와 ★.
3. **경로 A 화면 정리**: "홈페이지 만들기/발행/운영"류 구축 약속 문구 전수 목록(파일:줄) + 바꿀 문구 제안(ADR-009 1절 6 금지 카피 기준). 편집기·React zip은 **숨기지 않음**(영환님 결정 "유지") — 다만 주 흐름에서 샘플 추출이 1순위로 보이게 할 최소 변경 후보를 적는다. 번들 예산(ADR-004 — `/studio`·`/profile`·`/catalog` 여유가 매우 작음) 영향 추정 포함.
4. **경로 B 흐름·상태(설계만)**: URL 입력 → 허용 확인(robots·약관) → 추출 → 결과(추상 특징: 팔레트·글꼴 계열·간격 리듬·섹션 구조 태그) → 내부 경로로 이어 붙이기(예: 프로필 초기값). 상태: 차단(robots 거부·로그인 필요·비허용 도메인·GDWEB/dbcut) · 실패(시간 초과·크기 초과·네트워크) · 부분 결과. 원본 이미지·로고·본문·HTML/CSS 원문은 저장·표시하지 않는다(ADR-009 2절 3). 실행 위치(서버 vs 로컬 도구)는 결정하지 않고 MQ로 올린다.
5. **수용 기준 SMP-AC-xx** (경로 A·B 분리, 각 항목에 검증 방법).
6. **MQ-SMP-xx**: 영환님 결정 필요 항목 — 각 MQ마다 후보 2~3개 + ★ 1개 + 근거. 최대 8개.

## 2. 근거 표기
[L1] 저장소 코드·문서 직접 확인(파일:줄) · [L3] 외부 일반 지식(확인 필요) · [추정] 측정 없음. ADR-007·M5-SCOPE와 같은 표기.

## 3. 마감
- `dev/active/sample-spec/PROGRESS.md`에 1~6 체크리스트, 항목마다 끝나면 갱신 후 커밋.
- `dev/active/sample-spec/REPORT.md`: 첫 줄 결론, MQ 목록 요약, 확인 필요.
- `git status --short` 빈 값. 경로 명시 커밋.

## 4. 규칙
- **git push·pull·fetch 등 원격 명령 일절 금지.** amend·rebase 금지.
- 서브에이전트 분할: 권장(1 현행 조사 ∥ 3 문구 전수 목록 — 읽기 전용 2개). 통합·작성은 메인이 직접.
- 실행 상한 약 20분. 1→2→3→4→5→6 순서, 각 항목 끝에 커밋. 남으면 REPORT에 미완 표기로 마감. 최대 60턴.
