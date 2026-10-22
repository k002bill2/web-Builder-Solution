# RELEASE-CHECK-LIVE PROGRESS (QA)

- [x] 0. npm ci · build (logs/npm-ci.log · logs/build.log `done 0`) · 4399 사전 lsof 0줄(logs/lsof-before.txt) · preview 4399 기동
- [x] 1. B-M2B-05d — PASS (R2a): C 67.3392px·1.333rem vs A 48.8288px·1.25rem, 계산식 일치 (logs/r2a-A3.txt)
- [ ] 2. B-SEC-09 ②④ — BLOCKED: 시간 상한 소진, 미착수
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
