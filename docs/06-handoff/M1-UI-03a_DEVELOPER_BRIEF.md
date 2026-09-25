# Developer 핸드오프 — M1-UI-03a: 비교 보드 도메인·데이터 계층 + 번들 예산 기준 변경

- 작성: Jarvis · 2026-09-25 KST
- 책임 역할: Developer / 실행 환경: Orca + Claude Code (`--role developer`) · 작업 공간 `m1-ui-03a`(`main`에서 분기)
- 턴 예산 **100** · 체크포인트 `dev/active/m1-ui-03a/PROGRESS.md` · 항목마다 로컬 커밋
- **80턴을 넘기면 새 작업을 멈추고, 커밋한 뒤 반드시 `dev/active/m1-ui-03a/REPORT.md`를 쓰고 커밋한다.**
- 판단 기준: ADR-003. 설계 원본: `docs/design/1a-03/SPEC.md`. 결정: `docs/decisions/ADR-005-compare-board-decisions.md`
- **이번 범위에 화면(UI 컴포넌트·`/compare` 페이지)은 없다** — M1-UI-03b에서 한다. 기존 화면 동작은 바뀌면 안 된다.

## 0. 먼저 읽을 것
1. `CLAUDE.md`, ADR-003·004·005
2. `docs/design/1a-03/SPEC.md` **전체** — 특히 2.3(12행·역할·바인딩), 3(선택 규칙 P-1~P-8, 기준 레퍼런스, 조합 규칙, 대비 C-1~C-3, 사용자 색·폰트), 4(상태 중 S-08·S-09·S-12~S-17의 데이터 측), 8(타입·저장소·매핑·데이터 공백), 9(AC)
3. 현재 코드: `app/src/features/compare/*`(트레이), `domain/reference*.ts`, `data/referenceRepository.ts`, `fixtures/*`

## 1. 범위
1. **타입** `domain/compareBoard.ts` — SPEC 8.1 그대로(열·열 문자 A~F 할당 규칙, 행 정의 12개와 역할 `pick/global/info`, picks, custom, revision, 저장 상태, 확정 상태·버전). ADR-005 Q5 `selection_mode` 포함.
2. **행 정의·셀 값** — 레퍼런스(상세 픽스처 포함)에서 12행 셀 값을 계산. 값 없음·현재 라이브러리에 없는 변형(AC-26) 표시 데이터.
3. **선택 규칙 순수 함수** — P-1~P-7(행당 1개, 재클릭 해제, info 불가, 없음 불가, 전부 선택 + 되돌리기용 이전 상태, 레퍼런스 id 저장, 열 빼기 시 해제 + 알림 문구 데이터).
4. **기준 레퍼런스·기본값·초안** — `buildProfileDraft(board, references, libraryVersion)`: 기준 레퍼런스(Hero 열), 미선택 행 기본값 표시, `section_plan`, `motion_preset` L3→L2 상한(R-07 정보), R-15 안내 조건, 결정적 `seed`(AC-07·09·10·11).
5. **`domain/contrast.ts` + `derivePalette`** — WCAG 상대 휘도, C-1~C-3 검사, 4.5:1이 되는 가장 가까운 명도 보정값(AC-12·24). 확정과 경고가 **같은 `derivePalette` 결과**를 쓴다.
6. **R-12 사업자정보 Footer 경고 데이터**(AC-13) — 대체 열 탐색.
7. **사용자 대표색 검증**(zod `#RRGGBB`, AC-14), 폰트 허용 목록(ADR-005 Q4: 확인 전 Pretendard만 활성, 나머지는 목록에 있되 비활성 플래그).
8. **저장소** `data/compareBoardRepository.ts` — 메모리 구현: `getBoard`, `savePicks(revision 조건부, 직렬화 — 역순 응답에도 최종 상태 일관, AC-23)`, `confirmProfile`(v1), `createProfileVersion`(v2…, 이전 버전 불변, AC-25), 회수·삭제 레퍼런스 처리(S-08·S-09, AC-15), `STALE_BOARD` 오류. 지연·실패를 주입할 수 있게.
9. **트레이 통합** — SPEC 1.1 "트레이 = 보드의 열 목록". 현재 `CompareTrayContext`(id 배열)를 보드 `columns`로 흡수하되 **카탈로그·상세의 기존 동작과 테스트는 그대로 통과**해야 한다(6개 제한, 알림 문구, 포커스 이동 D07 포함).
10. **ADR-004 번들 검사** — `app/scripts/check-bundle-size.mjs`가 라우트별 **첫 화면 JS 합계(gzip) ≤ 100KB**를 예산 대상으로 검사(현재 공통 청크만 대상). 공통 청크 단독 값은 참고 출력으로. 예산 초과 시 build 실패(RED 확인: 예산을 일시적으로 낮춰 실패 재현 후 원복).

## 2. 테스트 먼저
- SPEC 9절 AC 중 데이터로 검증 가능한 것: **AC-07, 08(데이터), 09, 10, 11, 12(계산), 13(데이터), 14, 15(데이터), 23, 24, 25, 26** — 각 AC ID를 테스트 이름에 넣는다.
- 대비: 픽스처 실측값(SPEC 3.4: F `#D47800` 3.24:1, D `#00A884` 3.03:1, A `#8B5E3C` 5.58:1)을 기대값으로 고정.
- AC-23: 저장소 응답 지연·역순 도착을 주입해 최종 revision·picks 일관성 확인. 검사 로직을 지우면 실패하는지 RED 확인.
- 기존 테스트 전부 통과(현재 115개).

## 3. 검증
```bash
cd app && npm run typecheck && npm run lint && npm test -- --run && npm run build
```
- 번들 검사 출력(라우트별 합계) 보고
- Codex `review --scope branch --base main`, 최대 3라운드

## 4. 금지
- UI 컴포넌트·`/compare` 페이지 구현(03b), `design/` 수정, APFS 자산, push·원격·`main` 직접 커밋, `--dangerously-skip-permissions`

## 5. 최종 보고 (파일 + 마지막 응답)
`dev/active/m1-ui-03a/REPORT.md`: 결론 → 항목 1~10 완료 여부 → AC별 테스트 매핑 → RED/GREEN 요약 → 검증 4종·번들 결과 → Codex 결과 → SPEC과 다르게 한 부분(사유) → 03b에 넘길 것 → 질문 → 커밋 해시
