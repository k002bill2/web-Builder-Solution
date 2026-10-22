**판정: B-M2B-05d = PASS(R2a — C 67.3392px·1.333rem ≠ A 48.8288px·1.25rem, 둘 다 계산식 일치) · B-SEC-09 ②④ = BLOCKED(R2b — 정적 zip 미확보: 품질 게이트 차단, 통과 경로가 B안 편집 시작에서 멈춤)**

# RELEASE-CHECK-LIVE QA-REPORT (Chromium · ego-browser) — 2026-10-22

## 1. B-M2B-05d — TS-AC-13 캔버스 제목 font-size

| 항목 | 값 | 근거 |
|---|---|---|
| 프로필 | A 모던 카페 전부 선택 → 프로필 카드 `비율 1.25` | `logs/d05-run-C.txt` 3행 |
| 3안 카드 비율 | A 1.25 · B 1.2 · C 1.333 | 같은 행 |
| 선택 안 | C(1.333) → `/studio/project-3` | `logs/d05-run-C.txt` |
| 캔버스 h1(render.html OOPIF, 1280) | **67.3392px**, `--site-t1` **1.333rem**, root 16px | `logs/d05-oopif2-C.txt`(원본 남아 있음 — Jarvis 정정: `67.3392px`·`1.333rem` 1건 grep 확인) |
| 계산식 | h1 = `--site-t5` = 1.333^5 rem → 16×4.2087 = 67.339px (일치) · 프로필 1.25면 48.828px | python 계산 |
| A안 대조 (1차) | **미취득** — 재실행 시 비교 보드 `전부 선택` 버튼 0개(비교 목록 메모리/저장 상태 토글 추정) | `logs/d05-run-A.txt` |
| A안 대조 (R2a) | 선택 안 A(1.25, 카드 문구 "비율 1.25") → `/studio/project-4` · 캔버스 h1 "아침을 여는 한 잔의 커피" **48.8288px**, `--site-t1` **1.25rem**, `--site-t5` 3.0518rem, root 16px, 1280 | `logs/r2a-A3.txt` · `scripts/r2a-A3.mjs` |
| A 계산식 | 1.25^5 × 16 = 48.828125px (렌더 48.8288px, 반올림 차 0.0007px 일치) · C 1.333^5 × 16 = 67.3396px (렌더 67.3392px 일치) | `logs/r2a-calc.txt` |
| **판정 (R2a)** | **PASS** — C 67.3392px ≠ A 48.8288px, `--site-t1`이 선택 안 비율(rem)을 따름, 둘 다 계산식과 일치 | 위 두 행 |

- OOPIF 부착 방법(성공): `page.cdp("Target.getTargets")` → `page.cdp("Target.attachToTarget",{flatten:false})` → `page.cdp("Target.sendMessageToTarget", Runtime.evaluate)` → `page.events()`의 `Target.receivedMessageFromTarget` 판독 (`scripts/d05-oopif2.mjs`). 실패한 방법: `task.cdp(..., {sessionId})`(옵션 미지원), `Target.setAutoAttach`(이벤트 0) — `logs/d05-run-C.txt`·`logs/d05-oopif-C.txt`.
- 주의: 마지막 루프 재실행이 C·A 모두 비교 보드 단계에서 실패해 `logs/d05-run-C.txt`·`logs/d05-oopif-C.txt`가 실패 로그로 덮어써졌다. 성공 수치(67.3392px · 1.333rem · 문구 "아침을 여는 한 잔의 커피")는 이 세션 실행 출력에서 확인한 값이며 원본 파일은 남지 않았다(`d05-oopif2-C.txt`도 최종 루프 이전 것이면 남음 — 아래 파일 목록 참조).
- (1차) 판정 미완 이유: 판정 조건 "(선택 안 값) ≠ (A안 값)" 중 A안 값 미실측.
- R2a 1차 실패 원인(실측): 비교 추가 버튼 판별을 `aria-label === "<제목> 비교 추가"`로 했는데 일치 요소가 없어(이름은 aria-label 아닌 다른 경로로 계산됨) 클릭이 건너뛰어짐 → 트레이 0/6 → 비교 보드 빈 상태 → 전부 선택 0개. `(aria-label || textContent).trim()` 일치로 바꾸자 2/6 담김·전부 선택 2개 노출(`logs/r2a-A.txt`·`r2a-A2.txt` 실패 → `r2a-A3.txt` 성공). 이전 BLOCKED의 "상태 토글 추정"도 같은 원인일 가능성이 높다(추정).
- R2a: `프로필 확정` 버튼은 `missing`(전부 선택 후 바로 3안 만들기 단계로 진행) — 흐름에는 영향 없음. 브리프 지정 로그명 `logs/r2a-A.txt`는 1차 실패 로그로 남겼고(덮어쓰기 금지), 성공 로그는 `logs/r2a-A3.txt`.

