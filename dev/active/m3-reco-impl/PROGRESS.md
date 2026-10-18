# M3-1 PROGRESS — 추천 모드 구현

브랜치 `k002bill2/m3-reco-impl` · base `268226f2` · 정본 `docs/design/m3/RECO-SPEC.md` r1 + 7a

## 체크리스트
- [x] BRIEF·PROGRESS 커밋
- [x] E0 Provider 통로 `runQueued` 최소 구현
- [x] E0 build 실측: `/studio` ≤ 128.74 · 다른 라우트 증분 ≤ 0.03
- [x] E0 생성 레퍼런스 21개 비교 행 커버리지 전수 확인 (SPEC 3.3 [미확인])
- [x] E0 REPORT 초안 커밋
- [x] E1 `domain/recommend.ts` + `RECO_SECTION_FIT` + 엔진 대조 가드 (T-REC-01~05)
- [x] E2 `tab=rec` 화면 (카드 3 + 2개 더 보기 · 근거 · 상태 · status 공유 · 로드 조건 테스트 · V2-AC-21 정정)
- [x] E3 승인 후 적용 (미리보기 차이 → 적용 → 되돌리기 · T-REC-06)
- [x] E4 검사기 SCENARIOS "/catalog (추천)" 행
- [x] E4 fresh 게이트 (typecheck · lint · test · build · bundle check)
- [x] E4 Ego Lite 390·1280 (preview 4399)
- [x] E4 Codex adversarial 1회 + 반영 1회
- [x] 마감: preview 종료·리슨 0 · untracked 0 · REPORT 결론

## 로그
- 2026-10-18 착수 · 0b9c5b65 BRIEF·PROGRESS
- E0 0c15fd78: runQueued(=enqueue 노출) · /studio 정규화 128.72(≤128.74) · 다른 라우트 ±0.01~0.03 · 21개 10/10행 · status 상시 렌더 확인(CompareTrayBar `<p role=status>` 항상 존재 → RQ-09 A 그대로)
- E1 계약 2a9be5a5 → 서브에이전트(worker, isolation worktree) 구현 중 — recommend + recommendSectionFit + 가드 테스트
- E2/E3 메인: RED `logs/e2-red.txt`(9 실패) → RecoView·RecoApply·recoText·recoLoader·CatalogPage·CompareTrayBar(Announcement)·ReferenceCard(children)
- E1 서브에이전트 완료: worktree `/Users/younghwankang/Work/web-builder-solution/.claude/worktrees/agent-ab17bb7f5985a6401`(브랜치 m3-reco-e1 · c664b2d9) → cherry-pick 89490499. 50/50. T-REC-01 결과 수용(REPORT 발견 1)
- E2/E3 GREEN 47/47 · 전체 3199 통과 · lint 0 · 예산 감량 1회(원인 2개 제거) 뒤 build exit 0
- E4 Ego Lite 24cc594d: 1280·390 필터→추천→근거→적용→/compare 초안 10행→되돌리기 · 넘침 0 · preview 종료 lsof 4399 = 0
- E1 서브에이전트 worktree 정리: node_modules 심링크 삭제 → `git worktree remove` → 브랜치 m3-reco-e1 삭제(c664b2d9는 89490499로 반영됨)
- Codex adversarial 1회: P2 1건(뒤 적용 실패 시 앞 되돌리기 기록 소실) → RED→GREEN 반영 · 최종 게이트 tc 0 · lint 0 · 3200 통과 · build 0 · 기준선 128.72·131.70 갱신
- 마감 확인: lsof 4399 LISTEN = 0 · git status --short(node_modules 외) 0 · REPORT 0절 결론 · 커밋 0b9c5b65·0c15fd78·2a9be5a5·89490499·4e4e8623·24cc594d·cd6dc2cd
- 마감 점검(advisor) 반영: 테스트 파일명 쓰기 경로 정리 · 되돌리기 세션 유지(WeakMap) · AC-11/12/16·청크 실패 테스트 6개 추가(`logs/fu-red.txt` 2 실패 → `logs/fu-green.txt` 78/78) · bundleBudget.test 기준선 기대값 갱신 · fresh 게이트 tc 0 · lint 0 · 3206 통과 · build 0 · Ego 2차 · lsof 4399 0

