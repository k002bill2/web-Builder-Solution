# M2B-0A REPORT — 킷 명세: 바깥 11변형 + 루브릭

- 브리프 `docs/06-handoff/M2B-0A_KIT-SPEC-BOUND_DESIGNER_BRIEF.md` · 계획 `docs/04-plan/M2B_PLAN.md` · 시작 커밋 `a3bd614` · 2026-10-04 · 서브에이전트 0

## 1. 산출물
| 파일 | 내용 |
|---|---|
| `docs/design/m2b/SPEC-BOUND.md` | 0절 상속 선언 · 킷 내부 변경 D-1~D-4 · 11변형(B-1~B-11) 각 B1 1~7 + B2 루브릭 표(10~11항) + B3 KB-AC · 4절(KB-AC 01~35 · QB-1~14 · 예산 추정 · MQ-B1~6) · 부록 A · 변경 이력 r0~r4 |
| `docs/design/m2b/bound/mock-bound.html` | 특이점 시안(transparent×center · two-tier · grid · image · map footer · minimal-biz). 킷 토큰 역할만, 시험 팔레트 1블록, 외부 자원 0 |
| `docs/design/m2b/bound/logs/` | `budget-proxy.txt`(CSS 문맥 증가분 L2) · `contrast_calc_m2a.rerun.txt`(m2a 대비 스크립트 재실행) · `mock-dom-measure.txt`(시안 3폭 DOM 실측) · `codex-adversarial.raw.txt`(Codex 원문) · `server-4339.log` |

커밋: `a376d88`(골격) → `c371a21`(변형 4) → `3df19fb`(변형 8) → `1fba2cc`(변형 11 + 4절) → 마감 커밋(Codex 반영 · 시안 · REPORT).

## 2. 루브릭 요약 (TR-POL-04 · 항목 ①~⑧ + ⑨ 데이터 계약 · ⑩ 내보내기 동일성 · 필요 시 ⑪)
| 변형 | 주의 항목 | 나머지 |
|---|---|---|
| header `sticky-hamburger` | ② 1280에서도 메뉴 숨김 → 발견성 낮음(CTA 슬롯 없음) | PASS |
| header `sticky-two-tier` | ④ 보조 목록 랜드마크 아님 · 앵커 여백 `:has()` 의존(MQ-B2·B5) | PASS |
| header `transparent` | ⑪ "투명" = 겹침 아닌 면 이음, 이미지 hero 앞에서는 `bg` 바(MQ-B1) | PASS |
| hero `split` · `center` · `text` | — | 전부 PASS |
| hero `grid` | ⑪ 슬롯 1개라 사진 타일 1 + 색 타일 2(MQ-B3) | PASS |
| hero `image` | ⑪ 1280 첫 화면에 CTA가 안 들어올 수 있음 [L3] — QB-9로 확인 | PASS |
| footer `biz-extended-map` | — | PASS(지도 외부 요청 0 · 주소는 글자 정본) |
| footer `minimal` | ① R-12로 단독 확정 불가(확정 때 `minimal-biz`로 바뀜, L1 `memoryBoardConfirm.ts`) | PASS |
| footer `minimal-biz` | — | PASS |

## 3. MQ (Jarvis 기록 요청)
- MQ-B1 `transparent` 면 이음·비고정 승인 · MQ-B2 보조/하단 링크 대상 슬롯 생기면 랜드마크 승격 · MQ-B3 `hero/grid` 이미지 슬롯 추가 여부 · MQ-B4 지도 이미지 권리 안내(편집기) · MQ-B5 two-tier 앵커 여백 방식 · MQ-B6 스크롤 연동 모션 스크립트 허용 여부. 상세 = SPEC 4.4.
- 공통 규약(m2a 0절) 변경 요청 0.

## 4. 예산 추정 (렌더 문서 gzip, L3 — 근거 SPEC 4.3)
- 11변형 합계 **JS 약 +2.1KB · CSS 약 +1.4KB** → JS 80.12 → 약 82.2 / 90(멈춤선 89.70) · CSS 6.32 → 약 7.7 / 30.
- 0B 본문 12변형이 같은 여유 9.58KB를 나눠 씀 — 단순 합산 약 85.3KB [L3]. M2B-1은 `sticky-two-tier` 시제품으로 먼저 실측.

