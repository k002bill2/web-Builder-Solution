# M2A-2b 데스크톱 1280 프레임 + 본문 4변형 + 캡션·변형 목록 + 웹폰트 정리 — REPORT

- **작성: Jarvis** — 레인이 2회 연속 턴 한도(110 · 재개 40)로 끝나 REPORT를 쓰지 못했다. 영환님 ★A(2026-10-03)에 따라 `PROGRESS.md`·`logs/`·`shots/`와 Jarvis 게이트로 정리했다. 레인 자체 문장이 아닌 곳은 "Jarvis"로 표시.
- 브리프 `docs/06-handoff/M2A-2B_BODY-VARIANTS_BRIEF.md` · 시작 커밋 `fdb5a06` · 브랜치 `k002bill2/m2a-2b` · 마지막 레인 커밋 `49e7f97`

## 1. 커밋 표
| 단계 | RED | GREEN | 내용 |
|---|---|---|---|
| 수신·B0 | — | ba8ca37 · ad5606b | 수신 기록 · gate.sh · 기준선 `B0-BASELINE.md` · shots/b0-* |
| B1 | b13159f | 11ef218 | 데스크톱 프레임 1280(`FRAME_REM.desktop` 80) · 오버레이를 축소 층 밖에서 "사각형 × 비율" |
| B2 | e1a0213 | 058409f | about/story — 2단↔1단 · 이미지 비율 = media_ratio · 이미지 끔 1단 |
| B3 | b011807 | 55bda93 | services/cards-3 — 카드 톤 변수(light/dark × base/alt) · 카드 모양 4종 |
| B4 | 6e4b8a2 | 49ee117 | faq/accordion — 네이티브 `details/summary` |
| B5 | b5b08da | ceec4dd | contact/form — K2 A안(비활성 폼 + 방문자 안내) · 편집 패널 주인용 안내 |
| B6 | 54240f1 | f50d04a | 캔버스 캡션 3상태 · "페이지 미리보기" · `RENDERED_VARIANTS` + 가드 · 주인용 안내 조작 뒤 청크 |
| B7 | c69148e | 9cb65c3 | 변형 목록 " · 구조 미리보기" |
| B8 | 3adc892 | d569f44 | 렌더 문서 웹폰트 제거 |
| B9 | d3966a7 · 7001376 | 19dd51a | 공통 K-AC [U]·[B] — **d3966a7은 typecheck exit 2인 채 커밋**, 7001376에서 수정 |
| B10 | — | 49e7f97 | 앱 흐름 A안 1280·390 캡처 |

## 2. 데스크톱 프레임 · 오버레이 정렬 (B1, r4.10)
- 렌더 문서 iframe 폭 = 1280. 캔버스 열보다 넓으면 축소 보기(1280 창 **56%** · 1024 창 **53%** · 390 창 27%), 캡션 "축소 보기 · N%", 가로 스크롤 0.
- 오버레이(선택 칩·테두리·문제 표시·배지)는 축소 층 **밖**에 두고 렌더 문서가 보고한 사각형에 비율을 곱해 위치를 잡는다. 브라우저 1280·1024에서 선택 상자 = iframe 원점 + 사각형×비율 일치(`logs/b1-shots.txt`, `shots/b1-*`).
- 렌더 문서는 1280에서 `lg` 이상 배치(메뉴 가로 펼침 · CTA 바 오른쪽) — `shots/b10-1280-01.png`.

## 3. 카드 톤 변수 (B3)
- `--site-card-face-base` · `--site-card-face-alt` · `--site-card-top` · `--kit-soft`(base = muted, alt = ink). 4조합(light/dark × base/alt) 카드 면 실측은 `logs/b9b-*`.

## 4. K-AC 판정 (Jarvis 정리 — 근거는 PROGRESS B2~B9·logs)
| K-AC | 판정 | 근거 |
|---|---|---|
| 22(about) · 23 · 24 | PASS | [U] B2 · [B] 23 이미지 끔 1단, 24 비율 16:9·4:5·1:1 각 1280·390 ±0% (`logs/b9b-tail.txt`) |
| 25 · 26 | PASS | [U] B3 · [B] 같은 행·같은 높이 · 모양 4종 radius·경계·그림자 · 카드 면 4조합 |
| 27 · 28 | PASS | [U] B4 · [B] Enter/Space 열고 닫힘, 포커스 summary |
| 08(마크업) · 29 · 30(배치) | PASS | [U] B5 · [B] 비활성 색 opacity 1 · 1280 2단/390 1단. **정적 HTML 부분은 M2A-3** |
| 33 | PASS | [U] B6 · B10 실측 캡션 "실제 렌더 (F1 · 일부) — 섹션 9개 중 2개는 아직 구조 미리보기입니다. …" · h2·iframe 이름 "페이지 미리보기" |
| 02 · 03 · 04 · 05 · 09 | PASS | [U] kitCommon 7변형 · [B] 상한 글자 + 200% 1280·390 넘침 0·말줄임 0 |
| 11 · 36 | PASS | [B] 프로필 2벌 × 톤 orig/flip × 1280·390 허용 밖 색 쌍 0 · 최소 대비 4.56(dark 카드) / 4.93(light) |
| 15 | PASS | 축소 보기 정렬은 B1 브라우저 실측. 표식 위치 `B9 marker@1280` |
| 06 · 12(이동) · 17 · 18 · 19 · 32 · 34 | — | M2A-3 범위 |

