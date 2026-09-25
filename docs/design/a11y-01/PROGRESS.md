# DS-A11Y-01 PROGRESS — 글자·상태 토큰 대비 정정 설계

- 역할: Designer · 2026-09-26 KST · 작업 공간 `ds-a11y-01` (main `ec43225` 기준, 브랜치 `k002bill2/ds-a11y-01`)
- 산출물: `SPEC.md`, `contrast_calc.py`(대비 재현 스크립트), 이 파일. `app/`·`design/` 변경 없음. 로컬 커밋만, push 없음

## 체크포인트
- [x] 브리프·QA-1A-03 REPORT 1·3절·ADR-003·1a-03 SPEC 1.1 읽기
- [x] 토큰 인벤토리: `colors.css` 글자·상태·역상 토큰, `app/src` 비테스트 `.tsx` 사용처(label-alternative 45줄/20파일, label-assistive 8곳, status 7곳, 역상 면 자식 9개)
- [x] 배경별 대비 계산 — `python3 docs/design/a11y-01/contrast_calc.py` (L2, 8비트 알파 합성)
- [x] 새 값: label-alternative 라이트 .76(최저 4.77)·다크 (194,196,200,.80)(최저 4.61), status-*-text 3개, 역상 토큰 4개
- [x] D-QA04·06 문구, 회귀 테스트 제안, A11Y-AC-01~18, 설계 질문 Q1~Q7
- [x] SPEC 커밋

## ADR-003 사유 기록 (목업과 다르게 한 부분)
- `--label-alternative`가 목업 캡션 회색(≈#858688)보다 짙음(#67686b) — 접근성(2순위) > 목업(4순위). 위계 normal > neutral > alternative는 모든 필수 배경에서 유지
- 상태 글자를 목업 상태색보다 짙은 전용 토큰으로 분리 — 면·아이콘 톤은 목업 유지

## 브리프와 다르게 한 부분
- placeholder: 브리프는 "WCAG 필수 아님"을 명시하라 했으나 W3C Understanding 1.4.3이 placeholder를 대상에 포함 → 정정(SPEC 3절)
- D-QA04 이름: 브리프 예시 형식은 WCAG 2.5.3(Label in Name) 위반 → 보이는 문구로 시작하는 형식(SPEC 7절)

## 신규 발견
- D-A11Y-N1: 상세 ScoreTile 점수 색(24px bold) 초록 2.30·주황 2.09 — 큰 글자 3:1도 미달. 범위 포함(A11Y-AC-10)
- D-A11Y-N2: Tag accent 글자 red 4.02·green 3.71·orange 2.95 — `--accent-*` 범위 밖이라 질문 Q5
- 범위 밖(brand): `--focus-ring` 흰 면 1.47 — 질문 Q4

## 주의·가정
- 다크 테마는 `app/src`에서 적용되지 않음 → 다크 AC는 토큰 단위 테스트로만 검증
- QA L1 실측(3.67)과 L2 계산(3.64) 차이 0.03 → 제안 값은 최악 배경에서 4.6 이상 여유
- 브라우저 실측은 하지 않았다(설계 단계). 구현 후 QA가 D-QA01~03·N1 재측정
- Codex 검토는 Jarvis 실행
