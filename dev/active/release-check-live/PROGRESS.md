# RELEASE-CHECK-LIVE PROGRESS (QA)

- [x] 0. npm ci · build (logs/npm-ci.log · logs/build.log `done 0`) · 4399 사전 lsof 0줄(logs/lsof-before.txt) · preview 4399 기동
- [x] 1. B-M2B-05d — PASS (R2a): C 67.3392px·1.333rem vs A 48.8288px·1.25rem, 계산식 일치 (logs/r2a-A3.txt)
- [x] 2. B-SEC-09 ②④ — R4에서 PASS(한계 있음, 아래 R4 절)
- [x] 마감: QA-REPORT · preview 종료 lsof 0줄 · ego finish · 커밋

## R2a (2026-10-22)
- [x] preview 4399 기동 — 사전 lsof 0줄 (logs/r2a-lsof-before.txt)
- [x] 새 TaskSpace에서 A안 실측 — 1·2차 실패(비교 추가 선택자), 3차 성공 48.8288px·1.25rem (logs/r2a-A3.txt)
- [x] 판정 B-M2B-05d PASS · QA-REPORT 1절·첫 줄 갱신
- [x] 마감: preview 종료 lsof 0줄 (logs/r2a-lsof-after.txt) · TaskSpace 3개 finish (logs/r2a-ego-finish.txt) · 커밋
- [ ] B-SEC-09 ②④ — BLOCKED: R2a 범위 밖, R2b 예정

## R2b (2026-10-22) — B-SEC-09 ②④ 정적 zip file://
- [x] preview 4399 기동 · 사전 lsof (logs/r2b-lsof-before.txt) · 새 TaskSpace
- [ ] 이미지 있는 문서 정적 zip 앱 버튼 내보내기 → logs/r2b-export.txt — BLOCKED: 품질 게이트 차단, 통과 경로가 B안 편집 시작에서 멈춤
- [ ] ditto 풀기 → file:// 1280→390 CSP·이미지·폰트·메뉴·양성 대조 → logs/r2b-file.txt — BLOCKED: zip 미확보
- [x] QA-REPORT 2절·첫 줄 판정
- [x] 마감: preview 종료 lsof 0줄 · TaskSpace finish · TMPDIR 삭제 · 커밋 · git status 빈 값

## R3 (2026-10-22) — B-SEC-09 ②④ 실제 생성기 zip file:// (방법 1)
- [x] dev 서버 4399 기동(사전 LISTEN 0) · ego TaskSpace "release-check-live r3"
- [ ] 방법 1 생성기 직접 호출 → logs/r3-export.txt — BLOCKED: 시간 상한(15분) 소진. 1차 FONT_FAILED(kit.css에 @font-face 없음, logs/r3-export-run.txt) → 2차 글꼴 통과·exportImages에서 readImage 반환 형태 불일치(pickVariant: variants 필요, logs/r3-export2-run.txt). 다음: readImage가 imageStore 레코드(variants) 형태를 돌려주도록 scripts/r3-export2.mjs 수정 후 재실행
- [ ] file:// 1280→390 CSP·이미지④·폰트·메뉴·양성 대조 → logs/r3-file.txt — BLOCKED: zip 미확보
- [ ] 방법 2(앱 버튼) — BLOCKED: 미착수(시간)
- [x] 마감: dev 서버 종료 lsof 0줄(logs/r3-lsof-after.txt) · TaskSpace finish(logs/r3-ego-finish.txt) · TMPDIR r3-* 삭제 · 커밋

## R4 (2026-10-23) — B-SEC-09 ②④ 마지막 시도 (readImage 계약 수정)
- [x] scripts/r4-export.mjs (readImage만 variants 형태로 수정 + TaskSpace 이름·zip 경로 r4)
- [x] dev 서버 4399 사전 lsof 0줄 (logs/r4-lsof-before.txt) · 생성기 직접 호출 1차 성공 → logs/r4-export.txt (602570 B, sha256 70f80e9c…)
- [x] ditto → file:// 1280→390 CSP 1·위반 0·이미지 2/2·fonts loaded·메뉴 닫힘·hash·양성 대조 위반 1/미실행 → logs/r4-file.txt
- [x] QA-REPORT 2-R4 · 첫 줄 판정 PASS(한계: 모듈 직접 호출·dev 서버 ?raw CSS 주입)
- [x] 마감: dev 서버 종료 lsof 0줄 (logs/r4-lsof-after.txt) · TaskSpace finish (logs/r4-ego-finish.txt) · TMPDIR r4-* 삭제 · 커밋