## R2 체크리스트 (BRIEF-R2)
- [x] R2-1 main 병합 · 충돌 2파일 main 기준선(128.79·131.77) · fresh build 실측
- [x] R2-2 `/catalog` 첫 화면 감량 1회(목표 ≤ 100.15, 동작 변화 0) — 100.46, 목표 미달(동작 변화 0 수단 소진, REPORT 0절 질문)
- [x] R2-3 fresh typecheck·lint·test·build
- [x] R2-4 REPORT 0·1절 갱신 · preview 리슨 0 · untracked 0
- R2 bf8329e4 병합(기준선 main 128.79·131.77) · /studio 128.80 · 복원 131.78 · 13f17354 감량 1회 /catalog 100.48→100.46 · 게이트 tc 0 · lint 0 · 361/3212 · build 0 · Ego 생략(DOM 변화 0) · preview 미기동

## FIX1 체크리스트 (BRIEF-FIX1)
- [x] BRIEF-FIX1 커밋 e825fcdb
- [x] D1a 8e93d64a 적용 청크 2개 retryableImport + 재시도 포커스(결과 영역 · 새 alert "다시 시도")
- [x] D1b 화면 청크 retryableImport — 예산 판정 → BLOCKED: `/catalog` 첫 화면 +0.31(> +0.05) 수용/revert 결정 필요(Jarvis)
- [x] N1 dcebcc52 "2개 더 보기" 뒤 포커스 = 4번째 카드 제목
- [x] N2 (N2 커밋) 390 대화상자 시각 순서 = DOM(Tab) 순서
- [x] N4 d1de5406 비활성 "이 추천 적용" aria-describedby
- [x] note 3 (note3 커밋) 지연 savePicks — 클릭 직후 "적용됨" 0 · status 빈 값
- [ ] fresh typecheck·lint·test·build
- [ ] Ego Lite 1회(E4 차단→해제→다시 시도→카드 · 390 Tab 순서)
- [ ] Codex adversarial 1회 + 반영 1회
- [ ] 마감: preview 종료·리슨 0 · untracked 0 · REPORT
- FIX1 로그: D1 RED `logs/fix1-d1-red.txt`(배선 가드 0/3) · 결과 영역 포커스 Red-Green(수정 제거 FAIL → 복원 PASS)
- D1 전체 build(`logs/fix1-d1-build.txt`): `/catalog` 100.46 → **100.77**(+0.31 > +0.05). 원인 = chunkRetry 청크(gz 306B)가 `/catalog` 첫 화면에 새로 들어옴 — 브리프 전제("이미 진입 직후 청크")는 `/catalog`엔 해당 없음(진입도 102.79→103.11). 감량 1회 = 화면 로더 감싸기 분리(D1a/D1b) 실측
- 감량 1회 실측 = D1a 단독 build(`logs/fix1-d1a-build.txt`): `/catalog` 100.48/102.82(+0.02/+0.03) · 추천 진입 109.46 · 다른 라우트 ±0.01 · /studio 128.80 · 복원 131.78. 초과분 +0.29 전부 = 화면 로더 감싸기(chunkRetry 청크). lazy import 감량은 기각(오프라인이면 chunkRetry 자신의 실패가 캐시돼 D1 재발 + 검사기 SCENARIOS 밖 — 쓰기 경로 밖)
- D1b(별도 커밋, `git revert` 1회로 뺄 수 있음): `/catalog` 100.77/103.11 · 추천 진입 109.47 — 멈춤선 100.90·검사기 101 안, 브리프 +0.05 밖
- N1·N4·N2 RED 확인 뒤 GREEN(N2 = 클래스 가드 — jsdom 배치 없음, 실배치는 Ego 390) · note 3 = 현재 코드 통과 → m3-1c 변이(저장 전 setApplied·announce) FAIL → 원복 PASS(`logs/fix1-note3-mutant.txt`)
