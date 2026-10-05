# M2B-5 Designer 브리프 — 3안 실렌더 나란히 비교 명세

- 역할 Designer / Orca managed Claude Code / worktree m2b-5-spec / base `292e7b6`(30/30·폰트·모션, origin 반영).
- 영환님: "추천대로 진행" 위임. 기능·솔루션 우선, 목업 모양 복제 금지. 이 레인은 **명세 문서만**(코드 0) → 다음 M2B-5 Developer가 추측 없이 구현.

## 현재 사실 (먼저 확인)
- 3안은 `/profile/:id`(`pages/ProfilePage.tsx`, `features/profile/CandidatesSection·CandidateCard·CandidateTable·CandidateResults.tsx`, `profileEngine.ts`)에 **와이어프레임**(SectionPlan 블록, aria-hidden)으로 보인다. 설계 원본 `docs/design/2a-04/SPEC.md` 4절(3안 생성·비교)·5절(5폭·키보드·라이브 영역)·7절(번들)·10절 결정.
- 실렌더 경로: 편집기 `/studio`의 sandbox iframe 렌더 문서(`render.html`, `features/studio/previewFrame.ts`·protocol·`allow-scripts`만, 1280 축소 보기), 3안 → 문서 변환은 `data/startDocWrite.ts`(`createDocFromCandidate`)·`engineVariantMap.ts`.
- 예산(ADR-004 개정4, `app/scripts/check-bundle-size.mjs`): `/profile` 첫 화면 **99.61/100KB(여유 ≈0.39KB)** · 진입 118.67/125KB. `/compare` 진입 121.72/125. 렌더 문서 JS 83.03/89.70 · CSS 8.75/30. 렌더 문서는 앱 번들과 별도.
- M2B_PLAN: "3안 실렌더 나란히 비교(`/compare` 또는 3안 화면 — 예산 실측 먼저)", 와이어프레임 모양표 폐기는 30/30 뒤 별건.

## 산출물 (쓰기: `docs/design/m2b/`, `dev/active/m2b-5-spec/`만)
`docs/design/m2b/SPEC-COMPARE3.md`:
1. **위치·진입**: `/profile` 3안 영역 안 vs 별도 비교 보기(라우트/다이얼로그) — 예산·흐름·키보드 근거로 1안 추천. `/compare`(레퍼런스 보드)는 다른 화면임을 구분.
2. **표시**: 3안 나란히(1280·1024·768·390 반응형 — 좁은 폭 대안), 축소 비율·고정 높이/스크롤, 같은 스크롤 위치 동기화 여부, 안 이름·차이 축·lint·선택 버튼과의 관계, 와이어프레임 처리(유지/대체 — 이번 범위 결정 근거).
3. **로딩·성능**: iframe 3개 지연 생성(보일 때/요청 시), 동시 렌더 수 상한, 실패·시간 초과·미렌더(폴백) 상태 문구, 모션은 최종 상태(캔버스 규칙), 폰트 로드 규칙(4a) 상속.
4. **접근성**: iframe title·포커스 진입 여부(미리보기는 비대화형 권장 근거), 키보드 순서, 스크린리더에 보일 요약(차이 축 텍스트), reduced-motion.
5. **보안**: sandbox `allow-scripts`만, `allow-same-origin` 금지, 사용자 데이터 삽입 경로·postMessage 출처 검증 재사용.
6. **번들 계획**: 첫 화면 증가 0 원칙(진입 직후 또는 조작 뒤 청크), 예상 증가와 멈춤선, 측정 방법. 예산 상향이 필요해 보이면 대안과 함께 MQ로.
7. **수용 기준 CMP-AC**([U]/[G]/[B])·QB 목록·깨질 기존 테스트 예상·Developer 단계 계획(시제품 예산 실측 먼저).
8. `docs/design/m2b/MQ-M2B5.md`(필요할 때만): 결정 항목 번호 선택지 ★추천·트레이드오프·사실/추정 구분.
9. `dev/active/m2b-5-spec/{PROGRESS.md,REPORT.md}`.

## 금지·운영
- 코드·package*.json/lock·CLAUDE.md·`docs/decisions/` 수정, 외부 사이트 크롤링·GDWEB/dbcut, APFS 브랜드 요소.
- 서브에이전트 0, 필요 시 서버 4337/4339 loopback·자기 PID 종료, main 5480 무접촉, push/merge/삭제 0.
- Codex adversarial/branch review 1~2라운드 권장(실제 완료 결과만 기록). 40턴부터 REPORT 마감 우선. 한국어 보고.
