# M4-b-2 QA 1차 PROGRESS (정적·회귀, 브라우저 금지)

대상 tip `89d88dbf`. 보고서 `QA-REPORT.md`, 2차 계획 `QA-LIVE-PLAN.md`.

- [x] 1. fresh typecheck·lint·test·build · 예산(/studio ≤128.83, 복원 ≤131.81, 타 라우트 증분 0) · 진입 정적 포함 0 가드 양성/음성
- [x] 2. RZ-AC 01~20·C1·C3 재판독 (이름만 맞는 테스트 0)
- [x] 3. 변이 6종(되돌림) FAIL 확인
- [x] 4. 산출 zip docker node:22 `npm ci && npm run build` ($TMPDIR)
- [x] 5. exportFlow.ts:76 메일 첨부 안내 react-zip 3MB 초과 판정
- [x] 6. QA-LIVE-PLAN.md 작성(계획만)
- [x] 마감: 판정 확정 · git status 빈 값

판정: 조건부 PASS (P1 M6 생존). 상세 QA-REPORT.md.

---

# M4-b-2 QA 2차 PROGRESS (실화면 — QA-BRIEF-LIVE.md)

대상 tip `06ca2b39`. 순서 R1 → R4 → R2, 절마다 QA-REPORT 10절 커밋.

- [x] 0. 준비: build + preview 4399, 문서 준비(모던 카페 + 보정값 v2 + 새로 시작)
- [x] R1-a. 앱 버튼 → `_react.zip` 내려받기 · 파일 이름
- [x] R1-b. $TMPDIR 풀기 · docker node:22 `npm ci && npm run build` exit 0
- [x] R1-c. 1차 테스트 경로 zip과 `src/kit/*.css`·`package-lock.json` 바이트 비교
- [x] R1-d. 이미지 문서 1회 (UUID 0)
- [ ] R4. 1280·390 status 1 · 결과 줄 원문 · 메일 0 · 청크 차단→alert→재시도 성공 · 포커스 · 390 버튼
- [ ] R2. 1280·390 정규화 DOM · 390 메뉴 · masonry
- [ ] 마감: preview 종료·리슨 0 · IDB 삭제 · 판정 1줄 · git status 빈 값
