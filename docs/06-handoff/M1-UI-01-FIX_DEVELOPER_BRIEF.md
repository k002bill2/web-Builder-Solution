# Developer 핸드오프 — M1-UI-01-FIX: QA-1A-01 결함·접근성 수정 + 번들 분할 + 상세 스크롤

- 작성: Jarvis · 2026-09-25 KST
- 책임 역할: Developer / 실행 환경: Orca + Claude Code (`--role developer`) · 작업 공간 `m1-ui-01-fix`(`main` @ `0ef57de`에서 분기)
- 턴 예산 100 · 체크포인트 `dev/active/m1-ui-01-fix/PROGRESS.md` · **항목 그룹마다 로컬 커밋**
- 병렬 상황: QA가 `qa-1a-02`에서 1a-02(상세)를 `main` @ `0ef57de` 기준으로 검증 중이다. QA는 코드를 바꾸지 않는다.

## 0. 먼저 읽을 것
1. `CLAUDE.md`, `docs/decisions/ADR-002-brand-separation.md`
2. **`docs/qa/1a-01/REPORT.md` 전체** — 결함 재현 절차·캡처 경로
3. `dev/active/m1-ui-01/PROGRESS.md`, `dev/active/m1-ui-02/REPORT.md`(13번 스크롤 위치, 병합 주의)
4. 목업 `design/claude-design-handoff/project/Design Studio Mockups.dc.html` 55~125행(1a-01) — 간격 기준

## 1. 판정 정정 (Jarvis)
QA 보고서 5절의 "사용자 보류 결정(전체 화면 구현 후 처리)"은 **영환님 결정 기록이 없다.** 해당 접근성 3건을 P3 결함 **A01~A03**으로 이번 범위에 포함한다.

## 2. 범위 (이 순서로)

### 그룹 A — 1a-01 시각 결함 (P3)
| ID | 내용 | 수용 기준 |
|---|---|---|
| D04 | 필터 레일 체크박스 행 간격 약 32px → 목업 약 30px, 그룹 간격도 목업 기준 | 1280에서 레일 행 간격·그룹 간격이 목업 수치와 ±1px |
| D05 | 결과 탭 라벨·밑줄이 1~2px 아래 | 탭 높이·밑줄 위치가 목업과 ±1px |
| D06 | 390 폭 제목이 어절 중간에서 줄바꿈 | 한국어 텍스트 전역 `word-break: keep-all`(제목·본문), 긴 영문·URL은 `overflow-wrap: anywhere`로 넘침 방지 |

### 그룹 B — 키보드 접근성 (P3)
| ID | 내용 | 수용 기준 |
|---|---|---|
| D07 | 트레이 칩 X를 키보드로 누르면 포커스가 body로 사라짐 | 제거 후 포커스가 다음 칩 → 이전 칩 → 트레이 영역(마지막 하나면) 순으로 이동 |
| D08 | 카드 이름 링크 포커스가 밑줄뿐 | 다른 컨트롤과 같은 `--focus-ring` 적용 |
| A01 | 모션 세그먼트(radiogroup) 4개 모두 Tab 정지점, 방향키 무반응 | roving tabindex: 그룹당 Tab 정지점 1개, ←/→(↑/↓)로 이동·선택, Home/End |
| A02 | 결과 탭 3개 모두 Tab 정지점 | tablist 패턴: Tab 정지점 1개, ←/→ 이동, 선택 시 `aria-selected` |
| A03 | 본문 바로가기 없음(첫 카드까지 Tab 약 40회) | 첫 Tab에 나타나는 "본문으로 건너뛰기" 링크 → `main` 포커스. 카탈로그에는 "결과로 건너뛰기"도 추가 가능 |
- 상세 화면(1a-02)의 Tabs·SegmentedControl도 같은 DS 컴포넌트를 쓰면 함께 적용된다. 동작을 테스트로 확인한다.

### 그룹 C — 성능: 초기 JS ≤ 90KB gzip (TRD 8절)
- 현재 `index-*.js` gzip 113.9KB. 라우트 단위 `React.lazy` 분할(카탈로그·상세·자리표시)과 벤더 청크 분리로 **초기 로드 JS gzip ≤ 90KB**.
- 폰트는 이미 자체 호스팅(woff2 4개). 초기 화면에서 필요한 웨이트만 `preload` 할지 판단하고 근거를 기록.
- 측정: `npm run build` 출력의 초기 청크 합계. 자동 확인을 위해 `scripts/check-bundle-size.mjs`(또는 vitest 테스트)로 **예산 초과 시 실패**하게 만든다.

### 그룹 D — 상세 스크롤·테스트 보완
- 라우트 이동 시 스크롤을 **명시적으로** 제어: 상세 진입·유사 레퍼런스 이동은 맨 위, 카탈로그 필터 변경은 현재 위치 유지, 브라우저 뒤로 가기는 이전 위치 복원.
- `dev/active/m1-ui-02/REPORT.md`가 밝힌 테스트 한계 보완: "유사 레퍼런스로 이동하면 이전 내용이 남지 않는다"를 **id 일치 검사를 지우면 실패하는** 테스트로 다시 쓴다(지연된 저장소 응답으로 경쟁 상태를 재현). RED 확인 필수.

## 3. 테스트 먼저 (RED/GREEN을 PROGRESS.md에 기록)
- D06: 제목 요소에 `keep-all` 적용 확인(계산 스타일)
- D07·A01·A02·A03: Testing Library `userEvent.keyboard`로 포커스 이동·방향키·Tab 정지점 수 검증
- D08: 카드 링크 포커스 클래스/스타일 확인
- C: 번들 예산 검사 스크립트가 현재 상태에서 **실패**(RED) → 분할 후 통과
- D: 경쟁 상태 테스트 RED(검사 제거 시 실패 확인) → 원복 GREEN, 스크롤 동작 테스트
- D04·D05는 수치 조정이라 단위 테스트 대신 **시각 확인 캡처**(before/after, 1280)를 `dev/active/m1-ui-01-fix/screens/`에 남긴다.

## 4. 검증
```bash
cd app && npm run typecheck && npm run lint && npm test -- --run && npm run build
```
- 번들 예산 검사 결과(초기 JS gzip KB)를 보고에 포함.
- 브라우저 확인(ego-browser 등, 127.0.0.1): 1280·390에서 카탈로그·상세, 키보드만으로 필터→카드→트레이 조작, 콘솔 오류 0. 서버는 끝나면 종료.
- Codex 리뷰 `--scope branch --base main`, 최대 3라운드.

## 5. 금지
- `design/` 수정, APFS 브랜드 자산, 범위 밖 기능 추가(1a-03 이후 화면), push·원격·`main` 직접 커밋, `--dangerously-skip-permissions`

## 6. 최종 보고 — 파일로도 남길 것
`dev/active/m1-ui-01-fix/REPORT.md` 작성·커밋 후 같은 내용을 마지막 응답으로 출력:
결론 → 항목별(D04~D08, A01~A03, C, D) 완료 여부와 근거 → 변경 파일 → RED/GREEN 요약 → 검증 4종 + 번들 예산 결과 → Codex 결과 → 목업과 다른 부분 → 질문 → 커밋 해시
