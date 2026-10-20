# B-M2B-05 BRIEF — 3안 제목 비율 축 전달: 영향 범위 명세 (Designer, 문서만)

책임 역할: Designer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-20 (영환님 "1" — ★A: 영향 범위 명세 먼저, 계약 변경 단계에서 재승인)
워크트리: 이 디렉터리 (base origin/main `cedbf587`).
근거: BACKLOG B-M2B-05 · `docs/design/m2b/MQ-M2B5.md` · `docs/design/m2b/SPEC-COMPARE3.md` F10 · `docs/design/2a-04/SPEC.md:468`(typeScale) · 코드 `generation.ts`·`docKitTokens`·`render/protocol.ts` `isKitTokens` · 저장 검증(`validatePageDoc`·`profileShape.ts`) · 내보내기(정적·React zip `site.json`).

## 산출: `docs/design/m2b/TYPESCALE-SPEC.md`
1. 현재 흐름 표: 3안 `axes.typeScale` 생성 → 비교 화면 렌더 → "이 안으로 편집 시작" → PageDoc/프로필 → `docKitTokens` → 렌더·PNG·정적 HTML/zip·React zip. 어디서 값이 사라지는지 파일:줄로.
2. 전달 방안 비교(최소 2안, ★ 포함): 예) A 프로필 버전에 typeScale을 기록(프로필 = 단일 출처) · B PageDoc에 필드 추가 · C 편집 시작 시 프로필 새 버전 파생. 각 안의 **변경 계약 목록**(엔진 `engine/contracts/*` · 저장 스키마/검증 · 가져오기 `profileShape` 범위 · 렌더 프로토콜 · 내보내기 `site.json` v1 · 마이그레이션·기존 데이터 호환) · 테스트 영향 · 예산 영향(진입 KB 추정) · 되돌리기 쉬움.
3. 사용자에게 보이는 변화: 비교에서 본 B·C안 비율이 편집기·내보내기에 그대로 나오는지, 편집기에서 비율을 바꿀 수 있는지(새 UI가 필요하면 범위 밖으로 분리).
4. 수용 기준 초안 TS-AC-xx · 구현 단계 분할(계약 변경 단계 = 사용자 재승인 지점 명시).
5. 설계 질문 TSQ-xx(★). **엔진 계약·저장 스키마·새 의존성·예산 상향은 "사용자 질의"로 분리**(이 레인에서 결정하지 않음).

## 규칙
- 명세만 — 앱 코드 0, 외부 리서치 0. Codex adversarial 1회(`--help` 금지). 서브에이전트 분할: 권장(읽기 전용 코드 흐름 조사 2개 — 생성·편집 시작 경로 / 렌더·내보내기 경로).
- **git push·pull·fetch 금지.** 첫 2턴 BRIEF·PROGRESS 커밋, SPEC 초안 12턴 안. 마감 전 `git status --short` 빈 값. 최대 45턴, 36턴부터 마감.
