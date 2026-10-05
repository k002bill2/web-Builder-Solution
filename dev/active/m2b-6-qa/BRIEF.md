# M2B-6 QA 브리프 — M2b 최종 게이트 (독립 QA)

- 역할 QA(구현자와 분리) / Orca managed Claude Code / worktree m2b-6-qa / base `e972fd9`(30/30·폰트·모션·3안 비교 병합).
- 목적: M2b 완료 판정 근거를 **새 실행**으로 만든다. 구현 레인 자체 판정은 참고만, 재사용 금지. 결함은 고치지 않고 재현·분류·심각도로 보고.

## 정본
- `docs/03-trd/TRD.md` TR-POL-04 루브릭, `docs/04-plan/M2B_PLAN.md`, `docs/design/m2b/{SPEC-BOUND,SPEC-BODY,SPEC-MOTION-FONT,SPEC-COMPARE3}.md`(각 QB 목록·MF-AC/CMP-AC [B] 항목), `docs/06-handoff/BACKLOG.md`.
- 각 레인 `dev/active/{m2b-1b,m2b-1b-hardening-qa,m2b-2a,m2b-2b,m2b-2c,m2b-4a,m2b-4b,m2b-5}/JARVIS_FINAL.md`의 "M2B-6 이관/한계" 항목.

## 범위 (순서 = 우선순위, 각 단계 PROGRESS 갱신·명시 경로 커밋)
1. **실렌더 30/30**: 엔진 30쌍 각각 렌더 문서에서 킷으로 그려지고 폴백 표식 0. 3폭(1280·768·390) 캡처 — 렌더 sandbox iframe fullPage 금지, 정적 HTML 사본 + Chrome headless `--screenshot`(390·768 iframe 래퍼) 우선, CDP 캡처는 2회 실패 시 즉시 headless로 전환. CSS는 원문 사용(cssText 직렬화 금지).
2. **3폭 시각 회귀 기준선**: 30변형 × 3폭 기준 PNG + 재현 스크립트(저장소 밖 의존성 0, dev/active/m2b-6-qa/ 아래) + 같은 문서 2회 캡처 픽셀 차이 0(결정성) 확인. 기준선 사용법을 REPORT에.
3. **루브릭 TR-POL-04 30/30 대조**: 변형별 표(통과/주의/실패 + 근거 캡처 경로).
4. **E2E 핵심 흐름(앱 안 클릭만, 새로고침 금지)**: 카탈로그 → 보드 확정 → /profile 3안 → "3안 실제 화면으로 비교"(3열·1안씩·폭 전환·이 안 선택·Esc 포커스 복귀) → 편집 시작 → /studio 캔버스 → 정적 HTML·PNG 내보내기(폰트 3계열 1개 이상, 모션 L2 문서).
5. **이관 항목 판정**(각 항목 PASS / 결함(P0~P3) / 환경 한계 / 사양 결정 필요로 분류):
   - M2B-5: 비교 대화상자 캡처(QB1·QB2, 1280 29% 판독성), 열기 직후 축소 전 프레임 순간 노출, 키보드 순서(스크롤 영역이 "이 안 선택"보다 먼저 — SPEC 2.1·4 충돌), 프레임 안 모션 최종 상태, 선택 실패 경로.
   - M2B-4b: 정적 HTML 등장 모션 실제 재생·1초 내 최종·reduced-motion, grid 타일 A 확대 제외 편차의 시각 영향.
   - M2B-4a: 정적 HTML·PNG 폰트 적용, B9 PNG 4.9초 경계 흔들림(측정 여유 문제인지 판정), 정적 HTML 크기(Serif ≈1.0MB) 기록.
   - M2B-2c: 비활성 예약 폼이 활성처럼 보이는지, CTA 키보드 Tab 링(autofocus 아닌 Tab 이동).
   - M2B-2a/2b: masonry 2종·grid-2 큰 4:5 칸 시각, 실제 로컬 이미지 갤러리(앱에서 이미지 넣을 경로 없으면 "환경 한계"로).
   - M2B-1b: header 4변형 메뉴 Esc 직후 visibility.
   - 이전 미해결: 390 데스크톱 축소 판독성, 폴백 표식 판독성, 390 첫 그리기 빈 상자, 자기 슬롯 배지 끝 1자 덮음.
6. **회귀 게이트**: 전체 vitest 기본 1회 exit0·Errors0, `npm run build` 번들 표(렌더 JS ≤89.70 · CSS ≤30 · 라우트별 첫 화면/진입).

## 제약
- 앱 코드·테스트·docs·design·package*.json/lock·CLAUDE.md 수정 0. 쓰기는 `dev/active/m2b-6-qa/`만(캡처·스크립트·로그·기준선 포함). 새 의존성 0.
- Safari·Firefox 등 실측 환경 없으면 "미검증"으로 명시(모의 결과를 실측이라 하지 않음).
- 서브에이전트 0, 서버 4337/4339 loopback·자기 PID cwd 확인 종료·lsof 0, main 5480 무접촉, push/merge/삭제 0, 승인 실패 우회 금지.
- 70턴부터 새 측정 확장 금지·REPORT 마감 우선. REPORT(한국어): 실제 meta·단계별 결과표·결함 목록(재현 절차·심각도·증거)·환경 한계·M2b 완료 판정 의견(Go / 조건부 Go / No-Go와 근거)·책임/환경.
