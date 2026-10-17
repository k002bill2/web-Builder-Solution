# M2 서브에이전트(읽기 전용 Explore) 조사 요약 — base manifest 기준 · 바이트는 추정
- 진입 = manifest 정적 imports만(bundleBudget.mjs:43-49,81-83). auto 키: references·referenceDetails·deferredStudio·memoryProjectRepository·StudioLayout·gateCheck. 복원 = + imageRestore.ts.
- 상위 청크: index 85.88 · StudioLayout 19.62 · issue 8.03 · react 3.23 · deferredStudio 2.71 · memoryProjectRepository 2.42 · StudioPage 1.80 · referenceDetails 1.36 · references 0.98 · contrast 0.89 (합 130.42 raw)
- A표 후보: ① resolve/choose 본문 → lazy ConflictCallout 청크(약 0.08~0.12) ② useProjectRepository+projectRepository 청크 합치기(vite codeSplitting, 0.04~0.08, 조작 뒤 +0.24 위험) ③ profileContrast+effectiveProfile 합치기(0.04~0.07, /compare 위험)
- B표 후보: ④ PageInfoFields lazy(~0.4, goTo 포커스 낙하) ⑤ ExportRetryAlert lazy(~0.3, 청크 실패 시 경고 계약) ⑥ gate·export 클릭 경로 lazy(0.2~0.3, 알림 비동기)