## 5. 다르게 한 곳 (라벨·목업 대비, ADR-003)
| 곳 | 다르게 한 것 | 사유 |
|---|---|---|
| header `transparent` | hero 위 겹침 대신 in-flow + hero 맨 위 면과 같은 색 · 비고정 | 이미지 위 글자 대비는 게이트가 판정 불가(m2a 0.3) |
| hero `grid` | 사진 반복 타일 대신 사진 1 + 토큰 색 타일 2 | 슬롯 1개 · `alt` 중복 회피 |
| hero `image` · `split` | 390 이미지 비율 4:3 띠 | 세로형이 첫 화면 전체를 차지하는 것 방지 |
| footer `biz-extended-map` | 지도 = 이미지 슬롯·그라디언트만(지도 서비스 0) | 외부 요청 0 · 권리 경계 |
| footer `minimal`·`minimal-biz` | `bg` 면(밝은 띠) + 위 구분선 | 확장형(`ink`)과 구분 · 확정 전후 같은 모양 |

## 6. 남은 위험
1. 시안 스크린샷 미취득 — ego-browser `Page.captureScreenshot`이 매번 시간 초과(뷰포트 900·전체 길이 모두). 대신 DOM 실측을 남겼다(`mock-dom-measure.txt`). 시각 판정은 M2B-1 QB 캡처로.
2. 예산은 L3 추정 — 실제 증가는 M2B-1 시제품 실측으로 확정.
3. `hero/image` 21:9의 1280 첫 화면 CTA 노출 [L3].
4. `sticky-two-tier` 앵커 여백은 `:has()` 미지원 브라우저에서 축소.
5. Codex 검토 중 jsdom 실행 검증은 Codex 쪽 의존성 부재로 실패(명세 diff 검토는 완료).

## 7. 검증
| 명령 | 결과 |
|---|---|
| `grep -nE '#[0-9a-fA-F]{3,6}\b\|[0-9]px\|apfs' docs/design/m2b/SPEC-BOUND.md` | 0줄 (hex·px·apfs 0). `http`는 KB-AC-23의 "외부 스킴 0" 문구 1곳뿐 |
| `python3 -B docs/design/m2a/contrast_calc_m2a.py` | exit 0, 22줄 → `bound/logs/contrast_calc_m2a.rerun.txt` |
| ego-browser 시안 3폭 DOM 실측 | 1280·768·390 가로 넘침 0 · transparent header = hero 면 같은 색 · 겹침 0 · `position: static` · two-tier 보조 줄 flex/flex/none · 390 시트 순서 주→보조 · grid 타일 3/3/1 · image 비율 2.333/1.778/1.333 · 미디어가 `h1` 위 |
| Codex 적대적 검토 1회 (`adversarial-review --scope branch --base a3bd614`) | needs-attention 2건 → **둘 다 반영**(r3): [P1] 스타일 선택자가 정적 HTML에서 지워지는 `data-section`에 의존 → 변형 클래스로 + KB-AC-35 (L1 `staticMarkup.ts:15` `KEPT_DATA` 확인) · [P2] KB-AC-09 바·시트 대비 분리 · 같은 원인을 hero·footer 선택자·KB-AC-23 이미지 스킴까지 확장 반영(r4) |
| `git diff --stat a3bd614 -- app design` | 0 (앱·디자인 원본 수정 0) |
- typecheck·lint·test·build: 코드 변경 0이라 실행하지 않음(문서 레인).

## 8. 서버
- 127.0.0.1:4339 `python3 -m http.server`(PID 69408, `docs/design/m2b/bound/` 제공) → 시안 실측 뒤 `kill 69408`.
- `lsof -nP -iTCP:4339 -sTCP:LISTEN` 결과 **0줄**(exit 1). 포트 4341(0B) 사용 0.