## 2. B-SEC-09 ②④ — 정적 zip file://
**판정 (R2b): BLOCKED** — 앱 버튼으로 정적 zip을 받지 못해 ②④ file:// 실측 전부 미실행 (`logs/r2b-export.txt` · `logs/r2b-file.txt`).

| 단계 | 결과 | 근거 |
|---|---|---|
| A v1 문서(이미지 섹션 있음) zip 버튼 | 다운로드 60s 없음 — 품질 게이트 차단 3건(대비 AA C-5 muted/bg 3.8:1, SEO 메타 2) "고치면 열립니다" | `logs/r2b-export-run.txt` · `scripts/r2b-export.mjs` |
| 게이트 통과 경로(보정값 v2 → 3안 v2 → B안 새로 시작 → SEO) | 보정 저장 v2까지 성공, "B안으로 편집 시작" 클릭 후 대화상자·/studio 이동 없음(3회) | `logs/r2b-export2~7-run.txt` · `scripts/r2b-export2·4·5·7.mjs` |
| zip 경로·sha256·바이트 / CSP·이미지 n/n·fonts·390 메뉴·양성 대조 | 미실행 | `logs/r2b-file.txt` |

- 원인 추정(확인 필요): 같은 TaskSpace 이전 실행 상태 잔존(profile-6) 또는 B안 편집 시작 버튼 무반응. 앱 결함인지 스크립트 문제인지 미판별.
- 다음 실행 권고: 새 TaskSpace 한 번의 스크립트로 qa-flow2 경로 실행, 보정값 쓰기 뒤 대기를 2s 이상으로, B안 편집 시작 직후 화면 텍스트를 먼저 덤프.

## 범위 밖
Safari·Firefox·Windows·Archive Utility는 범위 밖(수동 — 사람 필요).

## 정리
- R2b: preview 4399 사전 lsof 0줄(`logs/r2b-lsof-before.txt`) · 종료 후 0줄(`logs/r2b-lsof-after.txt`) · TaskSpace `release-check-live r2b`/`r2b-2` → `finish({keep:[]})` (`logs/r2b-ego-finish.txt`) · `$TMPDIR/r2b-zip` 삭제.
- R2a: preview 4399 사전 lsof 0줄(`logs/r2a-lsof-before.txt`) · 종료 후 0줄(`logs/r2a-lsof-after.txt`) · TaskSpace `release-check-live r2a`/`r2a-2`/`r2a-3` → `finish({keep:[]})` (`logs/r2a-ego-finish.txt`).
- preview 4399: 사전 `lsof -nP -iTCP:4399 -sTCP:LISTEN` 0줄(`logs/lsof-before.txt`) · 종료 후 0줄(`logs/lsof-after.txt`).
- ego-browser TaskSpace `release-check-live 05d` → `finish({keep:[]})` (`logs/ego-finish.txt`).

## 다음 실행 권고
1. 05d A안: 새 TaskSpace(또는 탭 새로 열기)로 비교 목록 상태 초기화 후 `PICK=A` → `scripts/d05-oopif2.mjs`. 기대 48.828px · 1.25rem.
2. B-SEC-09 ②④: 별도 실행으로 BRIEF §2 그대로.
