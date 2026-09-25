# Developer 핸드오프 — M1-UI-03b: 비교 보드 화면 `/compare`

- 작성: Jarvis · 2026-09-25 KST
- 책임 역할: Developer / 실행 환경: Orca + Claude Code (`--role developer`) · 작업 공간 `m1-ui-03b`(03a가 합쳐진 `main`에서 분기)
- 턴 예산 **110** · 체크포인트 `dev/active/m1-ui-03b/PROGRESS.md` · 단계마다 로컬 커밋
- **90턴을 넘기면 새 작업을 멈추고, 커밋한 뒤 반드시 `dev/active/m1-ui-03b/REPORT.md`를 쓰고 커밋한다.**
- 판단 기준: ADR-003(기능·사용성 → 일관성 → 목업, px는 기준 아님). 설계 원본: `docs/design/1a-03/SPEC.md`. 결정: ADR-005(추가 결정 D1~D3 포함)
- 도메인·데이터 계층은 03a에서 완성됨 — **새 도메인 규칙을 만들지 말고 03a API를 연결**한다. 부족하면 최소 확장하고 REPORT에 사유.

## 0. 먼저 읽을 것
1. `CLAUDE.md`, ADR-003·004·005
2. `docs/design/1a-03/SPEC.md` 전체 — 특히 1(흐름), 2(정보 구조), 4(상태 S-01~S-18), 5(반응형), 6(접근성 A-1~A-12), 7(컴포넌트), 9(AC), 10(목업과 다른 부분)
3. `dev/active/m1-ui-03a/REPORT.md` "03b에 넘길 것" 절 — 연결 지점: `useCompareTray().board`, `getComparison`, `togglePick`·`pickAllFrom`, `picksSaver.save`, `buildProfileDraft`, `evaluateBoardWarnings`, `confirmAvailability`, 알림 문구 데이터
4. 기존 컴포넌트: `components/ds/*`, `LoadingState`, `RouteErrorBoundary`, `rovingFocus.ts`, `CompareTrayBar`

## 1. 범위 (단계 = 커밋 단위)
1. **DS `Callout`** + 아이콘 5종(핸드오프 `assets/icons/`에서 복사만, `design/` 수정 금지).
2. **`PickButton`·`ColumnHeader`·`ComparisonTable`** — A-1·A-2·A-3·A-5(가로 전용 roving 변형 `rovingFocus.ts`에 추가, ↑/↓ 무시)·A-6. 5열 이상 가로 스크롤 컨테이너(`tabIndex=0`, `aria-label`), 행 머리글 고정.
3. **`DraftPanel`·`DraftItem`·`CustomStyleFields`** — 기본값 표시, 경고 Callout과 "적용" 버튼, 대표색 zod 검증(`aria-invalid`), 폰트 Select(ADR-005 D1-갱신: Pretendard·Noto Sans KR·Noto Serif KR **3종 모두 활성** — `domain/fonts.ts`의 비활성 플래그 해제, 테스트 갱신. 이 화면은 폰트 파일을 새로 싣지 않고 이름·견본 텍스트만 보여 준다), 초안 비우기·되돌리기(S-17), 확정 버튼 `aria-disabled` + 이유(A-8), 알림 영역(A-4).
   - D2: Footer 항목에 "확정 시 사업자정보 확장형으로 바뀝니다" 미리 표시.
4. **`CompareBoardPage`** (`/compare`, `React.lazy`) — 상태 S-01~S-18 분기, 자동 저장 캡션(S-12), 확정 흐름(S-13~S-16, 성공 시 `/profile/:id` — 대상 화면은 현재 자리표시로 충분), 진입 시 `document.title` + `h1` 포커스(A-7).
   - D1: 허용 목록 **밖** 폰트 셀만 "라이선스 확인 중" + 선택 버튼 없음(현재 픽스처 폰트는 모두 목록 안).
   - S-08: 카탈로그에서 뺀 열의 안내를 돌아왔을 때 한 번 보여줄지 결정하고 사유 기록(03a 넘김 사항).
5. **반응형** — ≥1280 표 + sticky 패널, 768~1279 표 + 하단 `DraftSummaryBar`, <768 `ComparisonAccordion`(A-11, 처음엔 Hero만 펼침, 표 의미 쓰지 않음). 문서 가로 넘침 0.
6. **진입 경로** — 비교 트레이의 "비교하기"(또는 기존 진입 버튼)가 `/compare`로 이동. "레퍼런스 추가"는 `/catalog`로만(AC-22).
7. 03a 넘김 정리: 사용하지 않게 된 `compareTray.ts#addToTray`·`removeFromTray` 처리 여부 판단(삭제 시 테스트 영향 확인).

## 2. 테스트 먼저
- SPEC 9절 **[V] 태그 AC 전부**(AC-01~20, 22~26 중 03a에서 데이터만 검증한 것은 **화면 수준**으로 추가 검증). 테스트 이름에 AC ID.
- AC-19 키보드(행당 Tab 1회, ←/→ 이동), AC-17 연타 1회 호출, AC-23 저장 중 확정 차단은 컴포넌트 테스트로.
- AC-21([Q] 반응형 캡처)은 QA 몫 — 이번에는 브라우저로 1280·768·390을 한 번씩 직접 확인하고 스크린샷을 `dev/active/m1-ui-03b/screens/`에 남긴다(127.0.0.1만, 끝나면 서버 종료).
- 기존 테스트 전부 통과(현재 235개). `noHardcodedStyle`·`brandIsolation` 가드 유지.

## 3. 검증
```bash
cd app && npm run typecheck && npm run lint && npm test -- --run && npm run build
```
- 번들: `/compare` 첫 화면 합계 **≤ 100KB gzip**(ADR-004). 대비 계산·zod는 `/compare` 라우트 청크에만. 카탈로그·상세 합계가 늘지 않았는지 기준선(96.67/94.82KB)과 비교해 보고.
- Codex `review --scope branch --base main`, 최대 3라운드.

## 4. 금지
- 새 도메인 규칙 발명(SPEC에 없으면 질문으로), `design/` 수정, APFS 자산, URL 입력 필드, push·원격·`main` 직접 커밋, `--dangerously-skip-permissions`, 0.0.0.0 바인딩

## 5. 최종 보고 (파일 + 마지막 응답)
`dev/active/m1-ui-03b/REPORT.md`: 결론 → 단계 1~7 완료 여부 → AC별 테스트 매핑 → RED/GREEN 요약 → 검증 4종·번들 → 반응형 스크린샷 경로 → Codex 결과 → SPEC과 다르게 한 부분(사유) → QA에 넘길 것(AC-21 등) → 질문 → 커밋 해시
