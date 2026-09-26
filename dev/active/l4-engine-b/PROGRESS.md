# L4b 엔진 — PROGRESS

브리프 `docs/06-handoff/L4B-ENGINE_DEVELOPER_BRIEF.md` · 브랜치 `k002bill2/l4-engine-b` · 기준 `9c1891a`

## 1. 범위
- [x] 번들 기준 빌드(`bundle-before.txt`, CSS·자산 목록 보관) — sampleTheme 없이 재빌드해도 CSS `index-Bz-DRn5S.css` 동일 확인
- [x] runGate RED (`gate/*.test.ts`, tdd-log) — 모듈 없음 4파일 실패
- [x] runGate GREEN — 8줄(대비·대체텍스트·헤딩·필수 섹션·모션·SEO·글자 수·성능) · 결정성 · 입력 불변 · 7:1 불가 조합 throw 0
- [x] 문장 SPEC 대조 테스트 + 유추 문장 목록
- [x] createDocFromCandidate RED → GREEN (정상·해시 동일·R-01/R-02 거부·모르는 변형 거부·validatePageDoc)
- [x] 코드 커밋 (`git commit -- <경로>`) — 1ed3e5c · 46b20ed

## 2. 검증
- [x] typecheck · lint · build — exit 0
- [x] 전체 테스트 1회 — 962 통과
- [x] engine 테스트 3회 — 253 ×3
- [x] 번들 변화 0(CSS 내용·자산 해시) · 화면 engine import 0
- [x] Codex 리뷰 1회 (`--scope branch --base 9c1891a`) · 반영 — 지적 0

## 3. 보고
- [x] REPORT.md (9363839 초안 + 7·8절) (커밋·RED/GREEN·테스트 이름·규칙별 판정 표·유추 문장·번들·Codex·위험·Q-17~)
- [x] REPORT 커밋

## 결정 메모 (설계 질문 후보, REPORT 9절로)
- Q-17 createDocFromCandidate 인자: plan에 libraryVersion·generatorVersion 추가, 세 번째 인자 DocStart{projectId, updatedAt}
- Q-18 초기 모션 = min(L1, 정의 상한) (프리셋 인자 없음)
- Q-19 GateIssue.severity(block|warn) 추가 · 목적 출처 = theme.purpose (adjustments.purpose 중복)
- Q-20 R-03 후반 1/3 = 본문(Hero 포함) index ≥ n - ceil(n/3), 문의 섹션 1개 이상이 그 안
- Q-21 픽스처 sectionPlan 변형(about/split 등)이 엔진 레지스트리에 없음 → createDoc UNKNOWN_VARIANT (composer 매핑 필요)
- Q-22 모르는 변형 섹션의 게이트 판정 = 필수 섹션 줄 R-01 차단
- Q-23 R-07 모션 = 인스턴스 motion 값 기준
- 번들: 첫 GREEN 빌드에서 CSS 변화(`.ordinal` — createDoc 변수명이 Tailwind 유틸리티로 스캔됨, L4a Q-6 재발) → `nth`로 이름 변경 후 변화 0
- 변이 검사 2건(후반 1/3 ceil→floor · proposeCorrections 호출) 모두 테스트가 잡음(tdd-log)
