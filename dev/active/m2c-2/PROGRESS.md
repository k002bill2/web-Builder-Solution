# M2C-2 PROGRESS — 렌더 쪽 + 예산 가드

- base `c870439` · 브랜치 `k002bill2/m2c-2` · 서브에이전트 0 · 서버 기동 0(이 레인에 [B] 없음)
- 시작 실측(`logs/build-start.txt`): `/studio` 진입 127.36 · 렌더 JS 83.03 · CSS 8.75 · 테스트 216파일/1876개 exit 0(`logs/test-start.txt`)

## 체크리스트
- [x] P0 — BRIEF·PROGRESS 커밋
- [x] ① 예산 검사기 개정(기준선 파일 + /studio 진입 +0.03 · 렌더 JS 89.70 실패) — 예측 커밋 → RED → GREEN
- [x] ② 프로토콜 images `{blob,width,height}` + `loading:"eager"` + StructureCanvas 송신부 타입 이전 — 단독 typecheck
- [ ] ③ 결정적 SVG 자체 그래픽 · masonry 원본 비율 · map contain · decode 대기 · serializeSite lazy 복원
- [ ] 마감: typecheck · lint · build · 전체 vitest exit 0
- [ ] Codex review --scope branch --base c870439 (≤2라운드)
- [ ] REPORT.md (IMG-AC↔테스트 · 번들 전후 · 한계)

## 메모
- ① 예측(RED 전): bundleBudget.test.mjs 새 테스트 6개 — 6개 모두 RED 예상(기준선 옵션·파일 없음). 기존 8개 GREEN 유지.
- ① GREEN: 14/14(`logs/green-1-budget.txt`) · 실제 dist 판정 = 127.36 ≤ 127.39 통과 · 테스트 파일에 `@vitest-environment node` 추가(import.meta.url 파일 경로)
- ② 예측(RED 전): protocol.test 새 3개(IMG-AC-22 메타 · loading · IMAGE_DECODE_FAILED) + 개정 3개(protocol images · RenderApp K4 입력 모양만 · StructureCanvas 송신). RED 예상 5(새 3 + protocol 개정 + RenderApp 개정), StructureCanvas 개정은 런타임 통과·typecheck 실패 예상. RenderApp.test는 SPEC 10절 grep 누락 — IMG-AC-22 해당 · 단언 불변(입력 모양만)
- ② GREEN: render+StructureCanvas 84/84 · 단독 typecheck 통과 · build(`logs/build-2.txt`): /studio 진입 127.36 → **127.37(+0.01 — readRenderMessage의 IMAGE_DECODE_FAILED 코드 문자열, StudioLayout 청크)** · 렌더 JS 83.03 → 83.10. M2C-3·캡션 몫 남은 감지선 여유 0.02
- ③ 예측(RED 전): 새 테스트 11개 — art.test 7(결정성 3 · 접근성/CSS 2 · 꺼짐 1 · 맞춤 1) + 즉시 로드 1(art.test 안 — 실제 합계 art.test 8) · PortfolioGallery IMG-AC-17 1 · RenderApp decode 3 · serializeSite 1 = **13개**. RED 예상 12(IMG-AC-21 꺼짐은 지금도 참 — 회귀 가드라 GREEN 예상). 개정: PortfolioGallery masonry(gradient→art) 1 + 다른 킷 gradient 기대 테스트(목록 안)는 GREEN 단계에서 개정
