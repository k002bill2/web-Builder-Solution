# M2C-2 PROGRESS — 렌더 쪽 + 예산 가드

- base `c870439` · 브랜치 `k002bill2/m2c-2` · 서브에이전트 0 · 서버 기동 0(이 레인에 [B] 없음)
- 시작 실측(`logs/build-start.txt`): `/studio` 진입 127.36 · 렌더 JS 83.03 · CSS 8.75 · 테스트 216파일/1876개 exit 0(`logs/test-start.txt`)

## 체크리스트
- [x] P0 — BRIEF·PROGRESS 커밋
- [ ] ① 예산 검사기 개정(기준선 파일 + /studio 진입 +0.03 · 렌더 JS 89.70 실패) — 예측 커밋 → RED → GREEN
- [ ] ② 프로토콜 images `{blob,width,height}` + `loading:"eager"` + StructureCanvas 송신부 타입 이전 — 단독 typecheck
- [ ] ③ 결정적 SVG 자체 그래픽 · masonry 원본 비율 · map contain · decode 대기 · serializeSite lazy 복원
- [ ] 마감: typecheck · lint · build · 전체 vitest exit 0
- [ ] Codex review --scope branch --base c870439 (≤2라운드)
- [ ] REPORT.md (IMG-AC↔테스트 · 번들 전후 · 한계)

## 메모
