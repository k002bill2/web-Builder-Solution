# P2-QA PROGRESS (TaskSpace 33 · preview 4337)

- [x] P0 BRIEF 커밋 (952eec1)
- [x] 0. build exit 0 + `vite preview --port 4337 --strictPort` · 창 normal(1877×1050)
- [x] 1. 실 UI 왕복 — **PASS** (기한 18턴 초과: 시나리오 준비 클릭 경로 탐색에 턴 소모)
  - 준비: 카탈로그 비교 추가 → 프로필 확정 v1 → 3안 → A안 → 편집 → 단색 PNG 800×400 → "지금 상태 저장"(수동 · 14:49)
  - 내보내기 전 IDB: images `project-1/4ef200c8-…` 800×400 webp bytes 2066 (640:930 · 800:1136) · docs 9섹션 · snapshot-1:manual · gen 10
  - 실제 내려받기 `모던-카페-브랜드-프로젝트_project_20261008.json` 13,115B · status "…프로젝트 파일을 내려받았습니다"
  - 지우기 → 가져오기: 확인 526ms 표시 → 요약 780ms · 포커스 BUTTON "가져오기" · shots/1-summary.png
  - 성공 뒤 "프로젝트 알림" `'모던 카페 브랜드 프로젝트' 프로젝트를 가져왔습니다` 1개 · 포커스 A "편집기 열기"(data-rename-for=project-1 줄) · sessionStorage `{}`
  - 가져온 뒤 IDB: images 같은 키·800×400 webp 2066 · 640:930 · 800:1136 (바이트 수까지 동일) · docs 9섹션 snapshot-1:manual · gen 1
  - 편집기: 섹션 9 · 스냅샷 "수동 · 14:49 · 프로필 v1 · A안" · Hero 파랑 단색 표시 (shots/1-editor.png)
- [ ] 2. AC-P04 다른 탭 차단 + 삭제 차단 회귀
- [x] 3. 확인 단계 소요 — ①에서 780ms (정체 없음)
- [x] 4. 요약 "파일 1MB" (13,115B) — IM-13 `파일 {N}MB` 대조 필요
- [ ] 5. 회귀 스모크 — Esc 포커스 PASS(열기 포커스 "파일 만들기" → Esc → "…파일로 내보내기" project-1) · 새로고침·손상 파일 미실행
- [ ] 6. 정리
- [ ] 7. QA-REPORT.md 커밋