## 5. 테스트 이관 (삭제·약화 0 — 레인 커밋 메시지·PROGRESS 기준)
- "구조 미리보기" 캔버스 이름을 보던 단언 → "페이지 미리보기"(54240f1)
- 변형 목록 라디오 접근 이름 → " · 구조 미리보기" 포함 이름(c69148e)
- kitCommon K-AC-09 h3(카드) · K-AC-11 허용 색 집합(+`--kit-soft`, muted는 base만)(B3)
- 레지스트리·kitCommon 변형 개수 3 → 7(B2~B5)

## 6. 번들 (gzip KB, PROGRESS 메모 누계 + Jarvis HEAD 실측)
| 단계 | `/studio` 진입 직후 | 렌더 JS / CSS |
|---|---|---|
| B0 | 124.23 | 78.86 / 5.76 |
| B1~B4 | 124.24 | 78.86 → 79.43 / 5.76 → 6.23 |
| B5 | 124.40 | 79.89 / 6.48 |
| B6 | 124.81(초과) → 주인용 안내 조작 뒤 청크로 124.69 | 79.89 / 6.48 |
| B7 | 124.71 → 오버레이 style 숫자화·감싸개 정리로 **124.70** | 79.89 / 6.48 |
| B8 = HEAD | **124.70**(브리프 한도, 여유 0) · 첫 화면 91.72 | **79.89 / 6.32** |
- 그 밖 화면(Jarvis 실측 HEAD): 공통 89.34 · /catalog 99.64/102.03 · /compare 98.75/121.40 · /profile 99.60/123.64 — B0 대비 ±0.01.
- 렌더 빌드는 청크를 나누지 않음 → Codex P2(manifest 병합 키 충돌) 손대지 않음(브리프 조건).

## 7. 웹폰트 (B8)
- `render.css`의 `fonts.css` import 삭제. `--font-sans` = 프로필 계열 + 시스템 스택(폴백도 같은 스택). 폰트 요청 **3 → 0**(`logs/b8-fonts-before/after`) · 렌더 CSS 6.48 → 6.32 · dist render CSS `@font-face` 0.

## 8. 검증 (Jarvis)
- HEAD `49e7f97`: typecheck 0 · lint 0 · build 0.
- 전체 vitest ×3(Jarvis, load 38~45): **1552/1552 × 3**.
- 레인 `logs/final-full-x3.txt` run 1(load 13.6)에서 `StudioShell.test.tsx` "390: 캡션 늘 보임 · 이미지·외부 URL 0 · 불투명도 글자 0 · 선택 라벨 12px 토큰(caption2)" 1건 실패 → Jarvis `StudioShell.test.tsx` 파일 단독 ×10 = 10/10 통과. **간헐 실패로 판정하되 저부하에서도 났으므로 부하 원인으로 단정하지 않는다**(별건 등록, 기존 StudioShell 간헐 계열).
- 레인 run 3은 기록 도중 끊겼다.
- **Codex 검토: 미완**(`logs/codex-review.txt`가 diff 읽기 도중 끊김, 결론 없음). 영환님 ★A에 따라 M2a 전체 QA(push 전)에서 한 번에 받는다.

## 9. 명세·브리프와 다르게 한 곳
- B5 주인용 안내: 처음 eager Callout(+0.16) → B6에서 조작 뒤 청크 `ContactOwnerNote`(Callout은 prop으로 받음 — DS를 그 청크에서 import하면 125.10 실측).
- B10 캡처 도구: ego-browser `Page.captureScreenshot`가 이번 실행에서 계속 시간 초과(`logs/b10-shots.txt`) → DOM 수치는 ego-browser(CDP 폭 1280·390), 화면은 aside 브라우저 `shots-aside.js`(같은 출처 래퍼 iframe 폭 1280/390, 같은 앱 흐름)로 찍었다(`shots/b10-*`, `logs/b10-aside.txt`).

## 10. 남은 위험 · M2A-3에 넘길 것 (Jarvis)
1. **`/studio` 진입 직후 124.70 = 여유 0**(실예산 125 대비 0.30 = 멈춤선). M2A-3는 부모에 내보내기 버튼·이유 목록·PNG 상태를 더한다 → **먼저 공간 확보**(내보내기 영역 전체를 조작 뒤 청크로 등) 실측이 선행 조건.
2. 렌더 JS 79.89 / 멈춤선 89.70 — M2A-3의 직렬화·캡처 코드는 조작 뒤 로드(예산 판정 밖)가 원칙(m2a 3.3).
3. 오버레이 문제 문장 겹침 — Designer 시각 QA 대기(손대지 않음).
4. 이미지 업로드·보관소 없음(A3-3). K-AC-12 앵커 이동 · K-AC-08·30 정적 HTML 부분 · 폴백 X-1 색 조합이 내보내기에 섞이는지(`UNRENDERED_SECTIONS`가 막는지) — M2A-3.
5. typecheck 실패 중간 커밋 `d3966a7` 1건이 이력에 남는다(`--no-ff` 병합, 다음 커밋에서 수정).
6. 간헐 실패: StudioShell "390 캡션"(저부하 1회) — 별건.
