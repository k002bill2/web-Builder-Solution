# R0 기준선 (시작 커밋 72fe57f)

## 번들 (gzip KB, `logs/r0-baseline.txt`)
| 화면 | 첫 화면 | 진입 직후 |
|---|---|---|
| 공통 | 89.34 | — |
| /catalog | 99.65 | 102.03 |
| /references/:id | 97.00 | 99.38 |
| /compare · (조정 있음) | 98.76 | 121.40 |
| /profile | 99.60 | 123.64 |
| /projects | 94.01 | 107.07 |
| /studio/:projectId | 91.72 | 124.31 |

조작 뒤 `/studio`: docEngine +1.45 · AddSectionDialog +1.17 · VariantOptions +1.05.

## 스크린샷
`shots/r0-1280.png` · `shots/r0-390.png` (vite dev 127.0.0.1:4337, catalog → compare → 프로필 → 3안 → B안 편집 시작, `shots.mjs`).

## 캔버스 DOM을 보는 현재 테스트 (R4 "옮긴 단언 표" 기준)
| 파일 | 테스트 | 보는 것 |
|---|---|---|
| components/studio/StructureCanvas.test.tsx | 그리드 축 변형 — 새 변형 3개를 슬롯 목록대로 그린다 | 블록별 p 글자 순서 · 라벨 칩 · region "구조 미리보기" |
| 〃 | 변형별 모양 — data-layout · 카드 칸 수 · 줄무늬 aria-hidden | data-layout · data-cell · data-stripes · 칩 · 슬롯 글자 |
| 〃 | 캔버스 루트 CSS 변수 = 팔레트 · 중립 토큰 · 블록이 변수 색 | --canvas-* · 클래스 |
| 〃 | 문제 표시는 데이터 색과 무관 — 흰 앱 면 안 | 문제 글자 클래스 · bg-background-normal 조상 |
| components/studio/CanvasPalette.test.tsx | 문서 profileVersion의 팔레트 → --canvas-* 변수 | 캔버스 루트 style |
| 〃 | 프로필 없음 → 중립 토큰 · 편집 계속 | 캔버스 루트 style · 편집 region |
| components/studio/StudioLayout.test.tsx | 권장 초과 → 캔버스 문제 문장 · 필드 describedby 맨 앞 · "경고 1" | 캔버스 안 문장 · 배지 |
| 〃 | 필드 입력 → 캔버스 글자 반영 → 2초 뒤 저장 1회 … | 캔버스 안 "새 제목" |
| components/studio/EmptySlot.test.tsx | 글자를 모두 지우면 캔버스 자리표시 '제목을 입력하세요'(label-alternative) … | 캔버스 자리표시 글자·클래스 |
| 〃 | 선택 섹션이 아니어도 빈 글자 슬롯마다 자리표시 | 캔버스 "부제를 입력하세요" |
| pages/StudioShell.test.tsx | 섹션 줄 선택 → aria-current · 편집 h2 · 캔버스 라벨 칩 | 캔버스 칩 글자 |
| 〃 | 캔버스 섹션은 Tab 정지가 아니다 · 포인터로 누르면 같은 선택 | 캔버스 focusable 0 · data-instance-id 클릭 |
| 〃 | 라벨 = previewView 상수 … 전환 뒤 문서·선택 유지 | canvas textContent 동일 |
| 〃 | <1024는 캔버스 머리에 | 폭 그룹 위치 |
| 〃 | %i: 캡션 · 이미지·외부 URL 0 · 불투명도 0 · 칩 12px 토큰 (1280·1024·390) | 캡션 · img/iframe/[src] 0 · innerHTML · 칩 클래스 |
| 〃 | 3단·2단·탭 배치 · 순서 (region "구조 미리보기") | region 존재·순서 |
| features/studio/canvasLayouts.test.ts | 모양 표 4건 (레지스트리 전부 · 대표 · 기본 블록 · canvasVars) | 순수 함수 |
| features/studio/previewFrame.test.ts | 라벨·프레임 rem·축소 비율·캡션 4건 | 순수 함수 |
