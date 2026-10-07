# M3P-7 Developer 브리프 — 레퍼런스 데이터 정합 묶음 (B-M3P-05 · 08 · 07)

- 역할 Developer / Orca managed Claude Code / worktree m3p-7 / base `be5292b`(ER-9 병합). `app/node_modules` lock 그대로 `npm ci` 완료.
- 영환님 **"★A"**(2026-10-07) — **큐레이션 픽스처 수정 승인 포함**(Jarvis 선택지 문구: "A를 선택하시면 큐레이션 픽스처 수정을 승인하신 것으로 보겠습니다").
- 정본: `docs/06-handoff/BACKLOG.md` B-M3P-05·07·08, `dev/active/m3p-5/REPORT.md`("기록만" 절 — 큐레이션 6 불일치 목록), `dev/active/m3p-6/REPORT.md`("알려진 차이" — 3안 미리보기 문구), `dev/active/er-9/JARVIS_FINAL.md`(About 2개 관찰), `app/src/data/engineVariantMap.ts`.

## 순서
1. **B-M3P-08 원인 특정(먼저, PROGRESS)**: 큐레이션 "동네 치과" 편집 문서에 About 섹션 2개(둘 다 "이야기 + 이미지" story). 섹션 계획 → `ENGINE_VARIANT_MAP` → 문서 생성 경로에서 어디서 중복되는지 L1(코드·테스트)로 특정. 데이터 문제면 3에서, 매핑·생성 로직 문제면 최소 수정(엔진·PageDoc 계약 변경이 필요하면 멈춤·보고). 다른 5개·생성 15개에도 같은 중복이 있는지 전수 검사 테스트.
2. **B-M3P-05 큐레이션 6 상세 정합(승인됨)**: 상세 섹션 계획의 변형 이름을 렌더(엔진 변형) 기준으로, ref-a Footer 누락 해소, ref-c~f 자유 표기 섹션 이름은 기존 섹션 종류 이름 규칙으로. 기준 = 생성 15와 같은 "상세 = 렌더 1:1" 규칙(M3P-5 `detailRender.test.ts`를 큐레이션까지 확장). 카드(`references.ts`)·비교 블록 변경은 필요한 경우만, 바뀐 필드 목록을 REPORT에.
   - **G5 해시 가드**(`internalCompose.test.ts` "기존 6개 픽스처 3벌 바이트 변경 0 (db9f25e 해시)"): 승인된 변경이므로 **같은 커밋에서 새 해시로 갱신**하고 테스트 이름·주석에 "M3P-7 영환님 ★A 승인 · 새 base"를 남긴다(가드 자체 삭제·약화 0 — 이후 무단 변경은 계속 잡혀야 함).
   - 썸네일: 큐레이션 6장 SVG가 바뀌면 버전 변경·변경 사유 기록(가드 통과 필수).
3. **B-M3P-07 3안 미리보기 문구**: `comparePreviews`(CompareDialog, `/profile` 조작 뒤 청크)에도 `industryCopy`를 적용해 미리보기 hero = 편집 시작 뒤 편집기 hero. 안내문 "편집 시작이 이 문서로 시작합니다"가 사실이 되게. `/profile` 첫 화면 99.72/100 · 진입 125 · 조작 뒤는 판정 밖(증가량 기록).

## 예산
- `/studio` 진입 128.56(기준선 128.55 · 판정선 128.58) — **증가 0 목표**, 판정선 넘으면 멈춤(기준선 수정 금지 — 개정 8 배분 끝). 다른 라우트 첫 화면 한도 초과 0, 렌더 변화 0.

## Ego Lite (영환님 지시)
- build + `vite preview --port 4337`(dev 금지), 창 minimized면 `Browser.setWindowBounds normal`, 캡처 `captureBeyondViewport:false`+뷰포트 clip(fullPage 금지), 첫 goto 1회 뒤 앱 안 클릭만·새로고침 금지. 확인: 동네 치과 → 프로필 → 3안 미리보기 hero 문구 → 편집 시작 → 편집기 About 1개·hero 같은 문구, ref-a 상세 섹션 구성에 Footer. 캡처 ≤3장(`dev/active/m3p-7/shots/`). 끝나면 `finish({keep:[]})` · `listTaskSpaces()`=[] 재확인, 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉.

## 마감·금지
- typecheck·lint·build(번들 표 전 행) · 전체 vitest 1회 exit0 · Codex review --scope branch --base be5292b(≤2) · REPORT(바뀐 큐레이션 필드 표 · 번들 증가량 · 썸네일 버전).
- TDD 예측 PROGRESS, RED 테스트 tip 커밋 금지, 단언 약화·skip 0(G5는 위 규칙대로 갱신만). 엔진·PageDoc 계약·docs/**·lock·CLAUDE.md·check-bundle-size·m2cBaseline 수정 0, 새 의존성 0, 외부 URL·실존 상호 0, APFS 0. 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **첫 3턴 안에 BRIEF P0 커밋.** **턴 관리:** 40턴 도달 시 새 구현 중단 → Ego Lite → vitest → Codex → REPORT. REPORT 초안 45턴 전 커밋.
