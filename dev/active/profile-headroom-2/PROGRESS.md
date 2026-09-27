# PROFILE-HEADROOM-2 — PROGRESS

> 브리프 `docs/06-handoff/PROFILE-HEADROOM-2_BRIEF.md` 수신 2026-09-27 · 브랜치 `k002bill2/profile-headroom-2` · base `822139e`(main `1d5ae03` + 브리프) · 포트 4345 · 서브에이전트 0.

## 체크리스트
- [x] P0 base build — `logs/base-build.txt` exit 0 · `/profile` 첫 99.60 / 진입 **124.70** · profileEngine 9.98 · ProfilePage 7.18
- [x] P1 임시 실측(`logs/h1-measure.txt`) → 1안 변형 3(c) 구현 → build(`logs/h1-build.txt` exit 0, lint 0) → `/profile` 진입 **123.57**(여유 1.43), 다른 화면·공통 ±0.01
  - 변형 1(profileEngine이 `chunkRetry` 정적 import): 123.61이지만 chunkRetry가 따로 떨어져 공통 +0.02·/profile 첫 +0.04 등 전 화면 증가 → 기각
  - 변형 2(a)(plain import): 123.42·부작용 0이지만 Chromium 실패 캐시로 다시 시도 불가 → 기각
  - 변형 2(b)(2안 자리 `writeBodyLoader`에 로더): 청크 재배치로 /profile 첫 100.24·진입 125.51 예산 초과 → 기각(writeBodyLoader 원복)
  - 변형 3(c) 채택: `features/profile/candidateResultsLoader.ts` — retryableImport와 같은 새 URL 재시도를 chunkRetry import 없이(빌드 출력 파싱 확인: `CandidateResults-<해시>.js`)
- [ ] P2 테스트 기다림 조정(필요 시) · 새 테스트 RED→GREEN(로딩 표현·카드 3개·실패 다시 시도) → 커밋
- [ ] P3 전체 vitest 3회(`logs/full-x3.txt`) · final build · REPORT

## 메모
- `grep CandidateCard`: CandidateCard export(heroText·scaleText)는 CandidateTable·CandidateCard.test만 사용. studio·profileEngine 외부 사용 0 → 지연 로드 가능.
